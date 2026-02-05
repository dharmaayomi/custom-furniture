import * as BABYLON from "@babylonjs/core";
import { CONFIG, MATERIAL_CONFIG, ROOM_DIMENSIONS } from "./RoomConfig";
import { FurnitureTransform, useRoomStore } from "@/store/useRoomStore";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BoundingBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  width: number;
  depth: number;
}

export type WallSide = "back" | "front" | "left" | "right";

export interface WallSnapPosition {
  x: number;
  z: number;
  wall: WallSide;
  rotation: number;
}

// ============================================================================
// DYNAMIC ROOM DIMENSIONS - TAMBAHAN BARU
// ============================================================================
export const updateRoomDimensions = (scene?: BABYLON.Scene) => {
  const { roomConfig, mainModelTransform, additionalTransforms } =
    useRoomStore.getState().present;
  CONFIG.rw = roomConfig.width;
  CONFIG.rd = roomConfig.depth;

  if (scene) {
    const allFurniture = getAllFurniture(scene);

    allFurniture.forEach((mesh, index) => {
      const pos = mesh.position;
      const rw = CONFIG.rw;
      const rd = CONFIG.rd;

      let savedTransform: FurnitureTransform | undefined;
      if (index === 0 && mainModelTransform) {
        // Main model (index 0)
        savedTransform = mainModelTransform;
      } else if (index > 0 && additionalTransforms[index - 1]) {
        // Additional models (index > 0)
        savedTransform = additionalTransforms[index - 1];
      }

      // Jika ada saved transform, gunakan posisi yang tersimpan
      if (savedTransform && savedTransform.modelName === mesh.name) {
        // Hitung jarak ke setiap tembok dari posisi yang tersimpan
        const savedPos = savedTransform.position;
        const distToBack = Math.abs(savedPos.z - rd / 2);
        const distToFront = Math.abs(savedPos.z + rd / 2);
        const distToRight = Math.abs(savedPos.x - rw / 2);
        const distToLeft = Math.abs(savedPos.x + rw / 2);

        const minDist = Math.min(
          distToBack,
          distToFront,
          distToRight,
          distToLeft,
        );

        let currentWall: WallSide = "back";
        if (minDist === distToBack) currentWall = "back";
        else if (minDist === distToFront) currentWall = "front";
        else if (minDist === distToRight) currentWall = "right";
        else currentWall = "left";

        // Gunakan rotasi yang tersimpan
        mesh.rotation.y = savedTransform.rotation;
        mesh.computeWorldMatrix(true);

        // Snap ke wall dengan mempertahankan posisi relatif
        const newPos = getWallSnapPosition(
          currentWall,
          mesh,
          new BABYLON.Vector3(savedPos.x, 0, savedPos.z),
        );

        mesh.position.x = newPos.x;
        mesh.position.z = newPos.z;
        // Pertahankan Y position
        mesh.position.y = savedPos.y;
        mesh.computeWorldMatrix(true);

        // Update transform di store
        const { updateTransformSilent } = useRoomStore.getState();
        const updatedTransform: FurnitureTransform = {
          modelName: mesh.name,
          position: {
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z,
          },
          rotation: mesh.rotation.y,
          // Preserve texture if it existed in saved transform
          texture: savedTransform?.texture,
        };

        if (index === 0) {
          updateTransformSilent(0, updatedTransform, true);
        } else {
          updateTransformSilent(index - 1, updatedTransform, false);
        }
      } else {
        // Fallback: jika tidak ada saved transform, gunakan logic lama
        const distToBack = Math.abs(pos.z - rd / 2);
        const distToFront = Math.abs(pos.z + rd / 2);
        const distToRight = Math.abs(pos.x - rw / 2);
        const distToLeft = Math.abs(pos.x + rw / 2);

        const minDist = Math.min(
          distToBack,
          distToFront,
          distToRight,
          distToLeft,
        );

        let currentWall: WallSide = "back";
        if (minDist === distToBack) currentWall = "back";
        else if (minDist === distToFront) currentWall = "front";
        else if (minDist === distToRight) currentWall = "right";
        else currentWall = "left";

        const newPos = getWallSnapPosition(
          currentWall,
          mesh,
          new BABYLON.Vector3(pos.x, 0, pos.z),
        );

        mesh.position.x = newPos.x;
        mesh.position.z = newPos.z;
        mesh.computeWorldMatrix(true);
      }
    });
    //
  }
};

//       const distToBack = Math.abs(pos.z - rd / 2);
//       const distToFront = Math.abs(pos.z + rd / 2);
//       const distToRight = Math.abs(pos.x - rw / 2);
//       const distToLeft = Math.abs(pos.x + rw / 2);

//       const minDist = Math.min(
//         distToBack,
//         distToFront,
//         distToRight,
//         distToLeft,
//       );

//       let currentWall: WallSide = "back";
//       if (minDist === distToBack) currentWall = "back";
//       else if (minDist === distToFront) currentWall = "front";
//       else if (minDist === distToRight) currentWall = "right";
//       else currentWall = "left";

