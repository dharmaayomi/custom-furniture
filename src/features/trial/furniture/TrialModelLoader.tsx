// import * as BABYLON from "@babylonjs/core";
// import "@babylonjs/loaders/glTF";

// import { TRIAL_ROOM_CONFIG } from "../core/TrialConfig";
// import {
//   buildOutlineController,
//   createDraggableBoundingBox,
// } from "./TrialModelUtils";

// const TRIAL_MODEL_PATH = "/assets/3d/cobalagi-antinode.glb";

// export interface TrialModelLoadResult {
//   container: BABYLON.AssetContainer;
//   rootMesh: BABYLON.AbstractMesh;
//   boundingBoxMesh: BABYLON.Mesh;
//   /** Nyalakan / matikan outline kuning secara manual dari luar */
//   setOutline: (visible: boolean) => void;
//   dispose: () => void;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // loadProductBase — entry point utama
// // ─────────────────────────────────────────────────────────────────────────────
// export const loadProductBase = async (
//   scene: BABYLON.Scene,
//   shadowGenerator?: BABYLON.ShadowGenerator,
// ): Promise<TrialModelLoadResult | null> => {
//   try {
//     // Load GLB ke AssetContainer (belum masuk scene)
//     const container = await BABYLON.LoadAssetContainerAsync(
//       TRIAL_MODEL_PATH,
//       scene,
//     );

//     // Masukkan semua asset ke scene, buang light & camera bawaan GLB
//     container.addAllToScene();
//     container.lights.forEach((l) => l.dispose());
//     container.cameras.forEach((c) => c.dispose());

//     const rootMesh = container.meshes[0];
//     if (!rootMesh) {
//       container.dispose();
//       return null;
//     }

//     rootMesh.name = "trial-product-base";
//     rootMesh.metadata = { kind: "trial-product-base" };

//     // Posisikan: di atas lantai, belakang ruangan, nempel tembok
//     const targetY = TRIAL_ROOM_CONFIG.floorThickness;
//     const targetZ = TRIAL_ROOM_CONFIG.depth / 2 - 0.01;
//     rootMesh.position.set(0, targetY, targetZ);
//     rootMesh.rotationQuaternion = null;
//     rootMesh.computeWorldMatrix(true);

//     const bounds = rootMesh.getHierarchyBoundingVectors(true);
//     const modelCenterX = (bounds.min.x + bounds.max.x) / 2;
//     rootMesh.position.x -= modelCenterX;
//     rootMesh.position.y = targetY;
//     rootMesh.position.z = targetZ;

//     // Setup child mesh: pickable, shadow receiver, shadow caster
//     rootMesh.getChildMeshes().forEach((mesh) => {
//       mesh.isPickable = true;
//       mesh.receiveShadows = true;
//       shadowGenerator?.addShadowCaster(mesh, false);
//     });

//     // Buat controller outline (awalnya mati)
//     const setOutline = buildOutlineController(scene, rootMesh);
//     setOutline(false);

//     // Buat hitbox transparan + drag + hover outline
//     const boundingBoxMesh = createDraggableBoundingBox(
//       scene,
//       rootMesh,
//       setOutline,
//     );

//     return {
//       container,
//       rootMesh,
//       boundingBoxMesh,
//       setOutline, // expose ke luar kalau perlu toggle dari komponen React
//       dispose: () => {
//         boundingBoxMesh.dispose();
//         container.dispose();
//       },
//     };
//   } catch (error) {
//     console.error("Error loading trial product base:", error);
//     return null;
//   }
// };

import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

import {
  buildOutlineController,
  createDraggableBoundingBox,
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
 * Posisi awal ditentukan oleh pemanggil (TrialSceneSetup atau hook React),
 * karena hanya pemanggil yang tahu konteks ruangan saat itu.
 */

export interface TrialModelLoadOptions {
  /** Path ke file GLB, misal "/assets/3d/my-model.glb" */
  modelPath: string;
  /** Nama unik untuk rootMesh di scene */
  meshName: string;
  /** Posisi awal (world space). Pemanggil yang menghitung ini. */
  initialPosition: BABYLON.Vector3;
  /** Rotasi Y awal dalam radian */
  initialRotationY?: number;
  /** Opsional shadow generator */
  shadowGenerator?: BABYLON.ShadowGenerator;
}

export interface TrialModelLoadResult {
  container: BABYLON.AssetContainer;
  rootMesh: BABYLON.AbstractMesh;
  boundingBoxMesh: BABYLON.Mesh;
  /** Toggle outline kuning dari luar (misal: saat item dipilih dari UI) */
  setOutline: (visible: boolean) => void;
  dispose: () => void;
}

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
  } = options;

  try {
    const container = await BABYLON.LoadAssetContainerAsync(modelPath, scene);

    container.addAllToScene();
    // Buang light & camera bawaan GLB agar tidak mengganggu scene lighting
    container.lights.forEach((l) => l.dispose());
    container.cameras.forEach((c) => c.dispose());

    const rootMesh = container.meshes[0];
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

    // Koreksi X agar model di-center secara horizontal
    const bounds = rootMesh.getHierarchyBoundingVectors(true);
    const modelCenterX = (bounds.min.x + bounds.max.x) / 2;
    rootMesh.position.x -= modelCenterX;
    rootMesh.computeWorldMatrix(true);

    // Setup child meshes
    rootMesh.getChildMeshes().forEach((mesh) => {
      mesh.isPickable = true;
      mesh.receiveShadows = true;
      shadowGenerator?.addShadowCaster(mesh, false);
    });

    // Outline + drag
    const setOutline = buildOutlineController(scene, rootMesh);
    setOutline(false);

    const boundingBoxMesh = createDraggableBoundingBox(
      scene,
      rootMesh,
      setOutline,
    );

    return {
      container,
      rootMesh,
      boundingBoxMesh,
      setOutline,
      dispose: () => {
        boundingBoxMesh.dispose();
        container.dispose();
      },
    };
  } catch (error) {
    console.error(`[TrialModelLoader] Failed to load "${modelPath}":`, error);
    return null;
  }
};
