import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

import { TRIAL_ROOM_CONFIG } from "./TrialConfig";

const TRIAL_MODEL_PATH = "/assets/3d/904-axis-bener.glb";

export interface TrialModelLoadResult {
  container: BABYLON.AssetContainer;
  rootMesh: BABYLON.AbstractMesh;
  dispose: () => void;
}

export const loadProductBase = async (
  scene: BABYLON.Scene,
  shadowGenerator?: BABYLON.ShadowGenerator,
): Promise<TrialModelLoadResult | null> => {
  try {
    const container = await BABYLON.LoadAssetContainerAsync(
      TRIAL_MODEL_PATH,
      scene,
    );

    container.addAllToScene();
    container.lights.forEach((light) => light.dispose());
    container.cameras.forEach((camera) => camera.dispose());

    const rootMesh = container.meshes[0];
    if (!rootMesh) {
      container.dispose();
      return null;
    }

    rootMesh.name = "trial-product-base";
    rootMesh.metadata = { kind: "trial-product-base" };

    const targetY = TRIAL_ROOM_CONFIG.floorThickness;
    const targetZ = TRIAL_ROOM_CONFIG.depth / 2 - 0.01;

    rootMesh.position.set(0, targetY, targetZ);
    rootMesh.rotationQuaternion = null;
    // rootMesh.rotation = new BABYLON.Vector3(0, 0, 0);

    rootMesh.computeWorldMatrix(true);

    rootMesh.getChildMeshes().forEach((mesh) => {
      mesh.isPickable = true;
      mesh.receiveShadows = true;
      shadowGenerator?.addShadowCaster(mesh, false);
    });

    return {
      container,
      rootMesh,
      dispose: () => container.dispose(),
    };
  } catch (error) {
    console.error("Error loading trial product base:", error);
    return null;
  }
};