//       const newPos = getWallSnapPosition(
//         currentWall,
//         mesh,
//         new BABYLON.Vector3(pos.x, 0, pos.z),
//       );

//       mesh.position.x = newPos.x;
//       mesh.position.z = newPos.z;
//       mesh.computeWorldMatrix(true);
//     });
//     //
//   }
// };

// ============================================================================
// MATERIAL CACHE - FIX UNTUK MASALAH LIGHTING
// ============================================================================

const materialCache = new Map<string, BABYLON.PBRMaterial>();
const originalMaterialCache = new Map<string, BABYLON.Material | null>();

// Cache original materials for a mesh and its children so resets can restore originals
export const cacheOriginalMaterials = (mesh: BABYLON.AbstractMesh) => {
  const storeFor = (m: BABYLON.AbstractMesh) => {
    const cacheKey = `original_${m.uniqueId}`;
    if (originalMaterialCache.has(cacheKey)) return;
    const orig = m.material ?? null;
    try {
      const cloned = orig ? orig.clone(`orig_${cacheKey}`) : null;
      originalMaterialCache.set(cacheKey, cloned as BABYLON.Material | null);
    } catch (e) {
      originalMaterialCache.set(cacheKey, orig);
    }
  };

  // Store for root and all children
  storeFor(mesh as BABYLON.AbstractMesh);
  mesh.getChildMeshes().forEach((c) => storeFor(c as BABYLON.AbstractMesh));
};

/**
 * Get atau create material dengan caching
 * Ini mencegah material baru dibuat terus-menerus yang menyebabkan perubahan lighting
 */
const getOrCreateMaterial = (
  texName: string,
  scene: BABYLON.Scene,
): BABYLON.PBRMaterial => {
  const cacheKey = `furnitureMat_${texName}`;

  // Cek apakah material sudah ada di cache
  if (materialCache.has(cacheKey)) {
    const cachedMat = materialCache.get(cacheKey);
    if (cachedMat && !cachedMat.dispose) {
      return cachedMat;
    }
  }

  // Buat material baru jika belum ada
  const texturePath = "/assets/texture/" + texName;
  const newTex = new BABYLON.Texture(texturePath, scene);

  const pbrMat = new BABYLON.PBRMaterial(cacheKey, scene);
  pbrMat.albedoTexture = newTex;
  pbrMat.roughness = MATERIAL_CONFIG.furniture.roughness;
  pbrMat.metallic = MATERIAL_CONFIG.furniture.metallic;
  pbrMat.directIntensity = MATERIAL_CONFIG.furniture.directIntensity;
  pbrMat.environmentIntensity = MATERIAL_CONFIG.furniture.environmentIntensity;
  pbrMat.specularIntensity = MATERIAL_CONFIG.furniture.specularIntensity;
  pbrMat.albedoColor = new BABYLON.Color3(
    MATERIAL_CONFIG.furniture.albedoBoost,
    MATERIAL_CONFIG.furniture.albedoBoost,
    MATERIAL_CONFIG.furniture.albedoBoost,
  );

  // Simpan ke cache
  materialCache.set(cacheKey, pbrMat);

  return pbrMat;
};

// ============================================================================
// AABB UTILITIES
// ============================================================================

export const getMeshAABB = (mesh: BABYLON.AbstractMesh): BoundingBox => {
  mesh.computeWorldMatrix(true);

  //  2. PAKSA refresh bounding info dulu
  mesh.refreshBoundingInfo(true, true);

  //  3. Update bounding untuk semua children
  mesh.getChildMeshes().forEach((child) => {
    child.computeWorldMatrix(true);
    child.refreshBoundingInfo(true, true);
  });

  //  4. SEKARANG baru ambil bounding yang sudah di-refresh
  const bounds = mesh.getHierarchyBoundingVectors(
    true,
    (node) => node.isVisible,
  );

  return {
    minX: bounds.min.x,
    maxX: bounds.max.x,
    minZ: bounds.min.z,
    maxZ: bounds.max.z,
    width: bounds.max.x - bounds.min.x,
    depth: bounds.max.z - bounds.min.z,
  };
};

export const checkAABBOverlap = (
  box1: BoundingBox,
  box2: BoundingBox,
): boolean => {
  const epsilon = 0.5;
  return (
    box1.minX < box2.maxX - epsilon &&
    box1.maxX > box2.minX + epsilon &&
    box1.minZ < box2.maxZ - epsilon &&
    box1.maxZ > box2.minZ + epsilon
  );
};

export const getAllFurniture = (
  scene: BABYLON.Scene,
  excludeMesh?: BABYLON.AbstractMesh,
): BABYLON.AbstractMesh[] => {
  return scene.meshes.filter(
    (m) => m.metadata === "furniture" && m !== excludeMesh && !m.parent,
  ) as BABYLON.AbstractMesh[];
};

// ============================================================================
// WALL DETERMINATION & SNAP LOGIC
// ============================================================================

