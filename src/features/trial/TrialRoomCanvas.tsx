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
  isTrialDraggableMesh,
  tryStartTrialDragFromPointer,
} from "./furniture/DragBehavior";
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

const createInteriorAnchorDebugMarker = (
  scene: BABYLON.Scene,
  parent: BABYLON.AbstractMesh,
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
  rootMesh: BABYLON.AbstractMesh,
): TrialMeshBounds => {
  rootMesh.computeWorldMatrix(true);
  rootMesh.getChildMeshes().forEach((mesh) => mesh.computeWorldMatrix(true));

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

  rootMesh.getChildMeshes().forEach((mesh) => {
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

export const TrialRoomCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  let cachedFrameBounds: TrialMeshBounds | null = null;
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const initialRoomConfig = useTrialRoomStore.getState().appliedRoomConfig;
    const {
      scene,
      lighting,
      updateRoomConfig,
      dispose: disposeScene,
    } = initTrialScene(canvas, initialRoomConfig);

    let isMounted = true;
    let latestSpawnRequestId = 0;
    let frameProduct: TrialModelLoadResult | null = null;
    const interiorModels: TrialModelLoadResult[] = [];
    let currentRoomConfig: TrialRoomConfig = initialRoomConfig;

    const clearInterior = () => {
      while (interiorModels.length > 0) {
        interiorModels.pop()?.dispose();
      }
    };

    const clearFrameProduct = () => {
      clearInterior();
      frameProduct?.dispose();
      frameProduct = null;
      cachedFrameBounds = null;
      useTrialRoomStore.getState().setHasFrameProduct(false);
      useTrialRoomStore.getState().setActiveFrameProductId(null);
      useTrialRoomStore.getState().clearActiveInteriorProductIds();
      useTrialRoomStore.getState().setActiveMaterialProductIds([]);
      useTrialRoomStore.getState().setSelectedMesh(null);
    };

    const onPointerDown = (pointerInfo: BABYLON.PointerInfo) => {
      const hitMesh = pointerInfo.pickInfo?.pickedMesh;
      const isDraggableMesh = isTrialDraggableMesh(hitMesh);

      if (isDraggableMesh) {
        tryStartTrialDragFromPointer(pointerInfo);
        return;
      }

      useTrialRoomStore.getState().setSelectedMesh(null);
    };

    const pointerObserver = scene.onPointerObservable.add(
      onPointerDown,
      BABYLON.PointerEventTypes.POINTERDOWN,
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

      // Step 1:
      // A new frame item replaces the old frame product and resets all interior items.
      clearFrameProduct();

      const initialPosition = dropPoint
        ? toVector3(dropPoint)
        : getBackWallPosition(currentRoomConfig, 0.01);

      const result = await loadProductBase(scene, {
        modelPath: asset.modelPath,
        meshName: "trial-product-base",
        initialPosition,
        initialRotationY: asset.initialRotationY,
        shadowGenerator: lighting.shadowGenerator,
        enableInteraction: true,
        centerOnXAxis: true,
      });

      if (!result) {
        return;
      }

      if (!isMounted || latestSpawnRequestId !== requestId) {
        result.dispose();
        return;
      }

      frameProduct = result;
      cachedFrameBounds = getHierarchyBoundsInLocalSpace(frameProduct.rootMesh);

      // Step 2:
      // Once the frame exists, Interior Lemari becomes available in the panel.
      useTrialRoomStore.getState().setHasFrameProduct(true);
      useTrialRoomStore.getState().setActiveFrameProductId(assetId);
      useTrialRoomStore.getState().setSelectedMesh(result.rootMesh.name);
    };

    // INTERIOR
    // const spawnInterior = async (requestId: number, assetId: string) => {
    //   const asset = getTrialAssetById(assetId);
    //   if (!asset || !frameProduct) return;

    //   const result = await loadProductBase(scene, {
    //     modelPath: asset.modelPath,
    //     meshName: `trial-interior-${asset.id}-${requestId}`,
    //     initialPosition: BABYLON.Vector3.Zero(),
    //     initialRotationY: Math.PI,
    //     shadowGenerator: lighting.shadowGenerator,
    //     enableInteraction: false,
    //     centerOnXAxis: false,
    //   });
    //   const frameLayout =
    //     frameProduct.rootMesh.getHierarchyBoundingVectors(true);

    //   if (!result || !frameProduct) return;

    //   result.rootMesh.parent = frameProduct.rootMesh;

    //   cachedFrameBounds =
    //     frameProduct.rootMesh.getHierarchyBoundingVectors(true);

    //   result.rootMesh.rotation.y = Math.PI;

    //   const frameWidth =
    //     Math.round((cachedFrameBounds.max.x - cachedFrameBounds.min.x) * 1000) /
    //     1000;

    //   result.rootMesh.position.set(
    //     frameWidth / 2,
    //     CABINET_CONFIG.plinthHeight + CABINET_CONFIG.thickness,
    //     CABINET_CONFIG.backGap + CABINET_CONFIG.backPanelThick,
    //   );

    //   const debugBox = BABYLON.MeshBuilder.CreateBox(
    //     "debug-frame-layout",
    //     {
    //       width: frameLayout.max.x - frameLayout.min.x,
    //       height: frameLayout.max.y - frameLayout.min.y,
    //       depth: frameLayout.max.z - frameLayout.min.z,
    //     },
    //     scene,
    //   );

    //   // Posisikan di tengah bounding box
    //   debugBox.position = new BABYLON.Vector3(
    //     (frameLayout.min.x + frameLayout.max.x) / 2,
    //     (frameLayout.min.y + frameLayout.max.y) / 2,
    //     (frameLayout.min.z + frameLayout.max.z) / 2,
    //   );
    //   console.log("frameWidth:", frameWidth);
    //   console.log("frameLayout.min.x:", frameLayout.min.x);
    //   console.log("frameLayout.max.x:", frameLayout.max.x);
    //   console.log("frame world pos:", frameProduct.rootMesh.position.x);
    //   console.log(
    //     "interior local pos setelah set:",
    //     result.rootMesh.position.x,
    //   );
    //   // Material hijau wireframe
    //   const debugMat = new BABYLON.StandardMaterial("debug-frame-mat", scene);
    //   debugMat.emissiveColor = new BABYLON.Color3(0, 1, 0); // Hijau
    //   debugMat.wireframe = true;
    //   debugBox.material = debugMat;

    //   interiorModels.push(result);
    //   useTrialRoomStore.getState().addActiveInteriorProductId(assetId);
    // };

    // INTERIOR
    const spawnInterior = async (requestId: number, assetId: string) => {
      const asset = getTrialAssetById(assetId);
      if (!asset || !frameProduct || !cachedFrameBounds) return;

      const result = await loadProductBase(scene, {
        modelPath: asset.modelPath,
        meshName: `trial-interior-${asset.id}-${requestId}`,
        initialPosition: BABYLON.Vector3.Zero(),
        initialRotationY: 0,
        shadowGenerator: lighting.shadowGenerator,
        enableInteraction: false,
        centerOnXAxis: false,
      });

      if (!result) return;

      result.rootMesh.parent = frameProduct.rootMesh;
      result.rootMesh.rotationQuaternion = null;
      result.rootMesh.rotation.set(0, asset.initialRotationY ?? 0, 0);
      result.rootMesh.computeWorldMatrix(true);

      let interiorBounds = getHierarchyBoundsInLocalSpace(result.rootMesh);
      const frameWidth = cachedFrameBounds.max.x - cachedFrameBounds.min.x;
      const frameHeight = cachedFrameBounds.max.y - cachedFrameBounds.min.y;
      const frameDepth = cachedFrameBounds.max.z - cachedFrameBounds.min.z;
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
        const frameAsset = useTrialRoomStore.getState().activeFrameProductId
          ? getTrialAssetById(
              useTrialRoomStore.getState().activeFrameProductId!,
            )
          : null;

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

      const anchorX = cachedFrameBounds.min.x + CABINET_CONFIG.thickness;
      const anchorY = CABINET_CONFIG.plinthHeight + CABINET_CONFIG.thickness;
      const anchorZ =
        cachedFrameBounds.min.z +
        CABINET_CONFIG.backGap +
        CABINET_CONFIG.backPanelThick;
      const localAnchor = new BABYLON.Vector3(anchorX, anchorY, anchorZ);

      result.rootMesh.position.copyFrom(localAnchor);
      result.rootMesh.computeWorldMatrix(true);

      const anchorDebug = createInteriorAnchorDebugMarker(
        scene,
        frameProduct.rootMesh,
        result.rootMesh.name,
        localAnchor,
      );
      const disposeInterior = result.dispose;
      result.dispose = () => {
        anchorDebug.dispose();
        disposeInterior();
      };

      interiorModels.push(result);
      useTrialRoomStore.getState().addActiveInteriorProductId(assetId);
    };
    const handleSpawnRequest = async (
      request: NonNullable<
        ReturnType<typeof useTrialRoomStore.getState>["spawnRequest"]
      >,
    ) => {
      latestSpawnRequestId = request.requestId;

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
        if (!frameProduct) {
          finishSpawnRequest(request.requestId);
          return;
        }

        await spawnInterior(request.requestId, request.assetId);
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
        // Interior always attaches to the current frame, so drop position is ignored.
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
      if (pointerObserver) {
        scene.onPointerObservable.remove(pointerObserver);
      }

      canvas.removeEventListener("dragover", handleCanvasDragOver);
      canvas.removeEventListener("drop", handleCanvasDrop);
      unsubscribeSpawn();
      unsubscribeRoomConfig();
      isMounted = false;
      clearFrameProduct();
      disposeScene();
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="h-full w-full touch-none outline-none" />
  );
};
