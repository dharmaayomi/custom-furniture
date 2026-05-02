import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

import {
  createFrameDraggableBoundingBox,
  createComponentDraggableBoundingBox,
  getRenderableMeshes,
} from "./TrialModelUtils";

/**
 * TrialModelLoader.ts
 *
 * Tanggung jawab file ini:
 *   1. Load GLB dari path yang diberikan
 *   2. Setup shadow caster + pickable pada child mesh
 *   3. Pasang outline controller + drag hitbox
 *   4. Return result — TIDAK menentukan posisi
 *
 * Posisi awal ditentukan oleh pemanggil
 * karena hanya pemanggil yang tahu konteks ruangan saat itu.
 */

export interface AssetLoadOptions {
  instanceId: string;
  modelPath: string;
  meshName: string;
  initialPosition: BABYLON.Vector3;
  initialRotationY?: number;
  shadowGenerator?: BABYLON.ShadowGenerator;
  interactionMode?: "none" | "frame" | "component";
  centerOnXAxis?: boolean;
}

export interface AssetLoadResult {
  container: BABYLON.AssetContainer;
  dragBehavior: BABYLON.PointerDragBehavior | null;
  instanceId: string;
  rootMesh: BABYLON.TransformNode;
  boundingBoxMesh: BABYLON.Mesh | null;
  selectionMeshes: BABYLON.AbstractMesh[];
  syncBoundingBox: () => void;
  dispose: () => void;
}

const getPlacementRoot = (
  container: BABYLON.AssetContainer,
): BABYLON.TransformNode | null => {
  const importRoot = container.meshes[0];
  if (!importRoot) {
    return null;
  }

  const authoredRoot =
    [
      ...container.transformNodes,
      ...container.meshes.filter((mesh) => mesh !== importRoot),
    ].find((node) => node.parent === importRoot) ?? null;

  if (!authoredRoot) {
    return importRoot;
  }

  return authoredRoot;
};

export const LoadAsset = async (
  scene: BABYLON.Scene,
  options: AssetLoadOptions,
): Promise<AssetLoadResult | null> => {
  const {
    instanceId,
    modelPath,
    meshName,
    initialPosition,
    initialRotationY = 0,
    shadowGenerator,
    interactionMode = "frame",
    centerOnXAxis = true,
  } = options;

  try {
    const container = await BABYLON.LoadAssetContainerAsync(modelPath, scene);

    container.addAllToScene();
    // Buang light & camera bawaan GLB agar tidak mengganggu scene lighting
    container.lights.forEach((l) => l.dispose());
    container.cameras.forEach((c) => c.dispose());

    const rootMesh = getPlacementRoot(container);
    if (!rootMesh) {
      container.dispose();
      return null;
    }

    rootMesh.name = meshName;
    rootMesh.metadata = { instanceId, kind: meshName };

    // Terapkan posisi & rotasi yang sudah dihitung oleh pemanggil
    rootMesh.rotationQuaternion = null;
    rootMesh.position.copyFrom(initialPosition);
    rootMesh.rotation.y = initialRotationY;
    rootMesh.computeWorldMatrix(true);

    // Step 1:
    // Base furniture is centered on X so it lands neatly in the room.
    // Tambahan keeps its authored origin so it can stay aligned inside the furniture.
    if (centerOnXAxis) {
      const bounds = rootMesh.getHierarchyBoundingVectors(true);
      const modelCenterX = (bounds.min.x + bounds.max.x) / 2;
      rootMesh.position.x -= modelCenterX;
      rootMesh.computeWorldMatrix(true);
    }

    // Setup child meshes
    getRenderableMeshes(rootMesh).forEach((mesh) => {
      mesh.isPickable = true;
      mesh.receiveShadows = true;

      shadowGenerator?.addShadowCaster(mesh, false);
    });

    let boundingBoxMesh: BABYLON.Mesh | null = null;
    let dragBehavior: BABYLON.PointerDragBehavior | null = null;
    let disposeBoundingBox = () => {};
    let syncBoundingBox = () => {};

    // Step 2:
    // Only the main furniture gets selection outline + drag hitbox.
    // Tambahan stays attached to the furniture and does not need its own drag surface.
    if (interactionMode !== "none") {
      const boundingBoxController =
        interactionMode === "component"
          ? createComponentDraggableBoundingBox(scene, instanceId, rootMesh)
          : createFrameDraggableBoundingBox(scene, instanceId, rootMesh);

      boundingBoxMesh = boundingBoxController.mesh;
      dragBehavior = boundingBoxController.dragBehavior;
      disposeBoundingBox = boundingBoxController.dispose;
      syncBoundingBox = boundingBoxController.sync;
    }

    return {
      container,
      dragBehavior,
      instanceId,
      rootMesh,
      boundingBoxMesh,
      selectionMeshes: getRenderableMeshes(rootMesh),
      syncBoundingBox,
      dispose: () => {
        disposeBoundingBox();
        container.dispose();
      },
    };
  } catch (error) {
    console.error(`[TrialModelLoader] Failed to load "${modelPath}":`, error);
    return null;
  }
};