const determineClosestWall = (position: BABYLON.Vector3): WallSide => {
  const { roomConfig } = useRoomStore.getState().present;
  const rw = roomConfig.width;
  const rd = roomConfig.depth;

  // Hitung jarak murni ke bidang setiap tembok (abaikan tinggi/Y)
  const distToBack = Math.abs(position.z - rd / 2);
  const distToFront = Math.abs(position.z + rd / 2);
  const distToRight = Math.abs(position.x - rw / 2);
  const distToLeft = Math.abs(position.x + rw / 2);

  const distances = [
    { wall: "back" as WallSide, dist: distToBack },
    { wall: "front" as WallSide, dist: distToFront },
    { wall: "right" as WallSide, dist: distToRight },
    { wall: "left" as WallSide, dist: distToLeft },
  ];

  // Urutkan dari yang paling dekat
  distances.sort((a, b) => a.dist - b.dist);

  // Selalu return yang terdekat, tidak peduli seberapa jauh kursor di lantai
  return distances[0].wall;
};

export const getWallSnapPosition = (
  wall: WallSide,
  mesh: BABYLON.AbstractMesh,
  pointerPos: BABYLON.Vector3,
  fixedDims?: { width: number; depth: number },
): WallSnapPosition => {
  const { roomConfig } = useRoomStore.getState().present;
  const rw = roomConfig.width;
  const rd = roomConfig.depth;

  // JARAK FURNITURE KE TEMBOK (dalam satuan babylon unit)
  // 0 = menempel ke tembok
  // 5 = jarak 5 unit dari tembok
  // 10 = jarak 10 unit dari tembok
  const WALL_OFFSET = 0; // <-- UBAH INI UNTUK ATUR JARAK KE TEMBOK

  // 1. Tentukan Rotasi Target
  // Asumsi: Bagian "Belakang" model adalah sisi -Z lokal (standar GLB furniture)
  // Rotasi ini membuat sisi -Z model menghadap ke arah Tembok
  let targetRotation = 0;
  if (wall === "back")
    targetRotation = Math.PI; // 180 deg
  else if (wall === "front")
    targetRotation = 0; // 0 deg
  else if (wall === "right")
    targetRotation = -Math.PI / 2; // -90 deg
  else if (wall === "left") targetRotation = Math.PI / 2; // 90 deg

  // 2. Tentukan Dimensi
  // CRITICAL: Selalu gunakan WORLD BOUNDING BOX untuk konsistensi!
  // Jika fixedDims diberikan (dari cache saat drag), gunakan itu.
  // Jika tidak, hitung dari mesh langsung.

  let worldWidth: number;
  let worldDepth: number;

  if (fixedDims) {
    // Gunakan dimensi yang sudah di-cache saat drag start
    worldWidth = fixedDims.width;
    worldDepth = fixedDims.depth;
  } else {
    // Hitung dari mesh langsung
    mesh.computeWorldMatrix(true);
    const bounds = mesh.getHierarchyBoundingVectors(true);
    worldWidth = Math.abs(bounds.max.x - bounds.min.x);
    worldDepth = Math.abs(bounds.max.z - bounds.min.z);
  }

  // Tentukan dimensi untuk setiap wall:
  // - dimParallel: dimensi SEJAJAR dengan tembok (bisa geser)
  // - dimPerpendicular: dimensi TEGAK LURUS ke tembok (jarak dari tembok)

  let dimParallel: number;
  let dimPerpendicular: number;

  if (wall === "back" || wall === "front") {
    // Back/Front wall (horizontal walls di axis Z):
    // - Parallel (X-axis) = worldWidth
    // - Perpendicular (Z-axis) = worldDepth
    dimParallel = worldWidth;
    dimPerpendicular = worldDepth;
  } else {
    // Left/Right wall (vertical walls di axis X):
    // - Parallel (Z-axis) = worldDepth
    // - Perpendicular (X-axis) = worldWidth
    dimParallel = worldDepth;
    dimPerpendicular = worldWidth;
  }

  let finalX = 0;
  let finalZ = 0;

  // 4. Hitung Posisi
  if (wall === "back") {
    finalZ = rd / 2 - dimPerpendicular / 2 - WALL_OFFSET;
    const minX = -(rw / 2) + dimParallel / 2;
    const maxX = rw / 2 - dimParallel / 2;
    finalX = Math.max(minX, Math.min(maxX, pointerPos.x));
  } else if (wall === "front") {
    finalZ = -(rd / 2) + dimPerpendicular / 2 + WALL_OFFSET;
    const minX = -(rw / 2) + dimParallel / 2;
    const maxX = rw / 2 - dimParallel / 2;
    finalX = Math.max(minX, Math.min(maxX, pointerPos.x));
  } else if (wall === "right") {
    // Right wall: X positif maksimal
    finalX = rw / 2 - dimPerpendicular / 2 - WALL_OFFSET;
    const minZ = -(rd / 2) + dimParallel / 2;
    const maxZ = rd / 2 - dimParallel / 2;
    finalZ = Math.max(minZ, Math.min(maxZ, pointerPos.z));
  } else if (wall === "left") {
    // Left wall: X negatif maksimal
    finalX = -(rw / 2) + dimPerpendicular / 2 + WALL_OFFSET;
    const minZ = -(rd / 2) + dimParallel / 2;
    const maxZ = rd / 2 - dimParallel / 2;
    finalZ = Math.max(minZ, Math.min(maxZ, pointerPos.z));
  }

  return {
    x: finalX,
    z: finalZ,
    wall,
    rotation: targetRotation,
  };
};

