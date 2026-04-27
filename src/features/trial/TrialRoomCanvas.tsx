"use client";

import { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";
import { toast } from "sonner";

import { getBackWallPosition, initTrialScene } from "./core/TrialSceneSetup";
import { TrialRoomConfig } from "./core/TrialConfig";
import {
  loadProductBase,
  TrialModelLoadResult,
} from "./furniture/TrialModelLoader";
import {
  getTrialResolvedDragTarget,
  tryStartTrialDragFromPick,
} from "./furniture/DragBehavior";
import {
  clearRegistry,
  getModel,
  registerModel,
  unregisterModel,
} from "./furniture/TrialModelRegistry";
import { getTrialAssetById, TRIAL_ASSET_DRAG_TYPE } from "./trialAssetCatalog";
import { TrialSpawnPoint, useTrialRoomStore } from "./useTrialRoomStore";
import { CABINET_CONFIG } from "./CabinetConfig";

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

const toVector3 = (point: TrialSpawnPoint) =>
  new BABYLON.Vector3(point.x, point.y, point.z);

const toSpawnPoint = (point: BABYLON.Vector3): TrialSpawnPoint => ({
  x: point.x,
  y: point.y,
  z: point.z,
});

interface TrialMeshBounds {
  min: BABYLON.Vector3;
  max: BABYLON.Vector3;
}

interface TrialInteriorInstance {
  assetId: string;
  instanceId: string;
  result: TrialModelLoadResult;
}

interface TrialFrameInstance {
  assetId: string;
  bounds: TrialMeshBounds;
  instanceId: string;
  interiors: TrialInteriorInstance[];
  result: TrialModelLoadResult;
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

const createInteriorAnchorDebugMarker = (
  scene: BABYLON.Scene,
  parent: BABYLON.TransformNode,
  name: string,
  localAnchor: BABYLON.Vector3,
) => {
  const markerRoot = new BABYLON.TransformNode(`${name}-anchor-root`, scene);
  markerRoot.parent = parent;
  markerRoot.position.copyFrom(localAnchor);

  const marker = BABYLON.MeshBuilder.CreateSphere(
    `${name}-anchor-point`,
    { diameter: 0.035 },
    scene,
  );
  marker.parent = markerRoot;
  marker.isPickable = false;

  const markerMaterial = new BABYLON.StandardMaterial(
    `${name}-anchor-mat`,
    scene,
  );
  markerMaterial.emissiveColor = new BABYLON.Color3(1, 0.4, 0.1);
  markerMaterial.disableLighting = true;
  marker.material = markerMaterial;

  const axisLength = 0.18;
  const axisDefinitions = [
    {
      suffix: "x",
      points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(axisLength, 0, 0)],
      color: new BABYLON.Color3(1, 0.9, 0.1),
    },
    {
      suffix: "y",
      points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, axisLength, 0)],
      color: new BABYLON.Color3(0.2, 1, 0.3),
    },
    {
      suffix: "z",
      points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, axisLength)],
      color: new BABYLON.Color3(0.2, 0.7, 1),
    },
  ];

  const axisLines = axisDefinitions.map(({ suffix, points, color }) => {
    const line = BABYLON.MeshBuilder.CreateLines(
      `${name}-anchor-axis-${suffix}`,
      { points },
      scene,
    );
    line.parent = markerRoot;
    line.color = color;
    line.isPickable = false;
    return line;
  });

  return {
    dispose: () => {
      axisLines.forEach((line) => line.dispose());
      markerMaterial.dispose();
      marker.dispose();
      markerRoot.dispose();
    },
  };
};

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
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const initialRoomConfig = useTrialRoomStore.getState().appliedRoomConfig;
    const {
      camera,
      scene,
      lighting,
      updateRoomConfig,
      dispose: disposeScene,
    } = initTrialScene(canvas, initialRoomConfig);
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

    const syncFrameStoreState = () => {
      const store = useTrialRoomStore.getState();
      store.setHasFrameProduct(frameInstances.length > 0);
      store.setActiveFrameProductIds(frameInstances.map((frame) => frame.assetId));
    };

    const getAllLoadedModels = () =>
      frameInstances.flatMap((frame) => [
        frame.result,
        ...frame.interiors.map((interior) => interior.result),
      ]);

    const getModelCategory = (instanceId: string | null) => {
      if (!instanceId) {
        return null;
      }

      for (const frame of frameInstances) {
        if (frame.instanceId === instanceId) {
          return "frame" as const;
        }

        if (frame.interiors.some((interior) => interior.instanceId === instanceId)) {
          return "interior" as const;
        }
      }

      return null;
    };

    const syncDragProxyPickability = (
      selectedInstanceId = useTrialRoomStore.getState().selectedMeshName,
    ) => {
      getAllLoadedModels().forEach((model) => {
        if (model.boundingBoxMesh) {
          model.boundingBoxMesh.isPickable = model.instanceId === selectedInstanceId;
        }
      });
    };

    const syncSelectionOutline = (
      selectedInstanceId = useTrialRoomStore.getState().selectedMeshName,
    ) => {
      selectionLayer.clearSelection();

      if (!selectedInstanceId) {
        return;
      }

      const selectedModel = getModel(selectedInstanceId);

      if (selectedModel && selectedModel.selectionMeshes.length > 0) {
        selectionLayer.addSelection(selectedModel.selectionMeshes);
      }

      syncDragProxyPickability(selectedInstanceId);
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
          frame.interiors.some(
            (interior) => interior.instanceId === selectedInstanceId,
          ),
        ) ?? null
      );
    };

    const resolveInteriorTargetFrame = () => {
      if (frameInstances.length === 1) {
        return frameInstances[0];
      }

      return resolveFrameFromSelection(useTrialRoomStore.getState().selectedMeshName);
    };

    const disposeFrameInstance = (frame: TrialFrameInstance) => {
      while (frame.interiors.length > 0) {
        const interior = frame.interiors.pop()!;
        useTrialRoomStore.getState().removeLoadedModel(interior.instanceId);
        unregisterModel(interior.instanceId);
      }

      useTrialRoomStore.getState().removeLoadedModel(frame.instanceId);
      unregisterModel(frame.instanceId);
    };

    const clearAllFrames = () => {
      while (frameInstances.length > 0) {
        disposeFrameInstance(frameInstances.pop()!);
      }

      syncFrameStoreState();
      useTrialRoomStore.getState().clearActiveInteriorProductIds();
      useTrialRoomStore.getState().setActiveMaterialProductIds([]);
      useTrialRoomStore.getState().setSelectedMesh(null);
    };

    const resolveInteractionPick = (
      clientX: number,
      clientY: number,
    ): TrialInteractionPick | null => {
      const picks = scene.multiPick(clientX, clientY, (mesh) => mesh.isPickable) ?? [];
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
          if (category === "interior" && !isBoundingBox) {
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
        kind: winner.isBoundingBox ? "bounding-box" : winner.category ?? undefined,
        mesh: winner.mesh,
        pickInfo: winner.pick,
      };
    };

    const registerDragLifecycle = (result: TrialModelLoadResult) => {
      if (!result.dragBehavior) {
        return;
      }

      const dragStartObserver = result.dragBehavior.onDragStartObservable.add(() => {
        result.syncBoundingBox();
        pointerOwnership.owner = "model";
        pointerOwnership.dragInstanceId = result.instanceId;
        setCameraInteractionEnabled(false);
      });

      const dragEndObserver = result.dragBehavior.onDragEndObservable.add(() => {
        result.syncBoundingBox();
        pointerOwnership.owner = "none";
        pointerOwnership.dragInstanceId = null;
        pointerOwnership.activePointerId = null;
        setCameraInteractionEnabled(true);
      });

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

        const resolvedPick = resolveInteractionPick(scene.pointerX, scene.pointerY);
        if (!resolvedPick?.instanceId) {
          pointerOwnership.activePointerId = null;
          pointerOwnership.dragInstanceId = null;
          pointerOwnership.owner = "none";
          useTrialRoomStore.getState().setSelectedMesh(null);
          return;
        }

        const selectedInstanceId = useTrialRoomStore.getState().selectedMeshName;
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

    const pointerObserver = scene.onPointerObservable.add(
      (pointerInfo) => {
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
      },
      BABYLON.PointerEventTypes.POINTERUP,
    );

    const finishSpawnRequest = (requestId: number) => {
      const store = useTrialRoomStore.getState();

      if (store.spawnRequest?.requestId === requestId) {
        store.clearSpawnRequest();
      }
    };

    // FRAME
    const spawnFrame = async (
      requestId: number,
      assetId: string,
      dropPoint: TrialSpawnPoint | null,
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
        const instanceId = `trial-frame-${asset.id}-${requestId}`;
        const result = await loadProductBase(scene, {
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

        result.syncBoundingBox();
        registerDragLifecycle(result);
        registerModel(instanceId, result);
        useTrialRoomStore.getState().addLoadedModel({
          instanceId,
          assetId,
          category: "frame",
        });

        frameInstances.push({
          assetId,
          bounds: getHierarchyBoundsInLocalSpace(result.rootMesh),
          instanceId,
          interiors: [],
          result,
        });

        // Step 2:
        // Frames can coexist, and the newest frame becomes the active insertion target.
        syncFrameStoreState();
        useTrialRoomStore.getState().setSelectedMesh(instanceId);
      } finally {
        pendingFrameLoads = Math.max(0, pendingFrameLoads - 1);
      }
    };

    // INTERIOR
    const spawnInterior = async (
      requestId: number,
      assetId: string,
      targetFrame: TrialFrameInstance,
    ) => {
      const asset = getTrialAssetById(assetId);
      if (!asset) return;
      const instanceId = `trial-interior-${asset.id}-${requestId}`;

      const result = await loadProductBase(scene, {
        instanceId,
        modelPath: asset.modelPath,
        meshName: instanceId,
        initialPosition: BABYLON.Vector3.Zero(),
        initialRotationY: 0,
        shadowGenerator: lighting.shadowGenerator,
        interactionMode: "interior",
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

      let interiorBounds = getHierarchyBoundsInLocalSpace(result.rootMesh);
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
      const originalInteriorWidth = interiorBounds.max.x - interiorBounds.min.x;
      const originalInteriorHeight =
        interiorBounds.max.y - interiorBounds.min.y;
      const originalInteriorDepth = interiorBounds.max.z - interiorBounds.min.z;

      const nextScaleX = getScaledAxis(
        result.rootMesh.scaling.x,
        originalInteriorWidth,
        availableWidth,
        asset.fitWidthMode ?? "keep",
      );
      const nextScaleY = getScaledAxis(
        result.rootMesh.scaling.y,
        originalInteriorHeight,
        availableHeight,
        asset.fitHeightMode ?? "keep",
      );
      const nextScaleZ = getScaledAxis(
        result.rootMesh.scaling.z,
        originalInteriorDepth,
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
        interiorBounds = getHierarchyBoundsInLocalSpace(result.rootMesh);
      }

      const fittedInteriorWidth = interiorBounds.max.x - interiorBounds.min.x;
      const interiorHeight = interiorBounds.max.y - interiorBounds.min.y;
      const interiorDepth = interiorBounds.max.z - interiorBounds.min.z;
      const fitIssues: string[] = [];

      if (interiorHeight > availableHeight + 0.0001) {
        fitIssues.push(
          `height ${toCentimeters(interiorHeight)}cm > ${toCentimeters(availableHeight)}cm`,
        );
      }

      if (interiorDepth > availableDepth + 0.0001) {
        fitIssues.push(
          `depth ${toCentimeters(interiorDepth)}cm > ${toCentimeters(availableDepth)}cm`,
        );
      }

      if (fitIssues.length > 0) {
        const frameAsset = getTrialAssetById(targetFrame.assetId);

        toast("Interior does not fit this frame", {
          description: `${asset.name} cannot fit inside ${frameAsset?.name ?? "the current frame"}: ${fitIssues.join(", ")}.`,
        });

        console.warn("[TrialRoomCanvas] Interior fit rejected", {
          frameAssetId: frameAsset?.id ?? null,
          interiorAssetId: asset.id,
          availableWidth,
          availableHeight,
          availableDepth,
          interiorWidth: fittedInteriorWidth,
          originalInteriorWidth,
          originalInteriorHeight,
          originalInteriorDepth,
          interiorHeight,
          interiorDepth,
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
          ? baseAnchorZ + (availableDepth - interiorDepth) / 2
          : baseAnchorZ;
      const localAnchor = new BABYLON.Vector3(
        anchorX - interiorBounds.min.x,
        anchorY - interiorBounds.min.y,
        anchorZ - interiorBounds.min.z,
      );

      result.rootMesh.position.copyFrom(localAnchor);
      result.rootMesh.computeWorldMatrix(true);
      result.syncBoundingBox();
      registerDragLifecycle(result);
      registerModel(instanceId, result);
      useTrialRoomStore.getState().addLoadedModel({
        instanceId,
        assetId,
        category: "interior",
      });

      const anchorDebug = createInteriorAnchorDebugMarker(
        scene,
        targetFrame.result.rootMesh,
        result.rootMesh.name,
        localAnchor,
      );
      const disposeInterior = result.dispose;
      result.dispose = () => {
        anchorDebug.dispose();
        disposeInterior();
      };

      targetFrame.interiors.push({
        assetId,
        instanceId,
        result,
      });
      useTrialRoomStore.getState().addActiveInteriorProductId(assetId);
      useTrialRoomStore.getState().setSelectedMesh(instanceId);
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

      if (asset.category === "interior") {
        const targetFrame = resolveInteriorTargetFrame();
        if (!targetFrame) {
          if (frameInstances.length > 1) {
            toast("Select a frame first", {
              description:
                "When multiple frames are loaded, interior items attach to the selected frame only.",
            });
          }

          finishSpawnRequest(request.requestId);
          return;
        }

        await spawnInterior(request.requestId, request.assetId, targetFrame);
        finishSpawnRequest(request.requestId);
        return;
      }

      await spawnFrame(request.requestId, request.assetId, request.dropPoint);
      finishSpawnRequest(request.requestId);
    };

    const unsubscribeSpawn = useTrialRoomStore.subscribe((state, previous) => {
      if (!state.spawnRequest || state.spawnRequest === previous.spawnRequest) {
        return;
      }

      void handleSpawnRequest(state.spawnRequest);
    });
    const unsubscribeSelection = useTrialRoomStore.subscribe((state, previous) => {
      if (state.selectedMeshName === previous.selectedMeshName) {
        return;
      }

      syncSelectionOutline(state.selectedMeshName);
    });

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

      if (asset.category === "interior") {
        if (!useTrialRoomStore.getState().hasFrameProduct) {
          return;
        }

        // Step 4:
        // Interior attaches to the selected frame, or the only frame when just one exists.
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
      unsubscribeSelection();
      unsubscribeRoomConfig();
      isMounted = false;
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
