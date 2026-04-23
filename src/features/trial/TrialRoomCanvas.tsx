"use client";

import { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";

import { getBackWallPosition, initTrialScene } from "./core/TrialSceneSetup";
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
    const {
      scene,
      lighting,
      dispose: disposeScene,
    } = initTrialScene(canvas);

    let isMounted = true;
    let latestSpawnRequestId = 0;
    let baseFurniture: TrialModelLoadResult | null = null;
    const tambahanModels: TrialModelLoadResult[] = [];

    const clearTambahan = () => {
      while (tambahanModels.length > 0) {
        tambahanModels.pop()?.dispose();
      }
    };

    const clearBaseFurniture = () => {
      clearTambahan();
      baseFurniture?.dispose();
      baseFurniture = null;
      useTrialRoomStore.getState().setHasBaseFurniture(false);
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

    const spawnFurniture = async (
      requestId: number,
      assetId: string,
      dropPoint: TrialSpawnPoint | null,
    ) => {
      const asset = getTrialAssetById(assetId);
      if (!asset) {
        return;
      }

      // Step 1:
      // A new furniture item replaces the old base furniture and resets tambahan.
      clearBaseFurniture();

      const initialPosition = dropPoint
        ? toVector3(dropPoint)
        : getBackWallPosition(0.01);

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

      baseFurniture = result;

      // Step 2:
      // Once the base furniture exists, tambahan becomes available in the panel.
      useTrialRoomStore.getState().setHasBaseFurniture(true);
      useTrialRoomStore.getState().setSelectedMesh(result.rootMesh.name);
    };

    const spawnTambahan = async (requestId: number, assetId: string) => {
      const asset = getTrialAssetById(assetId);
      if (!asset || !baseFurniture) {
        return;
      }

      const result = await loadProductBase(scene, {
        modelPath: asset.modelPath,
        meshName: `trial-tambahan-${asset.id}-${requestId}`,
        initialPosition: BABYLON.Vector3.Zero(),
        initialRotationY: asset.initialRotationY,
        shadowGenerator: lighting.shadowGenerator,
        enableInteraction: false,
        centerOnXAxis: false,
      });

      if (!result) {
        return;
      }

      if (!isMounted || latestSpawnRequestId !== requestId || !baseFurniture) {
        result.dispose();
        return;
      }

      // Step 3:
      // Parent tambahan to the base furniture so it follows the same drag movement.
      result.rootMesh.parent = baseFurniture.rootMesh;
      result.rootMesh.position.copyFromFloats(0, 0, 0);
      result.rootMesh.rotationQuaternion = null;
      result.rootMesh.rotation.y = asset.initialRotationY ?? 0;
      result.rootMesh.computeWorldMatrix(true);

      tambahanModels.push(result);
      useTrialRoomStore.getState().setSelectedMesh(baseFurniture.rootMesh.name);
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

      if (asset.category === "tambahan") {
        if (!baseFurniture) {
          finishSpawnRequest(request.requestId);
          return;
        }

        await spawnTambahan(request.requestId, request.assetId);
        finishSpawnRequest(request.requestId);
        return;
      }

      await spawnFurniture(request.requestId, request.assetId, request.dropPoint);
      finishSpawnRequest(request.requestId);
    };

    const unsubscribeSpawn = useTrialRoomStore.subscribe((state, previous) => {
      if (!state.spawnRequest || state.spawnRequest === previous.spawnRequest) {
        return;
      }

      void handleSpawnRequest(state.spawnRequest);
    });

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

      if (asset.category === "tambahan") {
        if (!useTrialRoomStore.getState().hasBaseFurniture) {
          return;
        }

        // Step 4:
        // Tambahan always attaches to the current furniture, so drop position is ignored.
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
      isMounted = false;
      clearBaseFurniture();
      disposeScene();
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="h-full w-full touch-none outline-none" />
  );
};