// ============================================================================
// AUTO SNAP (ADJACENT)
// ============================================================================

export const findAutoSnapPosition = (
  targetFurniture: BABYLON.AbstractMesh,
  newMeshWidth: number,
  newMeshDepth: number,
  allFurniture: BABYLON.AbstractMesh[],
): WallSnapPosition | null => {
  const targetBox = getMeshAABB(targetFurniture);
  const targetWall = determineClosestWall(targetFurniture.position);
  const { roomConfig } = useRoomStore.getState().present;
  const rw = roomConfig.width;
  const rd = roomConfig.depth;
  const gap = 0.001;

  let rot = 0;
  if (targetWall === "back") rot = Math.PI;
  else if (targetWall === "front") rot = 0;
  else if (targetWall === "right") rot = -Math.PI / 2;
  else if (targetWall === "left") rot = Math.PI / 2;

  const tryPositions: WallSnapPosition[] = [];

  if (targetWall === "back" || targetWall === "front") {
    tryPositions.push(
      {
        x: targetBox.maxX + newMeshWidth / 2 + gap,
        z: targetFurniture.position.z,
        wall: targetWall,
        rotation: rot,
      },
      {
        x: targetBox.minX - newMeshWidth / 2 - gap,
        z: targetFurniture.position.z,
        wall: targetWall,
        rotation: rot,
      },
    );
  } else {
    tryPositions.push(
      {
        x: targetFurniture.position.x,
        z: targetBox.maxZ + newMeshWidth / 2 + gap,
        wall: targetWall,
        rotation: rot,
      },
      {
        x: targetFurniture.position.x,
        z: targetBox.minZ - newMeshWidth / 2 - gap,
        wall: targetWall,
        rotation: rot,
      },
    );
  }

  for (const pos of tryPositions) {
    let isValid = true;
    if (pos.wall === "back" || pos.wall === "front") {
      if (
        pos.x + newMeshWidth / 2 > rw / 2 ||
        pos.x - newMeshWidth / 2 < -rw / 2
      ) {
        isValid = false;
      }
    } else {
      if (
        pos.z + newMeshWidth / 2 > rd / 2 ||
        pos.z - newMeshWidth / 2 < -rd / 2
      ) {
        isValid = false;
      }
    }

    if (!isValid) continue;

    let hasCollision = false;
    const testBox: BoundingBox = {
      minX: pos.x - newMeshWidth / 2,
      maxX: pos.x + newMeshWidth / 2,
      minZ: pos.z - newMeshDepth / 2,
      maxZ: pos.z + newMeshDepth / 2,
      width: newMeshWidth,
      depth: newMeshDepth,
    };

    for (const other of allFurniture) {
      if (checkAABBOverlap(testBox, getMeshAABB(other))) {
        hasCollision = true;
        break;
      }
    }

    if (!hasCollision) return pos;
  }

  return null;
};

// ============================================================================
// TEXTURE & UTILITIES - DENGAN MATERIAL CACHING
// ============================================================================

export const applyTextureToMesh = (
  mesh: BABYLON.AbstractMesh,
  texName: string,
  scene: BABYLON.Scene,
) => {
  if (mesh.rotationQuaternion) mesh.rotationQuaternion = null;

  const cacheKey = `original_${mesh.uniqueId}`;

  if (!texName || texName === "") {
    if (originalMaterialCache.has(cacheKey)) {
      const originalMat = originalMaterialCache.get(cacheKey);
      if (originalMat) {
        mesh.material = originalMat;
      }
      // If we don't have a cached original material, do not overwrite the current
      // material to `null` — leave existing material as-is to avoid white default.
    }
    return;
  }

  if (!originalMaterialCache.has(cacheKey)) {
    try {
      const orig = mesh.material;
      if (orig) {
        // Clone original material to avoid shared-material mutation side-effects
        const cloned = orig.clone(`orig_${cacheKey}`);
        originalMaterialCache.set(cacheKey, cloned as BABYLON.Material);
      } else {
        originalMaterialCache.set(cacheKey, null);
      }
      console.log("Stored original material for mesh:", mesh.name);
    } catch (e) {
      // Fallback: store direct reference if clone fails
      originalMaterialCache.set(cacheKey, mesh.material ?? null);
      console.warn("Failed to clone original material for mesh:", mesh.name, e);
    }
  }

  const material = getOrCreateMaterial(texName, scene);
  mesh.material = material;
};

