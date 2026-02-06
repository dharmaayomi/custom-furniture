import { FurnitureTransform, useRoomStore } from "@/store/useRoomStore";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import {
  WallSnapPosition,
  addDragBehavior,
  applyTextureToMesh,
  cacheOriginalMaterials,
  autoScaleMesh,
  findAutoSnapPosition,
  getAllFurniture,
  getMeshAABB,
  getWallSnapPosition,
  updateRoomDimensions,
} from "./MeshUtils_WallSnap";
import { CONFIG, FLOOR_Y } from "./RoomConfig";

/**
 * Load main model and setup (always on back wall, centered)
 */
// export const loadMainModel = async (
//   modelName: string,
//   activeTexture: string,
//   scene: BABYLON.Scene,
//   savedTransform?: FurnitureTransform,
// ): Promise<BABYLON.AbstractMesh | null> => {
//   try {
//     updateRoomDimensions();
//     const container = await BABYLON.LoadAssetContainerAsync(
//       "/assets/3d/" + modelName,
//       scene,
//     );

//     container.addAllToScene();
//     const meshes = container.meshes;
//     if (meshes.length === 0) return null;

//     const rootMesh = meshes[0];
//     // rootMesh.metadata = "furniture";
//     const uniqueName = `${modelName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//     rootMesh.name = savedTransform ? savedTransform.modelName : uniqueName;
//     rootMesh.metadata = "furniture";

//     // Apply texture to all child meshes
//     rootMesh.getChildMeshes().forEach((m) => {
//       if (activeTexture) applyTextureToMesh(m, activeTexture, scene);
//     });

//     // Auto scale
//     const scaleFactor = autoScaleMesh(rootMesh, 240);
//     rootMesh.refreshBoundingInfo(true, true);

//     // 2. Pastikan semua child mesh (bagian-bagian model) bersifat 'pickable'
//     rootMesh.getChildMeshes().forEach((m) => {
//       m.isPickable = true;
//       // Opsional: Memastikan bounding info anak juga terupdate
//       m.refreshBoundingInfo(true, true);
//     });

//     // Calculate dimensions after scaling
//     rootMesh.computeWorldMatrix(true);
//     const box = getMeshAABB(rootMesh);
//     const boundsInfo = rootMesh.getHierarchyBoundingVectors(true);

//     console.log("=== MAIN MODEL ===");
//     console.log("Model:", modelName);
//     console.log("Scale:", scaleFactor.toFixed(2));
//     console.log(
//       "Dimensions (WxD):",
//       box.width.toFixed(1),
//       "x",
//       box.depth.toFixed(1),
//     );

//     if (savedTransform) {
//       // KASUS 1: REDO / UNDO (Gunakan data history)
//       console.log("↺ Restoring Main Model from History...");

//       // Langsung set posisi & rotasi dari history
//       rootMesh.position.set(
//         savedTransform.position.x,
//         savedTransform.position.y,
//         savedTransform.position.z,
//       );
//       rootMesh.rotation.y = savedTransform.rotation;
//     } else {
//       // KASUS 2: MODEL BARU (Auto Snap)
//       console.log("✨ New Main Model Auto-Snap...");

//       const wallPos = getWallSnapPosition(
//         "back",
//         rootMesh,
//         new BABYLON.Vector3(0, 0, 0),
//       );

//       rootMesh.position.set(wallPos.x, 10 - boundsInfo.min.y, wallPos.z);
//       rootMesh.rotation.y = wallPos.rotation;

//       // UPDATE STORE LANGSUNG (TANPA SETTIMEOUT)
//       const { updateTransformSilent } = useRoomStore.getState();

//       const initialTransform: FurnitureTransform = {
//         modelName: rootMesh.name,
//         position: {
//           x: rootMesh.position.x,
//           y: rootMesh.position.y,
//           z: rootMesh.position.z,
//         },
//         rotation: rootMesh.rotation.y,
//       };

//       updateTransformSilent(0, initialTransform, true);
//     }
//     // DEBUGGING: Visualisasikan Bounding Box
//     // rootMesh.showBoundingBox = true;
//     // rootMesh.getChildMeshes().forEach((m) => {
//     //   m.showBoundingBox = true;
//     // });

//     // Add drag behavior

//     addDragBehavior(rootMesh, scene);

//     return rootMesh;
//   } catch (error) {
//     console.error("Error loading main model:", error);
//     return null;
//   }
// };
// export const loadMainModel = async (
//   modelName: string,
//   activeTexture: string,
//   scene: BABYLON.Scene,
//   savedTransform?: FurnitureTransform,
// ): Promise<BABYLON.AbstractMesh | null> => {
//   try {
//     updateRoomDimensions();
//     const container = await BABYLON.LoadAssetContainerAsync(
//       "/assets/3d/" + modelName,
//       scene,
//     );

//     container.addAllToScene();
//     const meshes = container.meshes;
//     if (meshes.length === 0) return null;

//     const rootMesh = meshes[0];
//     const uniqueName = `${modelName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//     rootMesh.name = savedTransform ? savedTransform.modelName : uniqueName;
//     rootMesh.metadata = "furniture";

