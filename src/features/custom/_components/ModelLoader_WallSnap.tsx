import { FurnitureTransform, useRoomStore } from "@/store/useRoomStore";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import {
  WallSnapPosition,
  addDragBehavior,
  applyTextureToMesh,
  autoScaleMesh,
  findAutoSnapPosition,
  getAllFurniture,
  getMeshAABB,
  getWallSnapPosition,
  updateRoomDimensions,
} from "./MeshUtils_WallSnap";
import { CONFIG } from "./RoomConfig";

/**
 * Load main model and setup (always on back wall, centered)
 */
export const loadMainModel = async (
  modelName: string,
  activeTexture: string,
  scene: BABYLON.Scene,
  savedTransform?: FurnitureTransform,
): Promise<BABYLON.AbstractMesh | null> => {
  try {
    updateRoomDimensions();
    const container = await BABYLON.LoadAssetContainerAsync(
      "/assets/3d/" + modelName,
      scene,
    );

    container.addAllToScene();
    const meshes = container.meshes;
    if (meshes.length === 0) return null;

    const rootMesh = meshes[0];
    // rootMesh.metadata = "furniture";
    const uniqueName = `${modelName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    rootMesh.name = savedTransform ? savedTransform.modelName : uniqueName;
    rootMesh.metadata = "furniture";

    // Apply texture to all child meshes
    rootMesh.getChildMeshes().forEach((m) => {
      if (activeTexture) applyTextureToMesh(m, activeTexture, scene);
    });

    // Auto scale
    const scaleFactor = autoScaleMesh(rootMesh, 240);

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

    if (savedTransform) {
      // KASUS 1: REDO / UNDO (Gunakan data history)
      console.log("↺ Restoring Main Model from History...");

      // Langsung set posisi & rotasi dari history
      rootMesh.position.set(
        savedTransform.position.x,
        savedTransform.position.y,
        savedTransform.position.z,
      );
      rootMesh.rotation.y = savedTransform.rotation;

      // TIDAK PERLU updateTransformSilent karena data sudah ada di store
    } else {
      // KASUS 2: MODEL BARU (Auto Snap)
      console.log("✨ New Main Model Auto-Snap...");

      const wallPos = getWallSnapPosition(
        "back",
        rootMesh,
        new BABYLON.Vector3(0, 0, 0),
      );

      rootMesh.position.set(wallPos.x, 10 - boundsInfo.min.y, wallPos.z);
      rootMesh.rotation.y = wallPos.rotation;

      // UPDATE STORE LANGSUNG (TANPA SETTIMEOUT)
      // Agar saat user menambah model berikutnya, posisi ini sudah tersimpan
      const { updateTransformSilent } = useRoomStore.getState();

      const initialTransform: FurnitureTransform = {
        modelName: rootMesh.name,
        position: {
          x: rootMesh.position.x,
          y: rootMesh.position.y,
          z: rootMesh.position.z,
        },
        rotation: rootMesh.rotation.y,
      };

      updateTransformSilent(0, initialTransform, true);
    }

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
  savedTransform?: FurnitureTransform,
): Promise<void> => {
  try {
    updateRoomDimensions();

    // const { present } = useRoomStore.getState();
    // const uniqueId =
    //   present.additionalModels.find((id) =>
    //     id.includes(modelName.split(".")[0]),
    //   ) || modelName;

    let uniqueId = savedTransform?.modelName;

    if (!uniqueId) {
      const { present } = useRoomStore.getState();
      uniqueId =
        present.additionalModels.find((id) =>
          id.includes(modelName.split(".")[0]),
        ) || modelName;
    }

    const container = await BABYLON.LoadAssetContainerAsync(
      "/assets/3d/" + modelName,
      scene,
    );

    container.addAllToScene();
    const meshes = container.meshes;

    if (meshes.length === 0) return;

    const rootMesh = meshes[0];
    rootMesh.name = uniqueId;
    rootMesh.metadata = "furniture";

    // Apply texture to all child meshes
    rootMesh.getChildMeshes().forEach((m) => {
      if (activeTexture) applyTextureToMesh(m, activeTexture, scene);
    });

    // Auto scale
    autoScaleMesh(rootMesh, 240);

    // Calculate dimensions after scaling
    rootMesh.computeWorldMatrix(true);
    const boundsInfoOriginal = rootMesh.getHierarchyBoundingVectors(true);

    // Get dimensions
    const box = getMeshAABB(rootMesh);
    const { width, depth } = box;

    console.log("\n=== ADDITIONAL MODEL ===");
    console.log("Model:", modelName);
    console.log("Dimensions:", width.toFixed(1), "x", depth.toFixed(1));

    const isValidHistory =
      savedTransform &&
      !(
        savedTransform.position.x === 0 &&
        savedTransform.position.y === 0 &&
        savedTransform.position.z === 0
      );
    if (isValidHistory) {
      // --------------------------------------------------------
      // KASUS 1: REDO / UNDO (Gunakan data history)
      // --------------------------------------------------------
      console.log("↺ Restoring Additional Model from History...");

      // Langsung set posisi & rotasi dari history
      rootMesh.position.set(
        savedTransform.position.x,
        savedTransform.position.y,
        savedTransform.position.z,
      );
      rootMesh.rotation.y = savedTransform!.rotation;

      // NOTE: Tidak perlu update store di sini karena data sudah ada di history
    } else {
      // --------------------------------------------------------
      // KASUS 2: MODEL BARU (Jalankan Auto Snap Original Anda)
      // --------------------------------------------------------
      console.log("✨ New Additional Model Auto-Snap...");

      // Get all existing furniture
      const allFurniture = getAllFurniture(scene, rootMesh);
      let finalPosition: WallSnapPosition | null = null;

      // A. Try to snap next to main furniture first (only left/right)
      if (mainMeshRef) {
        console.log("🎯 Trying to snap next to main furniture...");

        if (rootMesh.rotationQuaternion) {
          rootMesh.rotationQuaternion = null;
        }
        // ⭐ Set rotasi DULU sama dengan main furniture
        rootMesh.rotation.y = mainMeshRef.rotation.y;
        rootMesh.computeWorldMatrix(true);

        finalPosition = findAutoSnapPosition(
          mainMeshRef,
          width,
          depth,
          allFurniture,
        );

        if (finalPosition) {
          // ⭐ OVERRIDE rotasi dari findAutoSnapPosition dengan rotasi main furniture
          finalPosition.rotation = mainMeshRef.rotation.y;

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

      // B. If can't snap to main, try other furniture
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

      // C. Fallback: place on back wall at available X position
      if (!finalPosition) {
        console.log("⚠️ No snap position found, placing on back wall");

        let posX = 0;
        const maxX = CONFIG.rw / 2 - width / 2 - 15;

        // Try different X positions on back wall
        const tryXPositions = [
          0,
          maxX / 2,
          -maxX / 2,
          maxX * 0.75,
          -maxX * 0.75,
        ];

        for (const testX of tryXPositions) {
          // Menggunakan signature (wall, mesh, pointerPos)
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

        finalPosition = getWallSnapPosition(
          "back",
          rootMesh,
          new BABYLON.Vector3(posX, 0, 0),
        );
      }

      // Set final position and rotation
      rootMesh.position.set(
        finalPosition.x,
        10 - boundsInfoOriginal.min.y, // Stick to floor
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

      // --------------------------------------------------------
      // UPDATE STORE LANGSUNG (TANPA SETTIMEOUT)
      // --------------------------------------------------------
      const { updateTransformSilent } = useRoomStore.getState();
      const allFurnitureForIndex = getAllFurniture(scene);
      const meshIndex = allFurnitureForIndex.indexOf(rootMesh);

      const initialTransform: FurnitureTransform = {
        modelName: rootMesh.name,
        position: {
          x: rootMesh.position.x,
          y: rootMesh.position.y,
          z: rootMesh.position.z,
        },
        rotation: rootMesh.rotation.y,
      };

      if (meshIndex === 0) {
        updateTransformSilent(0, initialTransform, true);
        console.log("💾 Additional saved as MAIN (index 0) [Silent Update]");
      } else {
        // Index - 1 karena index 0 biasanya main model
        updateTransformSilent(meshIndex - 1, initialTransform, false);
        console.log(
          `💾 Additional model saved (index ${meshIndex - 1}) [Silent Update]`,
        );
      }
    }

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