export const autoScaleMesh = (
  mesh: BABYLON.AbstractMesh,
  // Parameter ini opsional, hanya sebagai "plafon" maksimal, bukan target paksaan
  maxHeightLimit?: number,
): number => {
  // Ambil tinggi ruangan asli dari config
  const { roomConfig } = useRoomStore.getState().present;
  const roomHeight = roomConfig.height; // misal 3.0 (meter) atau 300 (cm)

  // Hitung tinggi mesh saat ini
  const boundsInfo = mesh.getHierarchyBoundingVectors(true);
  const currentY = boundsInfo.max.y - boundsInfo.min.y;

  if (currentY === 0) return 1;

  let scaleFactor = 1;

  // --- LOGIC 1: DETEKSI KESALAHAN UNIT (METER vs CM vs MM) ---
  // Kita gunakan kelipatan 10 untuk memperbaiki unit tanpa merusak proporsi

  // Kasus A: Model RAKSASA (misal: import MM ke scene Meter)
  // Jika tinggi model > 2x tinggi ruangan, pasti salah unit
  if (currentY > roomHeight * 2) {
    let tempY = currentY;
    // Kecilkan 10x berulang-ulang sampai masuk akal
    while (tempY > roomHeight * 1.5) {
      scaleFactor /= 10;
      tempY /= 10;
    }
  }
  // Kasus B: Model MIKRO (misal: import Meter ke scene CM)
  // Jika tinggi model < 5% tinggi ruangan, kemungkinan salah unit
  else if (currentY < roomHeight * 0.05) {
    let tempY = currentY;
    // Besarkan 10x berulang-ulang sampai minimal 20% tinggi ruangan
    // (Kecuali memang modelnya kecil banget, tapi ini safety net)
    while (tempY < roomHeight * 0.2) {
      scaleFactor *= 10;
      tempY *= 10;
    }
  }

  // --- LOGIC 2: HARD LIMIT (MENTOK PLAFON) ---
  // Setelah unit diperbaiki, pastikan tidak tembus plafon
  const projectedHeight = currentY * scaleFactor;
  const limit = maxHeightLimit || roomHeight;

  if (projectedHeight > limit) {
    // Jika masih lebih tinggi dari plafon, kecilkan pas sebatas plafon
    const fitRatio = limit / projectedHeight;
    scaleFactor *= fitRatio * 0.98; // Beri gap 2%
  }

  // Terapkan scale uniform (X, Y, Z sama) agar TIDAK gepeng/distorsi
  mesh.scaling.set(scaleFactor, scaleFactor, scaleFactor);

  return scaleFactor;
};

