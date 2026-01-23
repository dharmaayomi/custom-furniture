import * as BABYLON from "@babylonjs/core";
import {
  applyTextureToMesh,
  addDragBehavior,
  autoScaleMesh,
  getMeshAABB,
  getAllFurniture,
  findAutoSnapPosition,
  getWallSnapPosition,
  type WallSide,
  WallSnapPosition,
} from "./MeshUtils_WallSnap";
import { CONFIG } from "./RoomConfig";

/**
 * Load main model and setup (always on back wall, centered)
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
    rootMesh.metadata = "furniture";

    // Apply texture to all child meshes
    rootMesh.getChildMeshes().forEach((m) => {
      if (activeTexture) applyTextureToMesh(m, activeTexture, scene);
    });

    // Auto scale
    const scaleFactor = autoScaleMesh(rootMesh, 80);

    // Calculate dimensions after scaling
    rootMesh.computeWorldMatrix(true);
    const box = getMeshAABB(rootMesh);
    const boundsInfo = rootMesh.getHierarchyBoundingVectors(true);

    console.log("=== MAIN MODEL ===");
    console.log("Model:", modelName);
    console.log("Scale:", scaleFactor.toFixed(2));
    console.log(
      "Dimensions (WxD):",
      box.width.toFixed(1),
      "x",
      box.depth.toFixed(1),
    );

    // Position on back wall, centered
    // FIX: Menggunakan signature baru (wall, mesh, pointerPos)
    // Kita gunakan Vector3(0,0,0) sebagai dummy pointer position agar ditaruh di tengah tembok belakang
    const wallPos = getWallSnapPosition(
      "back",
      rootMesh,
      new BABYLON.Vector3(0, 0, 0),
    );

    rootMesh.position.set(
      wallPos.x,
      -boundsInfo.min.y, // Stick to floor
      wallPos.z,
    );
    rootMesh.rotation.y = wallPos.rotation; // Face forward (rotation = 0)

    console.log(
      "Position:",
      rootMesh.position.x.toFixed(1),
      rootMesh.position.z.toFixed(1),
    );
    console.log(
      "Rotation:",
      ((wallPos.rotation * 180) / Math.PI).toFixed(0),
      "degrees",
    );
    console.log("Wall: back");
    console.log("==================");

    // Add drag behavior
    addDragBehavior(rootMesh, scene);

    return rootMesh;
  } catch (error) {
    console.error("Error loading main model:", error);
    return null;
  }
};

/**
 * Load additional model with AUTO-SNAP (only left/right)
 * Always stays on walls, rotates when switching walls
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
    rootMesh.metadata = "furniture";

    // Apply texture to all child meshes
    rootMesh.getChildMeshes().forEach((m) => {
      if (activeTexture) applyTextureToMesh(m, activeTexture, scene);
    });

    // Auto scale
    const scaleFactor = autoScaleMesh(rootMesh, 80);

    // Calculate dimensions after scaling
    rootMesh.computeWorldMatrix(true);
    const boundsInfoOriginal = rootMesh.getHierarchyBoundingVectors(true);

    // Get dimensions
    const box = getMeshAABB(rootMesh);
    const { width, depth } = box;

    console.log("\n=== ADDITIONAL MODEL ===");
    console.log("Model:", modelName);
    console.log("Dimensions:", width.toFixed(1), "x", depth.toFixed(1));

    // Get all existing furniture
    const allFurniture = getAllFurniture(scene, rootMesh);

    let finalPosition: WallSnapPosition | null = null;

    // Try to snap next to main furniture first (only left/right)
    if (mainMeshRef) {
      console.log("🎯 Trying to snap next to main furniture...");
      finalPosition = findAutoSnapPosition(
        mainMeshRef,
        width,
        depth,
        allFurniture,
      );

      if (finalPosition) {
        console.log(`✅ AUTO-SNAPPED next to main furniture`);
        console.log(
          `   Position: (${finalPosition.x.toFixed(1)}, ${finalPosition.z.toFixed(1)})`,
        );
        console.log(`   Wall: ${finalPosition.wall}`);
        console.log(
          `   Rotation: ${((finalPosition.rotation * 180) / Math.PI).toFixed(0)}°`,
        );
      }
    }

    // If can't snap to main, try other furniture
    if (!finalPosition && allFurniture.length > 0) {
      console.log("🔍 Trying to snap next to other furniture...");
      for (const furniture of allFurniture) {
        finalPosition = findAutoSnapPosition(
          furniture,
          width,
          depth,
          allFurniture,
        );
        if (finalPosition) {
          console.log(`✅ AUTO-SNAPPED next to ${furniture.name}`);
          console.log(`   Wall: ${finalPosition.wall}`);
          break;
        }
      }
    }

    // Fallback: place on back wall at available X position
    if (!finalPosition) {
      console.log("⚠️ No snap position found, placing on back wall");

      let posX = 0;
      const maxX = CONFIG.rw / 2 - width / 2 - 15;

      // Try different X positions on back wall
      const tryXPositions = [0, maxX / 2, -maxX / 2, maxX * 0.75, -maxX * 0.75];

      for (const testX of tryXPositions) {
        // FIX: Menggunakan signature baru (wall, mesh, pointerPos)
        // Kita simulasikan pointer position di koordinat testX
        const testWallPos = getWallSnapPosition(
          "back",
          rootMesh,
          new BABYLON.Vector3(testX, 0, 0),
        );

        const testBox = {
          minX: testWallPos.x - width / 2,
          maxX: testWallPos.x + width / 2,
          minZ: testWallPos.z - depth / 2,
          maxZ: testWallPos.z + depth / 2,
          width,
          depth,
        };

        let hasCollision = false;
        for (const other of allFurniture) {
          const otherBox = getMeshAABB(other);
          if (
            testBox.minX < otherBox.maxX &&
            testBox.maxX > otherBox.minX &&
            testBox.minZ < otherBox.maxZ &&
            testBox.maxZ > otherBox.minZ
          ) {
            hasCollision = true;
            break;
          }
        }

        if (!hasCollision) {
          posX = testX;
          break;
        }
      }

      // Final call dengan posisi X yang sudah dipilih
      finalPosition = getWallSnapPosition(
        "back",
        rootMesh,
        new BABYLON.Vector3(posX, 0, 0),
      );
    }

    // Set final position and rotation
    rootMesh.position.set(
      finalPosition.x,
      -boundsInfoOriginal.min.y, // Stick to floor
      finalPosition.z,
    );
    rootMesh.rotation.y = finalPosition.rotation; // Set correct rotation for wall

    console.log(
      "Final position:",
      rootMesh.position.x.toFixed(1),
      rootMesh.position.z.toFixed(1),
    );
    console.log(
      "Final rotation:",
      ((finalPosition.rotation * 180) / Math.PI).toFixed(0),
      "degrees",
    );
    console.log("Final wall:", finalPosition.wall);
    console.log("========================\n");

    // Add drag behavior (will handle wall switching)
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
