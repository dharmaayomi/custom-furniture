import * as BABYLON from "@babylonjs/core";
import {
  applyTextureToMesh,
  addDragBehavior,
  autoScaleMesh,
  calculateAdditionalModelPosition,
} from "./MeshUtils";
import { CONFIG } from "./RoomConfig";

/**
 * Load main model and setup
 */
export const loadMainModel = async (
  modelName: string,
  activeTexture: string,
  scene: BABYLON.Scene,
): Promise<BABYLON.AbstractMesh | null> => {
  try {
    const result = await BABYLON.SceneLoader.ImportMeshAsync(
      "",
      "/assets/3d/",
      modelName,
      scene,
    );

    const meshes = result.meshes;
    if (meshes.length === 0) return null;

    const rootMesh = meshes[0];

    // Set metadata ONLY on root mesh
    rootMesh.metadata = "furniture";

    // Apply texture to all child meshes (but don't set metadata on them)
    rootMesh.getChildMeshes().forEach((m) => {
      if (activeTexture) applyTextureToMesh(m, activeTexture, scene);
    });

    // Auto scale
    const scaleFactor = autoScaleMesh(rootMesh, 80);

    // Calculate dimensions after scaling
    rootMesh.computeWorldMatrix(true);
    const boundsInfo = rootMesh.getHierarchyBoundingVectors(true);
    const meshDepth = boundsInfo.max.z - boundsInfo.min.z;
    const meshWidth = boundsInfo.max.x - boundsInfo.min.x;
    const meshHeight = boundsInfo.max.y - boundsInfo.min.y;

    console.log("=== MAIN MODEL DEBUG ===");
    console.log("Model:", modelName);
    console.log("Scale:", scaleFactor.toFixed(2));
    console.log(
      "Dimensions (WxHxD):",
      meshWidth.toFixed(1),
      "x",
      meshHeight.toFixed(1),
      "x",
      meshDepth.toFixed(1),
    );

    // Position INSIDE room against back wall
    // Back wall is at Z = +rd/2, so object should be at Z = +rd/2 - meshDepth/2 - offset
    // This places object INSIDE room, against back wall
    const backWallInnerZ = CONFIG.rd / 2 - meshDepth / 2 - 15;

    // Constrain within room bounds
    const maxX = CONFIG.rw / 2 - meshWidth / 2 - 15;
    const finalX = Math.max(-maxX, Math.min(maxX, 0)); // Start at center

    rootMesh.position.set(
      finalX,
      -boundsInfo.min.y, // Stick to floor
      backWallInnerZ,
    );

    console.log(
      "Position:",
      rootMesh.position.x.toFixed(1),
      rootMesh.position.y.toFixed(1),
      rootMesh.position.z.toFixed(1),
    );
    console.log(
      "Room: X=[" +
        -CONFIG.rw / 2 +
        " to +" +
        CONFIG.rw / 2 +
        "], Z=[" +
        -CONFIG.rd / 2 +
        " to +" +
        CONFIG.rd / 2 +
        "]",
    );
    console.log(
      "Back wall Z:",
      CONFIG.rd / 2,
      "| Object Z:",
      backWallInnerZ.toFixed(1),
    );
    console.log("=======================");

    // Add visual debug box
    const debugBox = BABYLON.MeshBuilder.CreateBox(
      "debugBox_main",
      { width: meshWidth, height: meshHeight, depth: meshDepth },
      scene,
    );
    debugBox.position = rootMesh.position.clone();
    debugBox.position.y = meshHeight / 2;
    const debugMat = new BABYLON.StandardMaterial("debugMat", scene);
    debugMat.wireframe = true;
    debugMat.emissiveColor = new BABYLON.Color3(0, 1, 0); // Green wireframe
    debugBox.material = debugMat;
    debugBox.isPickable = false;

    // Add drag behavior
    addDragBehavior(rootMesh, scene);

    return rootMesh;
  } catch (error) {
    console.error("Error loading main model:", error);
    return null;
  }
};

/**
 * Load additional model and position it appropriately
 */
export const loadAdditionalModel = async (
  modelName: string,
  activeTexture: string,
  scene: BABYLON.Scene,
  mainMeshRef: BABYLON.AbstractMesh | null,
): Promise<void> => {
  try {
    const result = await BABYLON.SceneLoader.ImportMeshAsync(
      "",
      "/assets/3d/",
      modelName,
      scene,
    );

    const meshes = result.meshes;
    if (meshes.length === 0) return;

    const rootMesh = meshes[0];

    // Set metadata ONLY on root mesh
    rootMesh.metadata = "furniture";

    // Apply texture to all child meshes (but don't set metadata on them)
    rootMesh.getChildMeshes().forEach((m) => {
      if (activeTexture) applyTextureToMesh(m, activeTexture, scene);
    });

    // Auto scale (calculate bounds before scaling)
    const boundsInfoOriginal = rootMesh.getHierarchyBoundingVectors(true);
    const sizeY = boundsInfoOriginal.max.y - boundsInfoOriginal.min.y;
    const targetHeight = 80;
    const scaleFactor = sizeY > 0 ? targetHeight / sizeY : 1;

    // Apply scaling
    rootMesh.scaling.set(scaleFactor, scaleFactor, scaleFactor);

    // Calculate bounds after scaling
    rootMesh.computeWorldMatrix(true);
    const boundsInfo = rootMesh.getHierarchyBoundingVectors(true);

    // Calculate dimensions
    const meshWidth = boundsInfo.max.x - boundsInfo.min.x;
    const meshDepth = boundsInfo.max.z - boundsInfo.min.z;

    // Calculate position
    const position = calculateAdditionalModelPosition(
      meshWidth,
      meshDepth,
      mainMeshRef,
    );

    // Set final position
    rootMesh.position.set(
      position.x,
      -boundsInfo.min.y, // Stick to floor
      position.z,
    );

    console.log("Additional model loaded at:", rootMesh.position);

    // Add drag behavior
    addDragBehavior(rootMesh, scene);
  } catch (error) {
    console.error("Error loading additional model:", error);
  }
};

/**
 * Update texture on all furniture meshes
 */
export const updateAllTextures = (
  scene: BABYLON.Scene,
  activeTexture: string,
  mainMeshRef: BABYLON.AbstractMesh | null,
) => {
  if (mainMeshRef) {
    mainMeshRef.getChildMeshes().forEach((m) => {
      applyTextureToMesh(m, activeTexture, scene);
    });
  }

  scene.meshes.forEach((mesh) => {
    if (mesh.metadata === "furniture" && mesh.parent !== mainMeshRef) {
      applyTextureToMesh(mesh, activeTexture, scene);
    }
  });
};