// ============================================================================
// DRAG BEHAVIOR (FIXED ROTATION)
// ============================================================================
export const addDragBehavior = (
  mesh: BABYLON.AbstractMesh,
  scene: BABYLON.Scene,
) => {
  const dragBehavior = new BABYLON.PointerDragBehavior({
    dragPlaneNormal: new BABYLON.Vector3(0, 1, 0),
  });

  dragBehavior.moveAttached = false;
  dragBehavior.validateDrag = () => true;
  dragBehavior.useObjectOrientationForDragging = false;

  dragBehavior.detachCameraControls = true;

  mesh.isPickable = true;
  mesh.getChildMeshes().forEach((child) => {
    child.isPickable = true;
  });

  mesh.addBehavior(dragBehavior);

  // ========================================================================
  // FIX: MANUAL DRAG TRIGGER FOR CHILDREN

  // ========================================================================
  const observer = scene.onPointerObservable.add((pointerInfo) => {
    if (
      pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN &&
      pointerInfo.event.button === 0
    ) {
      const pickInfo = pointerInfo.pickInfo;
      const pickedMesh = pickInfo?.pickedMesh;

      if (
        pickedMesh &&
        pickedMesh !== mesh &&
        pickedMesh.isDescendantOf(mesh)
      ) {
        if (dragBehavior.enabled && pickInfo?.pickedPoint) {
          const evt = pointerInfo.event as PointerEvent;
          dragBehavior.startDrag(evt.pointerId);
        }
      }
    }
  });

  mesh.onDisposeObservable.addOnce(() => {
    scene.onPointerObservable.remove(observer);
  });

  let previousValidPosition = mesh.position.clone();
  let previousValidRotation = mesh.rotation.y;
  let currentWall: WallSide | null = null;

  // ==================== DRAG START ====================
  dragBehavior.onDragStartObservable.add(() => {
    mesh.computeWorldMatrix(true);
    mesh.refreshBoundingInfo(true, true);

    updateRoomDimensions();

    // const furnitureY = mesh.position.y;

    // const dragPlane = BABYLON.Plane.FromPositionAndNormal(
    //   new BABYLON.Vector3(0, furnitureY, 0),
    //   new BABYLON.Vector3(0, 1, 0),
    // );

    const bounds = mesh.getHierarchyBoundingVectors(true);
    const furnitureHeight = bounds.max.y - bounds.min.y;
    const furnitureTopY = bounds.max.y; // Y paling atas furniture

    // ✅ BUAT DRAG PLANE DI TENGAH-TENGAH FURNITURE (lebih stabil)
    // Atau bisa juga di paling atas (furnitureTopY)
    const dragPlaneY = bounds.min.y + furnitureHeight / 2;

    const dragPlane = BABYLON.Plane.FromPositionAndNormal(
      new BABYLON.Vector3(0, dragPlaneY, 0), // ✅ Pakai Y furniture
      new BABYLON.Vector3(0, 1, 0),
    );
    // Override drag plane behavior
    (dragBehavior as any).currentDraggingPlane = dragPlane;

    const hl = scene.getHighlightLayerByName("hl1");
    if (hl) {
      hl.removeAllMeshes();
      mesh.getChildMeshes().forEach((m) => {
        hl.addMesh(m as BABYLON.Mesh, BABYLON.Color3.FromHexString("#f59e0b"));
      });
    }

    if (mesh.rotationQuaternion) {
      mesh.rotation = mesh.rotationQuaternion.toEulerAngles();
      mesh.rotationQuaternion = null;
    }

    previousValidPosition = mesh.position.clone();
    previousValidRotation = mesh.rotation.y;

    const { captureCurrentState } = useRoomStore.getState();
    captureCurrentState();

    // Detect current wall dari posisi
    const { roomConfig } = useRoomStore.getState().present;
    const rw = roomConfig.width;
    const rd = roomConfig.depth;
    const pos = mesh.position;

    const distToBack = Math.abs(pos.z - rd / 2);
    const distToFront = Math.abs(pos.z + rd / 2);
    const distToRight = Math.abs(pos.x - rw / 2);
    const distToLeft = Math.abs(pos.x + rw / 2);

    const minDist = Math.min(distToBack, distToFront, distToRight, distToLeft);

    if (minDist === distToBack) currentWall = "back";
    else if (minDist === distToFront) currentWall = "front";
    else if (minDist === distToRight) currentWall = "right";
    else currentWall = "left";

    const canvas = scene.getEngine().getRenderingCanvas();
    if (canvas) canvas.style.cursor = "grabbing";
  });

  // ==================== DRAG (MOVING) ====================
  // dragBehavior.onDragObservable.add((event) => {
  //   const pointerPos = event.dragPlanePoint;

  //   const { roomConfig } = useRoomStore.getState().present;
  //   const rw = roomConfig.width;
  //   const rd = roomConfig.depth;

  //   // THRESHOLD DINAMIS
  //   const SWITCH_THRESHOLD_PERCENT = 0.01;
  //   const switchThreshold = Math.min(rw, rd) * SWITCH_THRESHOLD_PERCENT;

  //   // Hitung jarak ke setiap tembok
  //   const distToBack = Math.abs(pointerPos.z - rd / 2);
  //   const distToFront = Math.abs(pointerPos.z + rd / 2);
  //   const distToRight = Math.abs(pointerPos.x - rw / 2);
  //   const distToLeft = Math.abs(pointerPos.x + rw / 2);

  //   // Cari wall terdekat
  //   const minDist = Math.min(distToBack, distToFront, distToRight, distToLeft);
  //   let nearestWall: WallSide = "back";

  //   if (minDist === distToBack) nearestWall = "back";
  //   else if (minDist === distToFront) nearestWall = "front";
  //   else if (minDist === distToRight) nearestWall = "right";
  //   else nearestWall = "left";

  //   // Tentukan target wall
  //   let targetWall: WallSide = currentWall || nearestWall;

  //   if (minDist < switchThreshold) {
  //     targetWall = nearestWall;
  //   }

  //   // Update current wall
  //   currentWall = targetWall;

  //   // Tentukan rotasi target
  //   let targetRotation = 0;
  //   if (targetWall === "back") targetRotation = Math.PI;
  //   else if (targetWall === "front") targetRotation = 0;
  //   else if (targetWall === "right") targetRotation = -Math.PI / 2;
  //   else if (targetWall === "left") targetRotation = Math.PI / 2;

  //   //  STEP 1: SIMPAN posisi & rotasi current
  //   const savedPosition = mesh.position.clone();
  //   const savedRotation = mesh.rotation.y;

  //   //  STEP 2: SIMULASI posisi baru
  //   if (mesh.rotationQuaternion) {
  //     mesh.rotationQuaternion = null;
  //   }
  //   mesh.rotation.y = targetRotation;
  //   mesh.computeWorldMatrix(true);

  //   const snapPos = getWallSnapPosition(targetWall, mesh, pointerPos);

  //   const originalY = mesh.position.y;
  //   mesh.position.x = snapPos.x;
  //   mesh.position.z = snapPos.z;
  //   mesh.position.y = originalY;
  //   mesh.computeWorldMatrix(true);

  //   //  STEP 3: CEK collision dengan posisi simulasi
  //   const allFurniture = getAllFurniture(scene, mesh);
  //   const myBox = getMeshAABB(mesh);

  //   let collidingFurniture: BABYLON.AbstractMesh | null = null;
  //   for (const other of allFurniture) {
  //     const otherBox = getMeshAABB(other);
  //     if (checkAABBOverlap(myBox, otherBox)) {
  //       collidingFurniture = other;
  //       break;
  //     }
  //   }

  //   //  STEP 4: Handle collision
  //   if (collidingFurniture) {
  //     // Revert ke posisi saved dulu
  //     mesh.position.copyFrom(savedPosition);
  //     mesh.rotation.y = savedRotation;
  //     mesh.computeWorldMatrix(true);

  //     // Hitung posisi "push away"
  //     const otherBox = getMeshAABB(collidingFurniture);
  //     const dragDirection = pointerPos.x - previousValidPosition.x;

  //     let safeX: number;
  //     if (dragDirection > 0) {
  //       // Geser ke kanan dari furniture lain
  //       safeX = otherBox.maxX + myBox.width / 2 + 2;
  //     } else {
  //       // Geser ke kiri dari furniture lain
  //       safeX = otherBox.minX - myBox.width / 2 - 2;
  //     }

  //     // Set rotasi lagi untuk safe position
  //     mesh.rotation.y = targetRotation;
  //     mesh.computeWorldMatrix(true);

  //     // Test posisi safe
  //     const safePushPos = getWallSnapPosition(
  //       targetWall,
  //       mesh,
  //       new BABYLON.Vector3(safeX, 0, snapPos.z),
  //     );

  //     mesh.position.x = safePushPos.x;
  //     mesh.position.z = safePushPos.z;
  //     mesh.position.y = originalY;
  //     mesh.computeWorldMatrix(true);

  //     // Validasi final: cek lagi apakah masih overlap
  //     const finalBox = getMeshAABB(mesh);
  //     let stillHasCollision = false;

  //     for (const other of allFurniture) {
  //       const otherBox = getMeshAABB(other);
  //       if (checkAABBOverlap(finalBox, otherBox)) {
  //         stillHasCollision = true;
  //         break;
  //       }
  //     }

  //     if (stillHasCollision) {
  //       // Masih collision, kembalikan ke posisi valid terakhir
  //       mesh.position.copyFrom(previousValidPosition);
  //       mesh.rotation.y = previousValidRotation;
  //       mesh.computeWorldMatrix(true);
  //     } else {
  //       // update previous valid
  //       previousValidPosition.copyFrom(mesh.position);
  //       previousValidRotation = mesh.rotation.y;
  //     }
  //   } else {
  //     // Tidak ada collision,
  //     previousValidPosition.copyFrom(mesh.position);
  //     previousValidRotation = mesh.rotation.y;
  //   }
  // });
  // ==================== DRAG (MOVING) ====================
  dragBehavior.onDragObservable.add((event) => {
    const pointerPos = event.dragPlanePoint;

    const { roomConfig } = useRoomStore.getState().present;
    const rw = roomConfig.width;
    const rd = roomConfig.depth;

    // ---------- 1. HITUNG JARAK KE TEMBOK ----------
    const distToBack = Math.abs(pointerPos.z - rd / 2);
    const distToFront = Math.abs(pointerPos.z + rd / 2);
    const distToRight = Math.abs(pointerPos.x - rw / 2);
    const distToLeft = Math.abs(pointerPos.x + rw / 2);

    const distances = [
      { wall: "back" as WallSide, dist: distToBack },
      { wall: "front" as WallSide, dist: distToFront },
      { wall: "right" as WallSide, dist: distToRight },
      { wall: "left" as WallSide, dist: distToLeft },
    ];

    distances.sort((a, b) => a.dist - b.dist);

    const nearestWall = distances[0].wall;
    const minDist = distances[0].dist;

    // ---------- 2. HYSTERESIS (ANTI GOYANG) ----------
    const SWITCH_THRESHOLD_PERCENT = 0.01;
    const switchThreshold = Math.min(rw, rd) * SWITCH_THRESHOLD_PERCENT;

    const HYSTERESIS = 1.5;

    if (!currentWall) {
      // pertama kali drag
      currentWall = nearestWall;
    } else if (
      nearestWall !== currentWall &&
      minDist < switchThreshold / HYSTERESIS
    ) {
      // pindah wall hanya kalau user "niat banget"
      currentWall = nearestWall;
    }

    const targetWall = currentWall;

    // ---------- 3. ROTASI TARGET ----------
    let targetRotation = 0;
    if (targetWall === "back") targetRotation = Math.PI;
    else if (targetWall === "front") targetRotation = 0;
    else if (targetWall === "right") targetRotation = -Math.PI / 2;
    else if (targetWall === "left") targetRotation = Math.PI / 2;

    // ---------- 4. SIMULASI POSISI ----------
    const savedPosition = mesh.position.clone();
    const savedRotation = mesh.rotation.y;

    mesh.rotation.y = targetRotation;
    mesh.computeWorldMatrix(true);

    const snapPos = getWallSnapPosition(targetWall, mesh, pointerPos);

    const originalY = mesh.position.y;
    mesh.position.set(snapPos.x, originalY, snapPos.z);
    mesh.computeWorldMatrix(true);

    // ---------- 5. COLLISION CHECK ----------
    const allFurniture = getAllFurniture(scene, mesh);
    const myBox = getMeshAABB(mesh);

    let hasCollision = false;
    for (const other of allFurniture) {
      if (checkAABBOverlap(myBox, getMeshAABB(other))) {
        hasCollision = true;
        break;
      }
    }

    if (hasCollision) {
      mesh.position.copyFrom(savedPosition);
      mesh.rotation.y = savedRotation;
      mesh.computeWorldMatrix(true);
    } else {
      previousValidPosition.copyFrom(mesh.position);
      previousValidRotation = mesh.rotation.y;
    }
  });

  // ==================== DRAG END ====================
  dragBehavior.onDragEndObservable.add(() => {
    const allFurniture = getAllFurniture(scene, mesh);
    const myBox = getMeshAABB(mesh);
    let hasCollision = false;

    for (const other of allFurniture) {
      const otherBox = getMeshAABB(other);
      if (checkAABBOverlap(myBox, otherBox)) {
        hasCollision = true;
        break;
      }
    }

    if (hasCollision) {
      mesh.position.copyFrom(previousValidPosition);
      mesh.rotation.y = previousValidRotation;
      mesh.computeWorldMatrix(true);
    } else {
      // SAVE TRANSFORM WITH HISTORY
      const { saveTransformToHistory } = useRoomStore.getState();

      const transform: FurnitureTransform = {
        modelName: mesh.name,
        position: {
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z,
        },
        rotation: mesh.rotation.y,
      };

      const allFurnitureMeshes = getAllFurniture(scene);
      const meshIndex = allFurnitureMeshes.indexOf(mesh);

      if (meshIndex === 0) {
        saveTransformToHistory(0, transform, true);
      } else if (meshIndex > 0) {
        saveTransformToHistory(meshIndex - 1, transform, false);
      }
    }

    // Clear highlight
    const hl = scene.getHighlightLayerByName("hl1");
    if (hl) {
      hl.removeAllMeshes();
    }

    const canvas = scene.getEngine().getRenderingCanvas();
    if (canvas) canvas.style.cursor = "grab";
  });
};

