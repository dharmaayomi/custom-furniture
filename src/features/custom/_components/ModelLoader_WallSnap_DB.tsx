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
} from "./MeshUtils_WallSnap_DB";
import { CONFIG, FLOOR_Y } from "./RoomConfig";
import { extractModelNameFromId } from "@/lib/price";

const getBaseModelName = (modelName: string) =>
  modelName.replace(/\.glb$/i, "");

export type DbModelUrlResolver = (modelName: string) => string | undefined;

const resolveModelSource = (
  modelName: string,
  resolveModelUrl?: DbModelUrlResolver,
) => {
  const extracted = extractModelNameFromId(modelName);
  const dbUrl = resolveModelUrl?.(extracted) ?? resolveModelUrl?.(modelName);
  if (dbUrl) return dbUrl;
  if (/\.glb$/i.test(modelName)) {
    return "/assets/3d/" + modelName;
  }
  return undefined;
};

// ===========load main model ===========
export const loadMainModel = async (
  modelName: string,
  activeTexture: string,
  scene: BABYLON.Scene,
  savedTransform?: FurnitureTransform,
  uniqueId?: string,
  resolveModelUrl?: DbModelUrlResolver,
): Promise<BABYLON.AbstractMesh | null> => {
  try {
    updateRoomDimensions();
    const modelSource = resolveModelSource(modelName, resolveModelUrl);
    if (!modelSource) {
      return null;
    }

    const container = await BABYLON.LoadAssetContainerAsync(
      modelSource,
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
    const baseName = getBaseModelName(modelName);
    const fallbackId = uniqueId || `${baseName}_0`;
    rootMesh.name = savedTransform ? savedTransform.modelName : fallbackId;
    rootMesh.metadata = "furniture";

    // Pre-cache original materials so Reset/clear restores true originals
    cacheOriginalMaterials(rootMesh);

    // No global texture application here; textures are per-mesh only

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

    const isValidHistory =
      savedTransform &&
      !(
        savedTransform.position.x === 0 &&
        savedTransform.position.y === 0 &&
        savedTransform.position.z === 0
      );

    if (isValidHistory) {
      // CASE 1: REDO / UNDO (Use history data)

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
      // CASE 2: NEW MODEL (Use same smart snap logic as add-on)
      console.log("✨ New Main Model: Smart Snap placement...");

      const allFurniture = getAllFurniture(scene, rootMesh);
      let finalPosition: {
        x: number;
        z: number;
        rotation: number;
        wall: string;
      } | null = null;
      let currentWall: "back" | "right" | "left" | "front" = "back";

      const width = Math.abs(boundsInfo.max.x - boundsInfo.min.x);
      const depth = Math.abs(boundsInfo.max.z - boundsInfo.min.z);

      const wallsToTry: ("back" | "right" | "front" | "left")[] = [
        "back",
        "right",
        "front",
        "left",
      ];

      const snapGap = 0.001;
      const wallPadding = 0.02;
      const MAX_CANDIDATES_PER_WALL = Math.max(30, allFurniture.length * 6);
      const MAX_COLLISION_CHECKS = Math.max(
        500,
        allFurniture.length * MAX_CANDIDATES_PER_WALL,
      );
      let collisionChecks = 0;

      for (const wall of wallsToTry) {
        currentWall = wall;
        const isHorizontal = wall === "back" || wall === "front";

        const occupiesWallLength = width;
        const protrudesIntoRoom = depth;

        const wallLengthTotal = isHorizontal ? CONFIG.rw : CONFIG.rd;
        const limit =
          wallLengthTotal / 2 - occupiesWallLength / 2 - wallPadding;

        let candidates: number[] = [];

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
              minPoint = b.min.x;
              maxPoint = b.max.x;
            } else {
              minPoint = b.min.z;
              maxPoint = b.max.z;
            }

            candidates.push(minPoint - snapGap - occupiesWallLength / 2);
            candidates.push(maxPoint + snapGap + occupiesWallLength / 2);
          }
        }

        candidates.push(-limit);
        candidates.push(limit);
        if (wall === "back") candidates.push(0);

        candidates = candidates.filter(
          (p) => p >= -limit - 0.01 && p <= limit + 0.01,
        );

        candidates = [
          ...new Set(candidates.map((n) => Math.round(n * 1000) / 1000)),
        ];

        if (wall === "back") {
          candidates.sort((a, b) => Math.abs(a) - Math.abs(b));
        } else if (wall === "right") {
          candidates.sort((a, b) => b - a);
        } else if (wall === "front") {
          candidates.sort((a, b) => b - a);
        } else if (wall === "left") {
          candidates.sort((a, b) => a - b);
        }

        if (candidates.length > MAX_CANDIDATES_PER_WALL) {
          candidates = candidates.slice(0, MAX_CANDIDATES_PER_WALL);
        }

        for (const pos of candidates) {
          if (collisionChecks > MAX_COLLISION_CHECKS) break;
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

            testMinX = centerX - protrudesIntoRoom / 2 + buffer;
            testMaxX = centerX + protrudesIntoRoom / 2 - buffer;
            testMinZ = centerZ - occupiesWallLength / 2 + buffer;
            testMaxZ = centerZ + occupiesWallLength / 2 - buffer;
          }

          let collision = false;
          for (const other of allFurniture) {
            collisionChecks += 1;
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
            if (collisionChecks > MAX_COLLISION_CHECKS) break;
          }

          if (!collision) {
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

      const yPosition = FLOOR_Y - boundsInfo.min.y;

      if (finalPosition) {
        if (rootMesh.rotationQuaternion) rootMesh.rotationQuaternion = null;
        rootMesh.position.set(finalPosition.x, yPosition, finalPosition.z);
        rootMesh.rotation.y = finalPosition.rotation;
      } else {
        console.warn("⛔ Room is full!");
        window.alert("Ruangan penuh!");
        rootMesh.dispose();
        return null;
      }

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

      const { updateTransformSilent, present } = useRoomStore.getState();

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

      const mainIndex = present.mainModels.findIndex(
        (id) => id === rootMesh.name,
      );
      if (mainIndex !== -1) {
        updateTransformSilent(mainIndex, initialTransform, true);
      }
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

export const loadAdditionalModel = async (
  modelName: string,
  activeTexture: string,
  scene: BABYLON.Scene,
  mainMeshRef: BABYLON.AbstractMesh | null,
  savedTransform?: FurnitureTransform,
  resolveModelUrl?: DbModelUrlResolver,
): Promise<void> => {
  try {
    updateRoomDimensions();
    const modelSource = resolveModelSource(modelName, resolveModelUrl);
    if (!modelSource) {
      return;
    }

    let uniqueId = savedTransform?.modelName;

    if (!uniqueId) {
      const baseName = getBaseModelName(modelName);
      const { present } = useRoomStore.getState();
      const count = present.addOnModels.filter((id) => {
        const extracted = id.split("_");
        if (
          extracted.length >= 2 &&
          /^\d+$/.test(extracted[extracted.length - 1])
        ) {
          return extracted.slice(0, -1).join("_") === baseName;
        }
        return false;
      }).length;
      uniqueId = `${baseName}_${count + 1}`;
    }

    const container = await BABYLON.LoadAssetContainerAsync(
      modelSource,
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

    // No global texture application here; textures are per-mesh only

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
      const MAX_CANDIDATES_PER_WALL = Math.max(30, allFurniture.length * 6);
      const MAX_COLLISION_CHECKS = Math.max(
        500,
        allFurniture.length * MAX_CANDIDATES_PER_WALL,
      );
      let collisionChecks = 0;

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

        // Trim to keep loop bounded
        if (candidates.length > MAX_CANDIDATES_PER_WALL) {
          candidates = candidates.slice(0, MAX_CANDIDATES_PER_WALL);
        }

        // 🛡️ 5. CEK TABRAKAN
        for (const pos of candidates) {
          if (collisionChecks > MAX_COLLISION_CHECKS) break;
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
            collisionChecks += 1;
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
            if (collisionChecks > MAX_COLLISION_CHECKS) break;
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

        const { updateTransformSilent, present } = useRoomStore.getState();
        const addOnIndex = present.addOnModels.findIndex(
          (id) => id === rootMesh.name,
        );

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

        if (addOnIndex !== -1) {
          updateTransformSilent(addOnIndex, initialTransform, false);
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
  mainMeshes: BABYLON.AbstractMesh[],
  meshTextureMap?: Record<string, string>,
) => {
  const hasPerMeshTextures =
    meshTextureMap && Object.keys(meshTextureMap).length > 0;
  if (!hasPerMeshTextures) {
    return; // Nothing to apply
  }

  const getTextureForMesh = (meshName: string) => {
    if (!meshTextureMap) return undefined;
    // Only exact match to avoid applying one instance's texture to other instances
    return meshTextureMap[meshName];
  };
  mainMeshes.forEach((mainMesh) => {
    const mainTex = getTextureForMesh(mainMesh.name);
    if (mainTex === undefined) return;
    applyTextureToMesh(mainMesh, mainTex, scene);
    mainMesh.getChildMeshes().forEach((m) => {
      const childTex = getTextureForMesh(m.name) ?? mainTex;
      applyTextureToMesh(m, childTex, scene);
    });
  });

  // Apply texture to all additional furniture meshes
  scene.meshes.forEach((mesh) => {
    if (
      mesh.metadata === "furniture" &&
      !mainMeshes.includes(mesh) &&
      !mainMeshes.includes(mesh.parent as BABYLON.AbstractMesh)
    ) {
      const tex = getTextureForMesh(mesh.name);
      if (tex === undefined) return;
      applyTextureToMesh(mesh, tex, scene);
      mesh.getChildMeshes().forEach((m) => {
        const childTex = getTextureForMesh(m.name) ?? tex;
        applyTextureToMesh(m, childTex, scene);
      });
    }
  });
};
