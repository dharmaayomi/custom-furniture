"use client";

import { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { getBackWallPosition, initTrialScene } from "./core/TrialSceneSetup";
import { CABINET_CONFIG, TrialRoomConfig } from "./core/TrialConfig";
import { LoadAsset, AssetLoadResult } from "./asset/AssetLoader";
import {
  getTrialResolvedDragTarget,
  tryStartTrialDragFromPick,
} from "./asset/DragBehavior";
import {
  clearRegistry,
  getAsset,
  registerAsset,
  unregisterAsset,
} from "./asset/TrialModelRegistry";
import { getTrialAssetById, TRIAL_ASSET_DRAG_TYPE } from "./core/AssetCatalog";
import { SpawnPoint, useTrialRoomStore } from "./store/useTrialRoomStore";
import { TrialThemeMode } from "./core/TrialLightingSetup";
import { createComponentAnchorHelper } from "./utils/DebugUtils";

/**
 * TrialRoomCanvas.tsx
 *
 * React entry point untuk Trial Room.
 * Tanggung jawabnya:
 *   1. Mount canvas
 *   2. Init scene (engine, camera, lighting, room, post-processing)
 *   3. Dengarkan request spawn dari panel kanan
 *   4. Cleanup saat unmount
 */

const toVector3 = (point: SpawnPoint) =>
  new BABYLON.Vector3(point.x, point.y, point.z);

const toSpawnPoint = (point: BABYLON.Vector3): SpawnPoint => ({
  x: point.x,
  y: point.y,
  z: point.z,
});

interface TrialMeshBounds {
  min: BABYLON.Vector3;
  max: BABYLON.Vector3;
}

interface TrialComponentInstance {
  assetId: string;
  instanceId: string;
  result: AssetLoadResult;
}

interface TrialFrameInstance {
  assetId: string;
  bounds: TrialMeshBounds;
  instanceId: string;
  components: TrialComponentInstance[];
  result: AssetLoadResult;
}

interface TrialInteractionPick {
  instanceId: string | null;
  kind?: string;
  mesh: BABYLON.AbstractMesh;
  pickInfo: BABYLON.PickingInfo;
}

interface TrialPointerOwnership {
  activePointerId: number | null;
  dragInstanceId: string | null;
  owner: "none" | "model";
}

const toCentimeters = (valueInMeters: number) =>
  Math.round(valueInMeters * 100);

const getScaledAxis = (
  currentScale: number,
  measuredSize: number,
  targetSize: number,
  mode: "keep" | "shrink" | "fill",
) => {
  if (measuredSize <= 0 || targetSize <= 0) {
    return currentScale;
  }

  if (mode === "fill") {
    return currentScale * (targetSize / measuredSize);
  }

  if (mode === "shrink" && measuredSize > targetSize) {
    return currentScale * (targetSize / measuredSize);
  }

  return currentScale;
};

const getHierarchyBoundsInLocalSpace = (
  rootMesh: BABYLON.TransformNode,
): TrialMeshBounds => {
  rootMesh.computeWorldMatrix(true);

  const renderMeshes = rootMesh.getChildMeshes();
  if (rootMesh instanceof BABYLON.AbstractMesh) {
    renderMeshes.unshift(rootMesh);
  }

  renderMeshes.forEach((mesh) => mesh.computeWorldMatrix(true));

  const inverseRootWorld = rootMesh.getWorldMatrix().clone();
  inverseRootWorld.invert();

  const min = new BABYLON.Vector3(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  );
  const max = new BABYLON.Vector3(
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  );

  renderMeshes.forEach((mesh) => {
    mesh.refreshBoundingInfo({ applySkeleton: true });

    mesh
      .getBoundingInfo()
      .boundingBox.vectorsWorld.forEach((worldCorner: BABYLON.Vector3) => {
        const localCorner = BABYLON.Vector3.TransformCoordinates(
          worldCorner,
          inverseRootWorld,
        );

        min.minimizeInPlace(localCorner);
        max.maximizeInPlace(localCorner);
      });
  });

  return { min, max };
};

const hasTrialAssetDragType = (event: DragEvent) =>
  Array.from(event.dataTransfer?.types ?? []).includes(TRIAL_ASSET_DRAG_TYPE);

const pickFloorPointFromClient = (
  scene: BABYLON.Scene,
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
) => {
  const rect = canvas.getBoundingClientRect();
  const pickX = clientX - rect.left;
  const pickY = clientY - rect.top;

  const pickInfo = scene.pick(pickX, pickY, (mesh) => {
    return mesh.metadata?.side === "floor";
  });

  return pickInfo?.hit && pickInfo.pickedPoint ? pickInfo.pickedPoint : null;
};

const getDefaultFrameSpawnPosition = (
  roomConfig: TrialRoomConfig,
  frameIndex: number,
) => {
  const position = getBackWallPosition(roomConfig, 0.01);

  if (frameIndex === 0) {
    return position;
  }

  const step = Math.ceil(frameIndex / 2);
  const direction = frameIndex % 2 === 0 ? 1 : -1;
  position.x += direction * step * 0.9;

  return position;
};

export const TrialRoomCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const updateThemeModeRef = useRef<
    ((themeMode: TrialThemeMode) => void) | null
  >(null);
  const { resolvedTheme } = useTheme();
  const themeMode: TrialThemeMode = resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    updateThemeModeRef.current?.(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const initialRoomConfig = useTrialRoomStore.getState().appliedRoomConfig;
    const {
      camera,
      scene,
      lighting,
      updateRoomConfig,
      updateThemeMode,
      dispose: disposeScene,
    } = initTrialScene(canvas, initialRoomConfig, themeMode);
    updateThemeModeRef.current = updateThemeMode;
    const selectionLayer =
      scene.getSelectionOutlineLayerByName("trial-selection-outline") ??
      new BABYLON.SelectionOutlineLayer("trial-selection-outline", scene, {
        mainTextureRatio: 2.0,
      });
    selectionLayer.outlineColor = new BABYLON.Color3(1, 0.85, 0);
    selectionLayer.outlineThickness = 2.5;
    selectionLayer.occlusionStrength = 0.6;
    selectionLayer.occlusionThreshold = 0.05;

    let isMounted = true;
    const frameInstances: TrialFrameInstance[] = [];
    let currentRoomConfig: TrialRoomConfig = initialRoomConfig;
    let modelInstanceSerial = 0;
    let pendingFrameLoads = 0;
    const pointerOwnership: TrialPointerOwnership = {
      activePointerId: null,
      dragInstanceId: null,
      owner: "none",
    };

    const setCameraInteractionEnabled = (enabled: boolean) => {
      if (enabled) {
        if (!camera.inputs.attachedToElement) {
          camera.attachControl(canvas, true);
        }
        return;
      }

      if (camera.inputs.attachedToElement) {
        camera.detachControl();
      }
    };

    const createModelInstanceId = (
      category: "frame" | "component",
      assetId: string,
    ) => {
      modelInstanceSerial += 1;
      return `trial-${category}-${assetId}-${modelInstanceSerial}`;
    };

    const syncLoadedProductStoreState = () => {
      const store = useTrialRoomStore.getState();
      store.setHasFrameProduct(frameInstances.length > 0);
      store.setActiveFrameProductIds(
        frameInstances.map((frame) => frame.assetId),
      );
      store.setActiveComponentProductIds(
        frameInstances.flatMap((frame) =>
          frame.components.map((component) => component.assetId),
        ),
      );
    };

    const getAllLoadedModels = () =>
      frameInstances.flatMap((frame) => [
        frame.result,
        ...frame.components.map((component) => component.result),
      ]);

    const getModelCategory = (instanceId: string | null) => {
      if (!instanceId) {
        return null;
      }

      for (const frame of frameInstances) {
        if (frame.instanceId === instanceId) {
          return "frame" as const;
        }

        if (
          frame.components.some(
            (component) => component.instanceId === instanceId,
          )
        ) {
          return "component" as const;
        }
      }

      return null;
    };

    const syncDragProxyPickability = (
      selectedInstanceId = useTrialRoomStore.getState().selectedMeshName,
    ) => {
      getAllLoadedModels().forEach((model) => {
        if (model.boundingBoxMesh) {
          model.boundingBoxMesh.isPickable =
            model.instanceId === selectedInstanceId;
        }
      });
    };

    const syncSelectionOutline = (
      selectedInstanceId = useTrialRoomStore.getState().selectedMeshName,
    ) => {
      selectionLayer.clearSelection();
      syncDragProxyPickability(selectedInstanceId);

      if (!selectedInstanceId) {
        return;
      }

      const selectedModel = getAsset(selectedInstanceId);

      if (selectedModel && selectedModel.selectionMeshes.length > 0) {
        selectionLayer.addSelection(selectedModel.selectionMeshes);
      }
    };

    const resolveFrameFromSelection = (selectedInstanceId: string | null) => {
      if (!selectedInstanceId) {
        return null;
      }

      const selectedFrame = frameInstances.find(
        (frame) => frame.instanceId === selectedInstanceId,
      );
      if (selectedFrame) {
        return selectedFrame;
      }

      return (
        frameInstances.find((frame) =>
          frame.components.some(
            (component) => component.instanceId === selectedInstanceId,
          ),
        ) ?? null
      );
    };

    const resolveComponentTargetFrame = () => {
      if (frameInstances.length === 1) {
        return frameInstances[0];
      }

      return resolveFrameFromSelection(
        useTrialRoomStore.getState().selectedMeshName,
      );
    };

    const findFrameIndexByInstanceId = (instanceId: string) =>
      frameInstances.findIndex((frame) => frame.instanceId === instanceId);

    const findComponentOwnerFrame = (instanceId: string) =>
      frameInstances.find((frame) =>
        frame.components.some(
          (component) => component.instanceId === instanceId,
        ),
      ) ?? null;

    const disposeComponentInstance = (
      frame: TrialFrameInstance,
      componentInstanceId: string,
    ) => {
      const componentIndex = frame.components.findIndex(
        (component) => component.instanceId === componentInstanceId,
      );
      if (componentIndex < 0) {
        return null;
      }

      const [component] = frame.components.splice(componentIndex, 1);
      useTrialRoomStore.getState().removeLoadedModel(component.instanceId);
      unregisterAsset(component.instanceId);
      return component;
    };

    const disposeFrameInstance = (frame: TrialFrameInstance) => {
      while (frame.components.length > 0) {
        disposeComponentInstance(frame, frame.components[0]!.instanceId);
      }

      useTrialRoomStore.getState().removeLoadedModel(frame.instanceId);
      unregisterAsset(frame.instanceId);
    };

    const deleteSelectedInstance = (targetInstanceId: string) => {
      const frameIndex = findFrameIndexByInstanceId(targetInstanceId);
      if (frameIndex >= 0) {
        const [removedFrame] = frameInstances.splice(frameIndex, 1);
        const fallbackFrame =
          frameInstances[frameIndex] ?? frameInstances[frameIndex - 1] ?? null;

        disposeFrameInstance(removedFrame);
        syncLoadedProductStoreState();
        useTrialRoomStore
          .getState()
          .setSelectedMesh(fallbackFrame?.instanceId ?? null);
        return true;
      }

      const ownerFrame = findComponentOwnerFrame(targetInstanceId);
      if (!ownerFrame) {
        return false;
      }

      const removedComponent = disposeComponentInstance(
        ownerFrame,
        targetInstanceId,
      );
      if (!removedComponent) {
        return false;
      }

      syncLoadedProductStoreState();
      useTrialRoomStore.getState().setSelectedMesh(ownerFrame.instanceId);
      return true;
    };

    const clearAllFrames = () => {
      while (frameInstances.length > 0) {
        disposeFrameInstance(frameInstances.pop()!);
      }

      syncLoadedProductStoreState();
      useTrialRoomStore.getState().setActiveMaterialProductIds([]);
      useTrialRoomStore.getState().setSelectedMesh(null);
    };

    const resolveInteractionPick = (
      clientX: number,
      clientY: number,
    ): TrialInteractionPick | null => {
      const picks =
        scene.multiPick(clientX, clientY, (mesh) => mesh.isPickable) ?? [];
      const selectedInstanceId = useTrialRoomStore.getState().selectedMeshName;

      const scoredPicks = picks
        .filter((pick) => pick.hit && pick.pickedMesh)
        .map((pick) => {
          const mesh = pick.pickedMesh!;
          const target = getTrialResolvedDragTarget(mesh);
          const instanceId = target?.instanceId ?? null;
          const category = getModelCategory(instanceId);
          const isBoundingBox = target?.kind === "bounding-box";

          let priority = 0;
          if (category === "component" && !isBoundingBox) {
            priority = 500;
          } else if (category === "frame" && !isBoundingBox) {
            priority = 400;
          } else if (isBoundingBox && instanceId === selectedInstanceId) {
            priority = 100;
          } else if (mesh.metadata?.side) {
            priority = 10;
          }

          return {
            category,
            instanceId,
            isBoundingBox,
            mesh,
            pick,
            priority,
          };
        })
        .filter((candidate) => candidate.priority > 0)
        .sort((left, right) => {
          if (right.priority !== left.priority) {
            return right.priority - left.priority;
          }

          return left.pick.distance - right.pick.distance;
        });

      if (scoredPicks.length === 0) {
        return null;
      }

      const winner = scoredPicks[0];
      return {
        instanceId: winner.instanceId,
        kind: winner.isBoundingBox
          ? "bounding-box"
          : (winner.category ?? undefined),
        mesh: winner.mesh,
        pickInfo: winner.pick,
      };
    };

    const registerDragLifecycle = (result: AssetLoadResult) => {
      if (!result.dragBehavior) {
        return;
      }

      const dragStartObserver = result.dragBehavior.onDragStartObservable.add(
        () => {
          result.syncBoundingBox();
          pointerOwnership.owner = "model";
          pointerOwnership.dragInstanceId = result.instanceId;
          setCameraInteractionEnabled(false);
        },
      );

      const dragEndObserver = result.dragBehavior.onDragEndObservable.add(
        () => {
          result.syncBoundingBox();
          pointerOwnership.owner = "none";
          pointerOwnership.dragInstanceId = null;
          pointerOwnership.activePointerId = null;
          setCameraInteractionEnabled(true);
        },
      );

      const disposeModel = result.dispose;
      result.dispose = () => {
        result.dragBehavior?.onDragStartObservable.remove(dragStartObserver);
        result.dragBehavior?.onDragEndObservable.remove(dragEndObserver);
        disposeModel();
      };
    };

    const prePointerObserver = scene.onPrePointerObservable.add(
      (pointerInfo) => {
        if (pointerInfo.type !== BABYLON.PointerEventTypes.POINTERDOWN) {
          return;
        }

        const pointerEvent = pointerInfo.event as PointerEvent;
        if (pointerEvent.button !== 0) {
          return;
        }

        const resolvedPick = resolveInteractionPick(
          scene.pointerX,
          scene.pointerY,
        );
        if (!resolvedPick?.instanceId) {
          pointerOwnership.activePointerId = null;
          pointerOwnership.dragInstanceId = null;
          pointerOwnership.owner = "none";
          useTrialRoomStore.getState().setSelectedMesh(null);
          return;
        }

        const selectedInstanceId =
          useTrialRoomStore.getState().selectedMeshName;
        const canStartDrag =
          selectedInstanceId === resolvedPick.instanceId &&
          getTrialResolvedDragTarget(resolvedPick.mesh) !== null;

        useTrialRoomStore.getState().setSelectedMesh(resolvedPick.instanceId);

        if (!canStartDrag) {
          return;
        }

        pointerOwnership.activePointerId = pointerEvent.pointerId;
        pointerOwnership.dragInstanceId = resolvedPick.instanceId;
        setCameraInteractionEnabled(false);
        pointerEvent.preventDefault();
        tryStartTrialDragFromPick(resolvedPick.pickInfo, pointerEvent);
      },
      BABYLON.PointerEventTypes.POINTERDOWN,
    );

    const pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type !== BABYLON.PointerEventTypes.POINTERUP) {
        return;
      }

      const pointerEvent = pointerInfo.event as PointerEvent;
      if (pointerOwnership.activePointerId !== pointerEvent.pointerId) {
        return;
      }

      if (pointerOwnership.owner === "none") {
        pointerOwnership.activePointerId = null;
        pointerOwnership.dragInstanceId = null;
        setCameraInteractionEnabled(true);
      }
    }, BABYLON.PointerEventTypes.POINTERUP);

    const finishSpawnRequest = (requestId: number) => {
      const store = useTrialRoomStore.getState();

      if (store.spawnRequest?.requestId === requestId) {
        store.clearSpawnRequest();
      }
    };

    const finishSelectionActionRequest = (requestId: number) => {
      const store = useTrialRoomStore.getState();

      if (store.selectionActionRequest?.requestId === requestId) {
        store.clearSelectionActionRequest();
      }
    };

    // FRAME
    const spawnFrame = async (
      _requestId: number,
      assetId: string,
      dropPoint: SpawnPoint | null,
    ) => {
      const asset = getTrialAssetById(assetId);
      if (!asset) {
        return;
      }

      const spawnIndex = frameInstances.length + pendingFrameLoads;
      pendingFrameLoads += 1;
      const initialPosition = dropPoint
        ? toVector3(dropPoint)
        : getDefaultFrameSpawnPosition(currentRoomConfig, spawnIndex);

      try {
        const instanceId = createModelInstanceId("frame", asset.id);
        const result = await LoadAsset(scene, {
          instanceId,
          modelPath: asset.modelPath,
          meshName: instanceId,
          initialPosition,
          initialRotationY: Math.PI,
          shadowGenerator: lighting.shadowGenerator,
          interactionMode: "frame",
          centerOnXAxis: true,
        });

        if (!result) {
          return;
        }

        if (!isMounted) {
          result.dispose();
          return;
        }

        if (!dropPoint && spawnIndex === 0) {
          const initialBounds = getHierarchyBoundsInLocalSpace(result.rootMesh);
          const frameWidth = initialBounds.max.x - initialBounds.min.x;

          result.rootMesh.position.x = frameWidth / 2;
          result.rootMesh.computeWorldMatrix(true);
        }

        result.syncBoundingBox();
        registerDragLifecycle(result);
        registerAsset(instanceId, result);
        useTrialRoomStore.getState().addLoadedModel({
          instanceId,
          assetId,
          category: "frame",
        });

        frameInstances.push({
          assetId,
          bounds: getHierarchyBoundsInLocalSpace(result.rootMesh),
          instanceId,
          components: [],
          result,
        });

        // Step 2:
        // Frames can coexist, and the newest frame becomes the active insertion target.
        syncLoadedProductStoreState();
        useTrialRoomStore.getState().setSelectedMesh(instanceId);
      } finally {
        pendingFrameLoads = Math.max(0, pendingFrameLoads - 1);
      }
    };

    // COMPONENT
    const spawnComponent = async (
      _requestId: number,
      assetId: string,
      targetFrame: TrialFrameInstance,
      options?: {
        localPosition?: BABYLON.Vector3;
      },
    ) => {
      const asset = getTrialAssetById(assetId);
      if (!asset) return;
      const instanceId = createModelInstanceId("component", asset.id);

      const result = await LoadAsset(scene, {
        instanceId,
        modelPath: asset.modelPath,
        meshName: instanceId,
        initialPosition: BABYLON.Vector3.Zero(),
        initialRotationY: 0,
        shadowGenerator: lighting.shadowGenerator,
        interactionMode: "component",
        centerOnXAxis: false,
      });

      if (!result) return;
      if (!isMounted) {
        result.dispose();
        return;
      }

      result.rootMesh.parent = targetFrame.result.rootMesh;
      result.rootMesh.rotationQuaternion = null;
      result.rootMesh.rotation.set(0, asset.initialRotationY ?? 0, 0);
      result.rootMesh.computeWorldMatrix(true);

      let componentBounds = getHierarchyBoundsInLocalSpace(result.rootMesh);
      const frameWidth = targetFrame.bounds.max.x - targetFrame.bounds.min.x;
      const frameHeight = targetFrame.bounds.max.y - targetFrame.bounds.min.y;
      const frameDepth = targetFrame.bounds.max.z - targetFrame.bounds.min.z;
      const availableWidth = frameWidth - CABINET_CONFIG.thickness * 2;
      const availableHeight =
        frameHeight -
        CABINET_CONFIG.plinthHeight -
        CABINET_CONFIG.thickness * 2;
      const availableDepth =
        frameDepth - CABINET_CONFIG.backGap - CABINET_CONFIG.backPanelThick;
      const originalComponentWidth =
        componentBounds.max.x - componentBounds.min.x;
      const originalComponentHeight =
        componentBounds.max.y - componentBounds.min.y;
      const originalComponentDepth =
        componentBounds.max.z - componentBounds.min.z;

      const nextScaleX = getScaledAxis(
        result.rootMesh.scaling.x,
        originalComponentWidth,
        availableWidth,
        asset.fitWidthMode ?? "keep",
      );
      const nextScaleY = getScaledAxis(
        result.rootMesh.scaling.y,
        originalComponentHeight,
        availableHeight,
        asset.fitHeightMode ?? "keep",
      );
      const nextScaleZ = getScaledAxis(
        result.rootMesh.scaling.z,
        originalComponentDepth,
        availableDepth,
        asset.fitDepthMode ?? "keep",
      );

      const scalingChanged =
        Math.abs(nextScaleX - result.rootMesh.scaling.x) > 0.0001 ||
        Math.abs(nextScaleY - result.rootMesh.scaling.y) > 0.0001 ||
        Math.abs(nextScaleZ - result.rootMesh.scaling.z) > 0.0001;

      if (scalingChanged) {
        result.rootMesh.scaling.set(nextScaleX, nextScaleY, nextScaleZ);
        result.rootMesh.computeWorldMatrix(true);
        componentBounds = getHierarchyBoundsInLocalSpace(result.rootMesh);
      }

      const fittedComponentWidth =
        componentBounds.max.x - componentBounds.min.x;
      const componentHeight = componentBounds.max.y - componentBounds.min.y;
      const componentDepth = componentBounds.max.z - componentBounds.min.z;
      const fitIssues: string[] = [];

      if (componentHeight > availableHeight + 0.0001) {
        fitIssues.push(
          `height ${toCentimeters(componentHeight)}cm > ${toCentimeters(availableHeight)}cm`,
        );
      }

      if (componentDepth > availableDepth + 0.0001) {
        fitIssues.push(
          `depth ${toCentimeters(componentDepth)}cm > ${toCentimeters(availableDepth)}cm`,
        );
      }

      if (fitIssues.length > 0) {
        const frameAsset = getTrialAssetById(targetFrame.assetId);

        toast("Component does not fit this frame", {
          description: `${asset.name} cannot fit inside ${frameAsset?.name ?? "the current frame"}: ${fitIssues.join(", ")}.`,
        });

        console.warn("[TrialRoomCanvas] Component fit rejected", {
          frameAssetId: frameAsset?.id ?? null,
          componentAssetId: asset.id,
          availableWidth,
          availableHeight,
          availableDepth,
          componentWidth: fittedComponentWidth,
          originalComponentWidth,
          originalComponentHeight,
          originalComponentDepth,
          componentHeight,
          componentDepth,
        });

        result.dispose();
        return;
      }

      const anchorX = targetFrame.bounds.min.x + CABINET_CONFIG.thickness;
      const anchorY = CABINET_CONFIG.plinthHeight + CABINET_CONFIG.thickness;
      const baseAnchorZ =
        targetFrame.bounds.min.z +
        CABINET_CONFIG.backGap +
        CABINET_CONFIG.backPanelThick;
      const anchorZ =
        asset.id === "component-hanging-rod"
          ? baseAnchorZ + (availableDepth - componentDepth) / 2
          : baseAnchorZ;
      const localAnchor = new BABYLON.Vector3(
        anchorX - componentBounds.min.x,
        anchorY - componentBounds.min.y,
        anchorZ - componentBounds.min.z,
      );

      result.rootMesh.position.copyFrom(options?.localPosition ?? localAnchor);
      result.rootMesh.computeWorldMatrix(true);
      result.syncBoundingBox();
      registerDragLifecycle(result);
      registerAsset(instanceId, result);
      useTrialRoomStore.getState().addLoadedModel({
        instanceId,
        assetId,
        category: "component",
      });

      const anchorDebug = createComponentAnchorHelper(
        scene,
        targetFrame.result.rootMesh,
        result.rootMesh.name,
        localAnchor,
      );
      const disposeComponent = result.dispose;
      result.dispose = () => {
        anchorDebug.dispose();
        disposeComponent();
      };

      targetFrame.components.push({
        assetId,
        instanceId,
        result,
      });
      syncLoadedProductStoreState();
      useTrialRoomStore.getState().setSelectedMesh(instanceId);
    };

    const duplicateSelectedInstance = async (
      requestId: number,
      targetInstanceId: string,
    ) => {
      const sourceFrame =
        frameInstances.find((frame) => frame.instanceId === targetInstanceId) ??
        null;
      if (sourceFrame) {
        const frameWidth = sourceFrame.bounds.max.x - sourceFrame.bounds.min.x;
        const duplicatePosition = sourceFrame.result.rootMesh.position
          .clone()
          .add(new BABYLON.Vector3(Math.max(frameWidth + 0.15, 0.45), 0, 0));

        await spawnFrame(
          requestId,
          sourceFrame.assetId,
          toSpawnPoint(duplicatePosition),
        );
        return true;
      }

      const ownerFrame = findComponentOwnerFrame(targetInstanceId);
      if (!ownerFrame) {
        return false;
      }

      const sourceComponent =
        ownerFrame.components.find(
          (component) => component.instanceId === targetInstanceId,
        ) ?? null;
      if (!sourceComponent) {
        return false;
      }

      const duplicateLocalPosition = sourceComponent.result.rootMesh.position
        .clone()
        .add(new BABYLON.Vector3(0, 0.08, 0));

      await spawnComponent(requestId, sourceComponent.assetId, ownerFrame, {
        localPosition: duplicateLocalPosition,
      });
      return true;
    };

    const handleSpawnRequest = async (
      request: NonNullable<
        ReturnType<typeof useTrialRoomStore.getState>["spawnRequest"]
      >,
    ) => {
      const asset = getTrialAssetById(request.assetId);
      if (!asset) {
        finishSpawnRequest(request.requestId);
        return;
      }

      if (asset.category === "material") {
        finishSpawnRequest(request.requestId);
        return;
      }

      if (asset.category === "component") {
        const targetFrame = resolveComponentTargetFrame();
        if (!targetFrame) {
          if (frameInstances.length > 1) {
            toast("Select a frame first", {
              description:
                "When multiple frames are loaded, component items attach to the selected frame only.",
            });
          }

          finishSpawnRequest(request.requestId);
          return;
        }

        await spawnComponent(request.requestId, request.assetId, targetFrame);
        finishSpawnRequest(request.requestId);
        return;
      }

      await spawnFrame(request.requestId, request.assetId, request.dropPoint);
      finishSpawnRequest(request.requestId);
    };

    const handleSelectionActionRequest = async (
      request: NonNullable<
        ReturnType<typeof useTrialRoomStore.getState>["selectionActionRequest"]
      >,
    ) => {
      if (request.action === "delete") {
        deleteSelectedInstance(request.targetInstanceId);
        finishSelectionActionRequest(request.requestId);
        return;
      }

      await duplicateSelectedInstance(
        request.requestId,
        request.targetInstanceId,
      );
      finishSelectionActionRequest(request.requestId);
    };

    const unsubscribeSpawn = useTrialRoomStore.subscribe((state, previous) => {
      if (!state.spawnRequest || state.spawnRequest === previous.spawnRequest) {
        return;
      }

      void handleSpawnRequest(state.spawnRequest);
    });
    const unsubscribeSelectionAction = useTrialRoomStore.subscribe(
      (state, previous) => {
        if (
          !state.selectionActionRequest ||
          state.selectionActionRequest === previous.selectionActionRequest
        ) {
          return;
        }

        void handleSelectionActionRequest(state.selectionActionRequest);
      },
    );
    const unsubscribeSelection = useTrialRoomStore.subscribe(
      (state, previous) => {
        if (state.selectedMeshName === previous.selectedMeshName) {
          return;
        }

        syncSelectionOutline(state.selectedMeshName);
      },
    );

    syncSelectionOutline(useTrialRoomStore.getState().selectedMeshName);

    const unsubscribeRoomConfig = useTrialRoomStore.subscribe(
      (state, previous) => {
        if (state.appliedRoomConfig === previous.appliedRoomConfig) {
          return;
        }

        // Step 5:
        // The scene only rebuilds the room after the debounced room config is applied.
        currentRoomConfig = state.appliedRoomConfig;
        updateRoomConfig(state.appliedRoomConfig);
      },
    );

    const handleCanvasDragOver = (event: DragEvent) => {
      if (!hasTrialAssetDragType(event)) {
        return;
      }

      event.preventDefault();
      event.dataTransfer!.dropEffect = "copy";
    };

    const handleCanvasDrop = (event: DragEvent) => {
      if (!hasTrialAssetDragType(event)) {
        return;
      }

      event.preventDefault();

      const assetId = event.dataTransfer?.getData(TRIAL_ASSET_DRAG_TYPE);
      if (!assetId) {
        return;
      }

      const asset = getTrialAssetById(assetId);
      if (!asset) {
        return;
      }

      if (asset.category === "material") {
        return;
      }

      if (asset.category === "component") {
        if (!useTrialRoomStore.getState().hasFrameProduct) {
          return;
        }

        // Step 4:
        // Component attaches to the selected frame, or the only frame when just one exists.
        useTrialRoomStore.getState().requestAssetSpawn(assetId, null);
        return;
      }

      const pickedPoint = pickFloorPointFromClient(
        scene,
        canvas,
        event.clientX,
        event.clientY,
      );

      useTrialRoomStore
        .getState()
        .requestAssetSpawn(
          assetId,
          pickedPoint ? toSpawnPoint(pickedPoint) : null,
        );
    };

    canvas.addEventListener("dragover", handleCanvasDragOver);
    canvas.addEventListener("drop", handleCanvasDrop);

    return () => {
      if (prePointerObserver) {
        scene.onPrePointerObservable.remove(prePointerObserver);
      }
      if (pointerObserver) {
        scene.onPointerObservable.remove(pointerObserver);
      }

      canvas.removeEventListener("dragover", handleCanvasDragOver);
      canvas.removeEventListener("drop", handleCanvasDrop);
      unsubscribeSpawn();
      unsubscribeSelectionAction();
      unsubscribeSelection();
      unsubscribeRoomConfig();
      isMounted = false;
      updateThemeModeRef.current = null;
      setCameraInteractionEnabled(true);
      clearAllFrames();
      clearRegistry();
      disposeScene();
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="h-full w-full touch-none outline-none" />
  );
};