//     // Apply texture to all child meshes
//     rootMesh.getChildMeshes().forEach((m) => {
//       if (activeTexture) applyTextureToMesh(m, activeTexture, scene);
//     });

//     // Auto scale
//     const scaleFactor = autoScaleMesh(rootMesh, 240);
//     rootMesh.refreshBoundingInfo(true, true);

//     // Make all child meshes pickable
//     rootMesh.getChildMeshes().forEach((m) => {
//       m.isPickable = true;
//       m.refreshBoundingInfo(true, true);
//     });

//     // Calculate dimensions and anchor point after scaling
//     rootMesh.computeWorldMatrix(true);
//     const boundsInfo = rootMesh.getHierarchyBoundingVectors(true);

//     // DETECT ANCHOR POINT POSITION
//     // Check where the anchor (0,0,0) is relative to the bounding box
//     const anchorOffsetX = -boundsInfo.min.x; // Distance from left edge
//     const anchorOffsetZ = -boundsInfo.min.z; // Distance from front edge
//     const anchorOffsetY = -boundsInfo.min.y; // Distance from bottom

//     const sizeX = boundsInfo.max.x - boundsInfo.min.x;
//     const sizeZ = boundsInfo.max.z - boundsInfo.min.z;
//     const sizeY = boundsInfo.max.y - boundsInfo.min.y;

//     // Calculate anchor position as percentage (0 = min edge, 0.5 = center, 1 = max edge)
//     const anchorPosX = anchorOffsetX / sizeX; // 0 = left, 0.5 = center, 1 = right
//     const anchorPosZ = anchorOffsetZ / sizeZ; // 0 = front, 0.5 = center, 1 = back
//     const anchorPosY = anchorOffsetY / sizeY; // 0 = bottom, 0.5 = center, 1 = top

//     console.log("=== MAIN MODEL ===");
//     console.log("Model:", modelName);
//     console.log("Scale:", scaleFactor.toFixed(2));
//     console.log("Anchor Point Detection:");
//     console.log("  X:", anchorPosX.toFixed(2), "(0=left, 0.5=center, 1=right)");
//     console.log("  Y:", anchorPosY.toFixed(2), "(0=bottom, 0.5=center, 1=top)");
//     console.log("  Z:", anchorPosZ.toFixed(2), "(0=front, 0.5=center, 1=back)");

//     const box = getMeshAABB(rootMesh);
//     console.log(
//       "Dimensions (WxD):",
//       box.width.toFixed(1),
//       "x",
//       box.depth.toFixed(1),
//     );

//     if (savedTransform) {
//       // CASE 1: REDO / UNDO (Use history data)
//       console.log("↺ Restoring Main Model from History...");

//       rootMesh.position.set(
//         savedTransform.position.x,
//         savedTransform.position.y,
//         savedTransform.position.z,
//       );
//       rootMesh.rotation.y = savedTransform.rotation;
//     } else {
//       // CASE 2: NEW MODEL (Auto Snap with anchor point correction)
//       console.log("✨ New Main Model Auto-Snap...");

//       const wallPos = getWallSnapPosition(
//         "back",
//         rootMesh,
//         new BABYLON.Vector3(0, 0, 0),
//       );

//       // Apply position with Y-axis correction based on anchor point
//       // If anchor is at bottom (anchorPosY ≈ 0), we need: 10 - boundsInfo.min.y
//       // If anchor is at center (anchorPosY ≈ 0.5), we need: 10 + sizeY/2
//       const yPosition = 10 - boundsInfo.min.y;

//       rootMesh.position.set(wallPos.x, yPosition, wallPos.z);
//       rootMesh.rotation.y = wallPos.rotation;

//       // UPDATE STORE IMMEDIATELY (NO SETTIMEOUT)
//       const { updateTransformSilent } = useRoomStore.getState();

//       const initialTransform: FurnitureTransform = {
//         modelName: rootMesh.name,
//         position: {
//           x: rootMesh.position.x,
//           y: rootMesh.position.y,
//           z: rootMesh.position.z,
//         },
//         rotation: rootMesh.rotation.y,
//       };

//       updateTransformSilent(0, initialTransform, true);
//     }

//     // DEBUGGING: Visualize Bounding Box
//     // rootMesh.showBoundingBox = true;
//     // rootMesh.getChildMeshes().forEach((m) => {
//     //   m.showBoundingBox = true;
//     // });

//     // Add drag behavior
//     addDragBehavior(rootMesh, scene);