// ============================================================================
// POINTER & WALLS VISIBILITY
// ============================================================================

export const setupPointerInteractions = (
  scene: BABYLON.Scene,
  canvas: HTMLCanvasElement,
) => {
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
      const pick = scene.pick(scene.pointerX, scene.pointerY);

      //  Jangan override cursor saat drag
      if (canvas.getAttribute("data-visual-cue") === "dragged") return;

      if (pick.hit && pick.pickedMesh) {
        let target = pick.pickedMesh;

        //  Traverse ke atas sampai ketemu furniture root
        // ATAU sampai ga ada parent lagi
        while (target.parent) {
          if (target.metadata === "furniture") {
            break; // Ketemu furniture root, stop
          }
          target = target.parent as BABYLON.AbstractMesh;
        }

        //  Cek lagi setelah traverse
        if (target.metadata === "furniture") {
          canvas.style.cursor = "grab";
          canvas.setAttribute("data-visual-cue", "hover");
        } else {
          canvas.style.cursor = "default";
          canvas.setAttribute("data-visual-cue", "none");
        }
      } else {
        canvas.style.cursor = "default";
        canvas.setAttribute("data-visual-cue", "none");
      }
    }
  });
};

export const setupAutoHideWalls = (
  scene: BABYLON.Scene,
  walls: BABYLON.Mesh[],
  camera: BABYLON.ArcRotateCamera,
) => {
  const { roomConfig } = useRoomStore.getState().present;
  const rw = roomConfig.width;
  const wallThickness = ROOM_DIMENSIONS.wallThickness;

  scene.registerBeforeRender(() => {
    walls.forEach((w) => {
      if (!w.metadata) return;
      const cam = camera.position;
      // const offset = 10;
      const offset = 0;
      if (w.metadata.side === "back" || w.metadata.side === "front") {
        const isViewedFromFrontBack = Math.abs(cam.z) > Math.abs(cam.x);
        const isViewedFromLeftRight = Math.abs(cam.x) > Math.abs(cam.z);

        if (isViewedFromFrontBack || isViewedFromLeftRight) {
          w.scaling.x = rw / (rw + wallThickness * 2);
        } else {
          w.scaling.x = 1;
        }
      }

      if (w.metadata.side === "back" && cam.z > w.position.z + offset)
        w.visibility = 0;
      else if (w.metadata.side === "front" && cam.z < w.position.z - offset)
        w.visibility = 0;
      else if (w.metadata.side === "left" && cam.x < w.position.x - offset)
        w.visibility = 0;
      else if (w.metadata.side === "right" && cam.x > w.position.x + offset)
        w.visibility = 0;
      else if (w.metadata.side === "ceiling" && cam.y > w.position.y)
        w.visibility = 0;
      else w.visibility = 1;
    });
  });
};
