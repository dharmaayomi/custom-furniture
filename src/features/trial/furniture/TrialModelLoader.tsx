import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

import {
  buildOutlineController,
  createDraggableBoundingBox,
} from "./TrialModelUtils";
import { useTrialRoomStore } from "../useTrialRoomStore";

/**
 * TrialModelLoader.ts
 *
 * Tanggung jawab file ini:
 *   1. Load GLB dari path yang diberikan
 *   2. Setup shadow caster + pickable pada child mesh
 *   3. Pasang outline controller + drag hitbox
 *   4. Return result — TIDAK menentukan posisi
 *
 * Posisi awal ditentukan oleh pemanggil (TrialSceneSetup atau hook React),
 * karena hanya pemanggil yang tahu konteks ruangan saat itu.
 */

export interface TrialModelLoadOptions {
  modelPath: string;
  meshName: string;
  initialPosition: BABYLON.Vector3;
  initialRotationY?: number;
  shadowGenerator?: BABYLON.ShadowGenerator;
  enableInteraction?: boolean;
  centerOnXAxis?: boolean;
}

export interface TrialModelLoadResult {
  container: BABYLON.AssetContainer;
  rootMesh: BABYLON.TransformNode;
  boundingBoxMesh: BABYLON.Mesh | null;
  setOutline: (visible: boolean) => void;
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

const getRenderableMeshes = (rootMesh: BABYLON.TransformNode) => {
  const renderMeshes = rootMesh.getChildMeshes();

  if (rootMesh instanceof BABYLON.AbstractMesh) {
    renderMeshes.unshift(rootMesh);
  }

  return renderMeshes;
};

export const loadProductBase = async (
  scene: BABYLON.Scene,
  options: TrialModelLoadOptions,
): Promise<TrialModelLoadResult | null> => {
  const {
    modelPath,
    meshName,
    initialPosition,
    initialRotationY = 0,
    shadowGenerator,
    enableInteraction = true,
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
    rootMesh.metadata = { kind: meshName };

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

    let setOutline = (_visible: boolean) => {};
    let unsubscribe = () => {};
    let boundingBoxMesh: BABYLON.Mesh | null = null;

    // Step 2:
    // Only the main furniture gets selection outline + drag hitbox.
    // Tambahan stays attached to the furniture and does not need its own drag surface.
    if (enableInteraction && rootMesh instanceof BABYLON.AbstractMesh) {
      setOutline = buildOutlineController(scene, rootMesh);
      setOutline(false);

      unsubscribe = useTrialRoomStore.subscribe((state) => {
        setOutline(state.selectedMeshName === meshName);
      });

      boundingBoxMesh = createDraggableBoundingBox(scene, rootMesh, setOutline);
    }

    return {
      container,
      rootMesh,
      boundingBoxMesh,
      setOutline,
      dispose: () => {
        unsubscribe();
        boundingBoxMesh?.dispose();
        container.dispose();
      },
    };
  } catch (error) {
    console.error(`[TrialModelLoader] Failed to load "${modelPath}":`, error);
    return null;
  }
};
