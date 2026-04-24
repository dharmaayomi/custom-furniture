"use client";

import { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";

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
import {
  getTrialAssetById,
  TRIAL_ASSET_DRAG_TYPE,
} from "./trialAssetCatalog";
import {
  TrialSpawnPoint,
  useTrialRoomStore,
} from "./useTrialRoomStore";

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

      // Step 2:
      // Once the frame exists, Interior Lemari becomes available in the panel.
      useTrialRoomStore.getState().setHasFrameProduct(true);
      useTrialRoomStore.getState().setActiveFrameProductId(assetId);
      useTrialRoomStore.getState().setSelectedMesh(result.rootMesh.name);
    };

    const spawnInterior = async (requestId: number, assetId: string) => {
      const asset = getTrialAssetById(assetId);
      if (!asset || !frameProduct) {
        return;
      }

      const result = await loadProductBase(scene, {
        modelPath: asset.modelPath,
        meshName: `trial-interior-${asset.id}-${requestId}`,
        initialPosition: BABYLON.Vector3.Zero(),
        initialRotationY: asset.initialRotationY,
        shadowGenerator: lighting.shadowGenerator,
        enableInteraction: false,
        centerOnXAxis: false,
      });

      if (!result) {
        return;
      }

      if (!isMounted || latestSpawnRequestId !== requestId || !frameProduct) {
        result.dispose();
        return;
      }

      // Step 3:
      // Parent interior to the frame product so it follows the same drag movement.
      result.rootMesh.parent = frameProduct.rootMesh;
      result.rootMesh.position.copyFromFloats(0, 0, 0);
      result.rootMesh.rotationQuaternion = null;
      result.rootMesh.rotation.y = asset.initialRotationY ?? 0;
      result.rootMesh.computeWorldMatrix(true);

      interiorModels.push(result);
      useTrialRoomStore.getState().addActiveInteriorProductId(assetId);
      useTrialRoomStore.getState().setSelectedMesh(frameProduct.rootMesh.name);
    };

    const handleSpawnRequest = async (
      request: NonNullable<ReturnType<typeof useTrialRoomStore.getState>["spawnRequest"]>,
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

      useTrialRoomStore.getState().requestAssetSpawn(
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