//     return rootMesh;
//   } catch (error) {
//     console.error("Error loading main model:", error);
//     return null;
//   }
// };
export const loadMainModel = async (
  modelName: string,
  activeTexture: string,
  scene: BABYLON.Scene,
  savedTransform?: FurnitureTransform,
): Promise<BABYLON.AbstractMesh | null> => {
  try {
    // IMPORTANT: Clear any previous main model first (only if not from history)
    if (!savedTransform) {
      const { present } = useRoomStore.getState();
      if (present.mainModelTransform) {
        const existingMainModel = scene.getMeshByName(
          present.mainModelTransform.modelName,
        );
        if (existingMainModel) {
          console.log("Disposing previous main model:", existingMainModel.name);
          existingMainModel.dispose();
        }
      }
    }

    updateRoomDimensions();

    const container = await BABYLON.LoadAssetContainerAsync(
      "/assets/3d/" + modelName,
      scene,
    );

    container.addAllToScene();
    // Prevent asset-embedded lights/cameras from stacking with scene lighting
    container.lights.forEach((l) => l.dispose());
    container.cameras.forEach((c) => c.dispose());
    // Safety net: remove any lights that slipped in
    const allowedLightIds: number[] =
      (scene.metadata && scene.metadata.allowedLightIds) || [];
    scene.lights
      .filter((l) => !allowedLightIds.includes(l.uniqueId))
      .forEach((l) => l.dispose());
    const meshes = container.meshes;
    if (meshes.length === 0) return null;

    const rootMesh = meshes[0];
    const uniqueName = `${modelName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    rootMesh.name = savedTransform ? savedTransform.modelName : uniqueName;
    rootMesh.metadata = "furniture";

    // Pre-cache original materials so Reset/clear restores true originals
    cacheOriginalMaterials(rootMesh);

    // Apply texture to all child meshes
    rootMesh.getChildMeshes().forEach((m) => {
      if (activeTexture) applyTextureToMesh(m, activeTexture, scene);
    });

    // Auto scale
    const scaleFactor = autoScaleMesh(rootMesh);

    // Make all child meshes pickable
    // Agar bagian atas model yang tinggi tetap punya area klik yang valid
    rootMesh.getChildMeshes().forEach((m) => {
      m.isPickable = true;
      m.computeWorldMatrix(true); // Paksa hitung posisi/skala baru
      m.refreshBoundingInfo(true, true); // Paksa update kotak pembungkus (hitbox)
    });

    // Force comprehensive update to recalculate bounds for THIS model
    rootMesh.computeWorldMatrix(true);
    rootMesh.refreshBoundingInfo(true, true);

    // RECALCULATE dimensions for THIS specific model
    const boundsInfo = rootMesh.getHierarchyBoundingVectors(true);
    const box = getMeshAABB(rootMesh);

    console.log("\n=== MAIN MODEL ===");
    console.log("Model:", modelName);
    console.log("Unique Name:", rootMesh.name);
    // console.log("Scale Factor:", scaleFactor.toFixed(2));
    console.log(
      "BoundsInfo Min:",
      boundsInfo.min.x.toFixed(1),
      boundsInfo.min.y.toFixed(1),
      boundsInfo.min.z.toFixed(1),
    );
    console.log(
      "BoundsInfo Max:",
      boundsInfo.max.x.toFixed(1),
      boundsInfo.max.y.toFixed(1),
      boundsInfo.max.z.toFixed(1),
    );
    console.log(
      "Box Width x Depth:",
      box.width.toFixed(1),
      "x",
      box.depth.toFixed(1),
    );
    console.log(
      "Y Position Calculation:",
      FLOOR_Y,
      "-",
      boundsInfo.min.y.toFixed(1),
      "=",
      (FLOOR_Y - boundsInfo.min.y).toFixed(1),
    );

    if (savedTransform) {
      // CASE 1: REDO / UNDO (Use history data)
      console.log("↺ Restoring Main Model from History...");

      rootMesh.position.set(
        savedTransform.position.x,
        savedTransform.position.y,
        savedTransform.position.z,
      );
      rootMesh.rotation.y = savedTransform.rotation;
      if (savedTransform.scale) {
        rootMesh.scaling.set(
          savedTransform.scale.x,
          savedTransform.scale.y,
          savedTransform.scale.z,
        );
      }

      // Force final update
      rootMesh.computeWorldMatrix(true);
    } else {
      // CASE 2: NEW MODEL (Auto Snap)
      console.log("✨ New Main Model Auto-Snap...");

      const wallPos = getWallSnapPosition(
        "back",
        rootMesh,
        new BABYLON.Vector3(0, 0, 0),
      );

      // Use THIS model's specific boundsInfo for Y position
      const yPosition = FLOOR_Y - boundsInfo.min.y;

      rootMesh.position.set(wallPos.x, yPosition, wallPos.z);
      rootMesh.rotation.y = wallPos.rotation;

      // Force final update
      rootMesh.computeWorldMatrix(true);

      console.log(
        "Final Position:",
        rootMesh.position.x.toFixed(1),
        yPosition.toFixed(1),
        rootMesh.position.z.toFixed(1),
      );
      console.log(
        "Final Rotation:",
        ((rootMesh.rotation.y * 180) / Math.PI).toFixed(0) + "°",
      );

      const { updateTransformSilent } = useRoomStore.getState();

      const initialTransform: FurnitureTransform = {
        modelName: rootMesh.name,
        position: {
          x: rootMesh.position.x,
          y: rootMesh.position.y,
          z: rootMesh.position.z,
        },
        rotation: rootMesh.rotation.y,
        scale: {
          x: rootMesh.scaling.x,
          y: rootMesh.scaling.y,
          z: rootMesh.scaling.z,
        },
      };

      updateTransformSilent(0, initialTransform, true);
    }

    // DEBUGGING: Visualize Bounding Box
    // rootMesh.showBoundingBox = true;
    // rootMesh.getChildMeshes().forEach((m) => {
    //   m.showBoundingBox = true;
    // });

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
// export const loadAdditionalModel = async (
//   modelName: string,
//   activeTexture: string,
//   scene: BABYLON.Scene,
//   mainMeshRef: BABYLON.AbstractMesh | null,
//   savedTransform?: FurnitureTransform,
// ): Promise<void> => {
//   try {
//     if (!savedTransform) {
//       const { present } = useRoomStore.getState();
//       if (present.additionalTransforms) {
//         const existingMainModel = scene.getMeshByName(
//           present.additionalTransforms[0].modelName,
//         );
//         if (existingMainModel) {
//           console.log("Disposing previous main model:", existingMainModel.name);
//           existingMainModel.dispose();
//         }
//       }
//     }
//     updateRoomDimensions();

//     let uniqueId = savedTransform?.modelName;

//     if (!uniqueId) {
//       const { present } = useRoomStore.getState();
//       uniqueId =
//         present.additionalModels.find((id) =>
//           id.includes(modelName.split(".")[0]),
//         ) || modelName;
//     }

//     const container = await BABYLON.LoadAssetContainerAsync(
//       "/assets/3d/" + modelName,
//       scene,
//     );

//     container.addAllToScene();
//     const meshes = container.meshes;

//     if (meshes.length === 0) return;

//     const rootMesh = meshes[0];
//     rootMesh.name = uniqueId;
//     rootMesh.metadata = "furniture";

//     // Apply texture to all child meshes
//     rootMesh.getChildMeshes().forEach((m) => {
//       if (activeTexture) applyTextureToMesh(m, activeTexture, scene);
//     });

//     // Auto scale
//     autoScaleMesh(rootMesh, 240);
//     rootMesh.refreshBoundingInfo(true, true);

//     rootMesh.getChildMeshes().forEach((m) => {
//       m.isPickable = true;
//       m.refreshBoundingInfo(true, true);
//     });

//     // Calculate dimensions after scaling
//     rootMesh.computeWorldMatrix(true);
//     const boundsInfoOriginal = rootMesh.getHierarchyBoundingVectors(true);

//     // Get dimensions
//     const box = getMeshAABB(rootMesh);
//     const { width, depth } = box;

//     console.log("\n=== ADDITIONAL MODEL ===");
//     console.log("Model:", modelName);
//     console.log("Dimensions:", width.toFixed(1), "x", depth.toFixed(1));

//     const isValidHistory =
//       savedTransform &&
//       !(
//         savedTransform.position.x === 0 &&
//         savedTransform.position.y === 0 &&
//         savedTransform.position.z === 0
//       );
//     if (isValidHistory) {
//       // --------------------------------------------------------
//       // KASUS 1: REDO / UNDO (Gunakan data history)
//       // --------------------------------------------------------
//       console.log("↺ Restoring Additional Model from History...");

//       // Langsung set posisi & rotasi dari history
//       rootMesh.position.set(
//         savedTransform.position.x,
//         savedTransform.position.y,
//         savedTransform.position.z,
//       );
//       rootMesh.rotation.y = savedTransform!.rotation;

//       // NOTE: Tidak perlu update store di sini karena data sudah ada di history
//     } else {
//       // --------------------------------------------------------
//       // KASUS 2: MODEL BARU (Jalankan Auto Snap Original Anda)
//       // --------------------------------------------------------
//       console.log("✨ New Additional Model Auto-Snap...");

//       // Get all existing furniture
//       const allFurniture = getAllFurniture(scene, rootMesh);
//       let finalPosition: WallSnapPosition | null = null;

//       // A. Try to snap next to main furniture first (only left/right)
//       if (mainMeshRef) {
//         console.log("🎯 Trying to snap next to main furniture...");

//         if (rootMesh.rotationQuaternion) {
//           rootMesh.rotationQuaternion = null;
//         }
//         //  Set rotasi DULU sama dengan main furniture
//         rootMesh.rotation.y = mainMeshRef.rotation.y;
//         rootMesh.computeWorldMatrix(true);

//         finalPosition = findAutoSnapPosition(
//           mainMeshRef,
//           width,
//           depth,
//           allFurniture,
//         );

//         if (finalPosition) {
//           //  OVERRIDE rotasi dari findAutoSnapPosition dengan rotasi main furniture
//           finalPosition.rotation = mainMeshRef.rotation.y;

//           console.log(`✅ AUTO-SNAPPED next to main furniture`);
//           console.log(
//             `   Position: (${finalPosition.x.toFixed(1)}, ${finalPosition.z.toFixed(1)})`,
//           );
//           console.log(`   Wall: ${finalPosition.wall}`);
//           console.log(
//             `   Rotation: ${((finalPosition.rotation * 180) / Math.PI).toFixed(0)}°`,
//           );
//         }
//       }

//       // B. If can't snap to main, try other furniture
//       if (!finalPosition && allFurniture.length > 0) {
//         console.log("🔍 Trying to snap next to other furniture...");
//         for (const furniture of allFurniture) {
//           finalPosition = findAutoSnapPosition(
//             furniture,
//             width,
//             depth,
//             allFurniture,
//           );
//           if (finalPosition) {
//             console.log(`✅ AUTO-SNAPPED next to ${furniture.name}`);
//             console.log(`   Wall: ${finalPosition.wall}`);
//             break;
//           }
//         }
//       }

//       // C. Fallback: place on back wall at available X position
//       // if (!finalPosition) {
//       //   let posX = 0;
//       //   const maxX = CONFIG.rw / 2 - width / 2 - 15;

//       //   // Try different X positions on back wall
//       //   const tryXPositions = [
//       //     0,
//       //     maxX / 2,
//       //     -maxX / 2,
//       //     maxX * 0.75,
//       //     -maxX * 0.75,
//       //   ];

//       //   for (const testX of tryXPositions) {
//       //     // Menggunakan signature (wall, mesh, pointerPos)
//       //     // Kita simulasikan pointer position di koordinat testX
//       //     const testWallPos = getWallSnapPosition(
//       //       "back",
//       //       rootMesh,
//       //       new BABYLON.Vector3(testX, 0, 0),
//       //     );

//       //     const testBox = {
//       //       minX: testWallPos.x - width / 2,
//       //       maxX: testWallPos.x + width / 2,
//       //       minZ: testWallPos.z - depth / 2,
//       //       maxZ: testWallPos.z + depth / 2,
//       //       width,
//       //       depth,
//       //     };

//       //     let hasCollision = false;
//       //     for (const other of allFurniture) {
//       //       const otherBox = getMeshAABB(other);
//       //       if (
//       //         testBox.minX < otherBox.maxX &&
//       //         testBox.maxX > otherBox.minX &&
//       //         testBox.minZ < otherBox.maxZ &&
//       //         testBox.maxZ > otherBox.minZ
//       //       ) {
//       //         hasCollision = true;
//       //         break;
//       //       }
//       //     }

//       //     if (!hasCollision) {
//       //       posX = testX;
//       //       break;
//       //     }
//       //   }

//       //   finalPosition = getWallSnapPosition(
//       //     "back",
//       //     rootMesh,
//       //     new BABYLON.Vector3(posX, 0, 0),
//       //   );
//       // }
//       // C. Fallback: place on available wall (back → left → right → front)
//       if (!finalPosition) {
//         console.log("🔍 Finding available wall position...");

//         const wallsToTry: ("back" | "left" | "right" | "front")[] = [
//           "back",
//           "left",
//           "right",
//           "front",
//         ];

//         for (const wall of wallsToTry) {
//           console.log(`   Trying ${wall} wall...`);

//           let positionFound = false;

//           if (wall === "back" || wall === "front") {
//             // For back/front walls, try different X positions
//             const maxX = CONFIG.rw / 2 - width / 2 - 15;
//             const tryXPositions = [
//               0,
//               maxX / 2,
//               -maxX / 2,
//               maxX * 0.75,
//               -maxX * 0.75,
//               maxX,
//               -maxX,
//             ];

//             for (const testX of tryXPositions) {
//               const testWallPos = getWallSnapPosition(
//                 wall,
//                 rootMesh,
//                 new BABYLON.Vector3(testX, 0, 0),
//               );

//               const testBox = {
//                 minX: testWallPos.x - width / 2,
//                 maxX: testWallPos.x + width / 2,
//                 minZ: testWallPos.z - depth / 2,
//                 maxZ: testWallPos.z + depth / 2,
//                 width,
//                 depth,
//               };

//               let hasCollision = false;
//               for (const other of allFurniture) {
//                 const otherBox = getMeshAABB(other);
//                 if (
//                   testBox.minX < otherBox.maxX &&
//                   testBox.maxX > otherBox.minX &&
//                   testBox.minZ < otherBox.maxZ &&
//                   testBox.maxZ > otherBox.minZ
//                 ) {
//                   hasCollision = true;
//                   break;
//                 }
//               }

//               if (!hasCollision) {
//                 finalPosition = testWallPos;
//                 positionFound = true;
//                 console.log(
//                   `   ✅ Found space on ${wall} wall at X=${testX.toFixed(1)}`,
//                 );
//                 break;
//               }
//             }
//           } else {
//             // For left/right walls, try different Z positions
//             const maxZ = CONFIG.rd / 2 - depth / 2 - 15;
//             const tryZPositions = [
//               0,
//               maxZ / 2,
//               -maxZ / 2,
//               maxZ * 0.75,
//               -maxZ * 0.75,
//               maxZ,
//               -maxZ,
//             ];

//             for (const testZ of tryZPositions) {
//               const testWallPos = getWallSnapPosition(
//                 wall,
//                 rootMesh,
//                 new BABYLON.Vector3(0, 0, testZ),
//               );

//               const testBox = {
//                 minX: testWallPos.x - width / 2,
//                 maxX: testWallPos.x + width / 2,
//                 minZ: testWallPos.z - depth / 2,
//                 maxZ: testWallPos.z + depth / 2,
//                 width,
//                 depth,
//               };

//               let hasCollision = false;
//               for (const other of allFurniture) {
//                 const otherBox = getMeshAABB(other);
//                 if (
//                   testBox.minX < otherBox.maxX &&
//                   testBox.maxX > otherBox.minX &&
//                   testBox.minZ < otherBox.maxZ &&
//                   testBox.maxZ > otherBox.minZ
//                 ) {
//                   hasCollision = true;
//                   break;
//                 }
//               }

//               if (!hasCollision) {
//                 finalPosition = testWallPos;
//                 positionFound = true;
//                 console.log(
//                   `   ✅ Found space on ${wall} wall at Z=${testZ.toFixed(1)}`,
//                 );
//                 break;
//               }
//             }
//           }

//           // If found position on this wall, break out of wall loop
//           if (positionFound) {
//             break;
//           } else {
//             console.log(`   ❌ ${wall} wall is full`);
//           }
//         }

//         // If still no position found after trying all walls, use back wall center as last resort
//         if (!finalPosition) {
//           console.warn(
//             "⚠️ All walls are full! Placing at back wall center as last resort",
//           );
//           finalPosition = getWallSnapPosition(
//             "back",
//             rootMesh,
//             new BABYLON.Vector3(0, 0, 0),
//           );
//         }
//       }

//       // Set final position and rotation
//       rootMesh.position.set(
//         finalPosition.x,
//         10 - boundsInfoOriginal.min.y,
//         finalPosition.z,
//       );
//       rootMesh.rotation.y = finalPosition.rotation;

//       // Set final position and rotation
//       rootMesh.position.set(
//         finalPosition.x,
//         10 - boundsInfoOriginal.min.y,
//         finalPosition.z,
//       );
//       rootMesh.rotation.y = finalPosition.rotation;

//       // --------------------------------------------------------
//       // UPDATE STORE LANGSUNG (TANPA SETTIMEOUT)
//       // --------------------------------------------------------
//       const { updateTransformSilent } = useRoomStore.getState();
//       const allFurnitureForIndex = getAllFurniture(scene);
//       const meshIndex = allFurnitureForIndex.indexOf(rootMesh);

//       const initialTransform: FurnitureTransform = {
//         modelName: rootMesh.name,
//         position: {
//           x: rootMesh.position.x,
//           y: rootMesh.position.y,
//           z: rootMesh.position.z,
//         },
//         rotation: rootMesh.rotation.y,
//       };

//       if (meshIndex === 0) {
//         updateTransformSilent(0, initialTransform, true);
//       } else {
//         // Index - 1 karena index 0 biasanya main model
//         updateTransformSilent(meshIndex - 1, initialTransform, false);
//       }
//     }
//     // DEBUGGING: Visualisasikan Bounding Box
//     // rootMesh.showBoundingBox = true;
//     // rootMesh.getChildMeshes().forEach((m) => {
//     //   m.showBoundingBox = true;
//     // });

//     // Add drag behavior (will handle wall switching)
//     addDragBehavior(rootMesh, scene);
//   } catch (error) {
//     console.error("Error loading additional model:", error);
//   }
// };

export const loadAdditionalModel = async (
  modelName: string,
  activeTexture: string,
  scene: BABYLON.Scene,
  mainMeshRef: BABYLON.AbstractMesh | null,
  savedTransform?: FurnitureTransform,
): Promise<void> => {
  try {
    updateRoomDimensions();

    let uniqueId = savedTransform?.modelName;

    if (!uniqueId) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      uniqueId = `${modelName}_${timestamp}_${random}`;
    }

    const container = await BABYLON.LoadAssetContainerAsync(
      "/assets/3d/" + modelName,
      scene,
    );

    container.addAllToScene();
    // Prevent asset-embedded lights/cameras from stacking with scene lighting
    container.lights.forEach((l) => l.dispose());
    container.cameras.forEach((c) => c.dispose());
    // Safety net: remove any lights that slipped in
    const allowedLightIds: number[] =
      (scene.metadata && scene.metadata.allowedLightIds) || [];
    scene.lights
      .filter((l) => !allowedLightIds.includes(l.uniqueId))
      .forEach((l) => l.dispose());
    const meshes = container.meshes;

    if (meshes.length === 0) return;

    const rootMesh = meshes[0];
    rootMesh.name = uniqueId;
    rootMesh.metadata = "furniture";

    // Pre-cache original materials so Reset/clear restores true originals
    cacheOriginalMaterials(rootMesh);

    rootMesh.getChildMeshes().forEach((m) => {
      if (activeTexture) applyTextureToMesh(m, activeTexture, scene);
    });

    autoScaleMesh(rootMesh);

    rootMesh.getChildMeshes().forEach((m) => {
      m.isPickable = true;
    });

    // Force fresh calculation
    rootMesh.computeWorldMatrix(true);
    rootMesh.refreshBoundingInfo(true, true);

    // Calculate fresh bounds
    const boundsInfoOriginal = rootMesh.getHierarchyBoundingVectors(true);

    // Calculate dimensions directly from bounds (don't use getMeshAABB)
    const width = Math.abs(boundsInfoOriginal.max.x - boundsInfoOriginal.min.x);
    const depth = Math.abs(boundsInfoOriginal.max.z - boundsInfoOriginal.min.z);

    const isValidHistory =
      savedTransform &&
      !(
        savedTransform.position.x === 0 &&
        savedTransform.position.y === 0 &&
        savedTransform.position.z === 0
      );

    if (isValidHistory) {
      rootMesh.position.set(
        savedTransform.position.x,
        savedTransform.position.y,
        savedTransform.position.z,
      );
      rootMesh.rotation.y = savedTransform!.rotation;
      if (savedTransform?.scale) {
        rootMesh.scaling.set(
          savedTransform.scale.x,
          savedTransform.scale.y,
          savedTransform.scale.z,
        );
      }
      rootMesh.computeWorldMatrix(true);
    } else {
      // 👌start: LOGIKA BARU - SMART SNAP v5 (FIX OVERLAP & CUSTOM FLOW)
      console.log("✨ New Additional Model: Correct Orientation & Flow...");

      const allFurniture = getAllFurniture(scene, rootMesh);
      let finalPosition: {
        x: number;
        z: number;
        rotation: number;
        wall: string;
      } | null = null;
      let currentWall: "back" | "right" | "left" | "front" = "back";

      // 1. URUTAN SESUAI REQUEST
      // Back -> Right -> Front -> Left
      const wallsToTry: ("back" | "right" | "front" | "left")[] = [
        "back",
        "right",
        "front",
        "left",
      ];

      const snapGap = 0.001;
      const wallPadding = 0.02;

      // Loop setiap tembok
      for (const wall of wallsToTry) {
        currentWall = wall;

        const isHorizontal = wall === "back" || wall === "front";

        // 📐 2. TENTUKAN DIMENSI (FIX OVERLAP)
        // KOREKSI: Apapun temboknya, "Lebar" barang (Local X) adalah dimensi yang menempel sepanjang tembok.
        // "Kedalaman" barang (Local Z) adalah dimensi yang menonjol ke ruangan.
        // Ini karena kita memutar barang agar punggungnya menempel tembok.

        const occupiesWallLength = width; // Selalu Width (Lebar Samping-ke-Samping)
        const protrudesIntoRoom = depth; // Selalu Depth (Tebal Depan-ke-Belakang)

        const wallLengthTotal = isHorizontal ? CONFIG.rw : CONFIG.rd;
        const limit =
          wallLengthTotal / 2 - occupiesWallLength / 2 - wallPadding;

        // 📍 3. CARI KANDIDAT POSISI
        let candidates: number[] = [];

        // Filter furniture
        const furnitureOnThisWall = allFurniture.filter((f) => {
          const pos = f.position;
          const tolerance = 1.5;
          if (wall === "back")
            return Math.abs(pos.z - CONFIG.rd / 2) < tolerance;
          if (wall === "front")
            return Math.abs(pos.z + CONFIG.rd / 2) < tolerance;
          if (wall === "right")
            return Math.abs(pos.x - CONFIG.rw / 2) < tolerance;
          if (wall === "left")
            return Math.abs(pos.x + CONFIG.rw / 2) < tolerance;
          return false;
        });

        if (furnitureOnThisWall.length > 0) {
          for (const other of furnitureOnThisWall) {
            const b = other.getHierarchyBoundingVectors(true);

            let minPoint = 0;
            let maxPoint = 0;

            if (isHorizontal) {
              // Scan X
              minPoint = b.min.x;
              maxPoint = b.max.x;
            } else {
              // Scan Z
              minPoint = b.min.z;
              maxPoint = b.max.z;
            }

            // Hitung kandidat dari bounding box existing
            candidates.push(minPoint - snapGap - occupiesWallLength / 2);
            candidates.push(maxPoint + snapGap + occupiesWallLength / 2);
          }
        }

        // Ujung Tembok
        candidates.push(-limit);
        candidates.push(limit);

        // Back wall: Tambah tengah
        if (wall === "back") candidates.push(0);

        // Filter validasi batas
        candidates = candidates.filter(
          (p) => p >= -limit - 0.01 && p <= limit + 0.01,
        );

        // Rounding
        candidates = [
          ...new Set(candidates.map((n) => Math.round(n * 1000) / 1000)),
        ];

        // 🔥 4. SORTING FLOW (Agar Nyambung)

        if (wall === "back") {
          // Back: Isi dari Tengah ke Luar (Center Out)
          candidates.sort((a, b) => Math.abs(a) - Math.abs(b));
        } else if (wall === "right") {
          // Right (Z): Urut dari Belakang (+Z) ke Depan (-Z) -> Nyambung dari Back
          candidates.sort((a, b) => b - a);
        } else if (wall === "front") {
          // Front (X): Urut dari Kanan (+X) ke Kiri (-X) -> Nyambung dari Right
          candidates.sort((a, b) => b - a);
        } else if (wall === "left") {
          // Left (Z): Urut dari Depan (-Z) ke Belakang (+Z) -> Nyambung dari Front
          candidates.sort((a, b) => a - b);
        }

        // 🛡️ 5. CEK TABRAKAN
        for (const pos of candidates) {
          let testMinX = 0,
            testMaxX = 0,
            testMinZ = 0,
            testMaxZ = 0;
          const buffer = 0.002;

          if (isHorizontal) {
            const centerX = pos;
            const centerZ =
              wall === "back"
                ? CONFIG.rd / 2 - protrudesIntoRoom / 2
                : -(CONFIG.rd / 2) + protrudesIntoRoom / 2;

            testMinX = centerX - occupiesWallLength / 2 + buffer;
            testMaxX = centerX + occupiesWallLength / 2 - buffer;
            testMinZ = centerZ - protrudesIntoRoom / 2 + buffer;
            testMaxZ = centerZ + protrudesIntoRoom / 2 - buffer;
          } else {
            const centerZ = pos;
            const centerX =
              wall === "right"
                ? CONFIG.rw / 2 - protrudesIntoRoom / 2
                : -(CONFIG.rw / 2) + protrudesIntoRoom / 2;

            // PERHATIKAN: occupiesWallLength (Width) sekarang di sumbu Z (tembok)
            // protrudesIntoRoom (Depth) di sumbu X (tebal)
            testMinX = centerX - protrudesIntoRoom / 2 + buffer;
            testMaxX = centerX + protrudesIntoRoom / 2 - buffer;
            testMinZ = centerZ - occupiesWallLength / 2 + buffer;
            testMaxZ = centerZ + occupiesWallLength / 2 - buffer;
          }

          let collision = false;
          for (const other of allFurniture) {
            const b = other.getHierarchyBoundingVectors(true);
            if (
              testMinX < b.max.x &&
              testMaxX > b.min.x &&
              testMinZ < b.max.z &&
              testMaxZ > b.min.z
            ) {
              collision = true;
              break;
            }
          }

          if (!collision) {
            // ✅ POSISI VALID
            let finalX = 0;
            let finalZ = 0;
            let finalRot = 0;

            if (wall === "back") {
              finalX = pos;
              finalZ = CONFIG.rd / 2 - protrudesIntoRoom / 2;
              finalRot = Math.PI;
            } else if (wall === "front") {
              finalX = pos;
              finalZ = -(CONFIG.rd / 2) + protrudesIntoRoom / 2;
              finalRot = 0;
            } else if (wall === "right") {
              finalZ = pos;
              finalX = CONFIG.rw / 2 - protrudesIntoRoom / 2;
              finalRot = -Math.PI / 2;
            } else if (wall === "left") {
              finalZ = pos;
              finalX = -(CONFIG.rw / 2) + protrudesIntoRoom / 2;
              finalRot = Math.PI / 2;
            }

            finalPosition = {
              x: finalX,
              z: finalZ,
              rotation: finalRot,
              wall: wall,
            };
            break;
          }
        }

        if (finalPosition) break;
      }

      if (finalPosition) {
        const yPosition = FLOOR_Y - boundsInfoOriginal.min.y;

        if (rootMesh.rotationQuaternion) rootMesh.rotationQuaternion = null;

        rootMesh.position.set(finalPosition.x, yPosition, finalPosition.z);
        rootMesh.rotation.y = finalPosition.rotation;
        rootMesh.computeWorldMatrix(true);

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
          scale: {
            x: rootMesh.scaling.x,
            y: rootMesh.scaling.y,
            z: rootMesh.scaling.z,
          },
        };

        if (meshIndex === 0) {
          updateTransformSilent(0, initialTransform, true);
        } else {
          updateTransformSilent(meshIndex - 1, initialTransform, false);
        }

        addDragBehavior(rootMesh, scene);
      } else {
        console.warn("⛔ Room is full!");
        window.alert("Ruangan penuh!");
        rootMesh.dispose();
        return;
      }
      // 👌end
    }

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
  meshTextureMap?: Record<string, string>,
) => {
  // Skip if both global and per-mesh textures are empty
  const hasGlobalTexture = activeTexture && activeTexture !== "";
  const hasPerMeshTextures =
    meshTextureMap && Object.keys(meshTextureMap).length > 0;
  if (!hasGlobalTexture && !hasPerMeshTextures) {
    return; // Nothing to apply
  }

  const getTextureForMesh = (meshName: string) => {
    if (!meshTextureMap) return undefined;
    // Only exact match to avoid applying one instance's texture to other instances
    return meshTextureMap[meshName];
  };
  if (mainMeshRef) {
    const mainTex = getTextureForMesh(mainMeshRef.name) ?? activeTexture;
    // Apply texture to main mesh and all its children
    applyTextureToMesh(mainMeshRef, mainTex, scene);
    mainMeshRef.getChildMeshes().forEach((m) => {
      const childTex = getTextureForMesh(m.name) ?? mainTex;
      applyTextureToMesh(m, childTex, scene);
    });
  }

  // Apply texture to all additional furniture meshes
  scene.meshes.forEach((mesh) => {
    if (
      mesh.metadata === "furniture" &&
      mesh !== mainMeshRef &&
      mesh.parent !== mainMeshRef
    ) {
      const tex = getTextureForMesh(mesh.name) ?? activeTexture;
      console.log("Applying texture to additional mesh:", mesh.name, tex);
      applyTextureToMesh(mesh, tex, scene);
      mesh.getChildMeshes().forEach((m) => {
        const childTex = getTextureForMesh(m.name) ?? tex;
        applyTextureToMesh(m, childTex, scene);
      });
    }
  });
};
