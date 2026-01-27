import * as BABYLON from "@babylonjs/core";
import { CONFIG, MATERIAL_CONFIG } from "./RoomConfig";
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
  const { roomConfig } = useRoomStore.getState().present;
  CONFIG.rw = roomConfig.width;
  CONFIG.rd = roomConfig.depth;

  console.log("📐 Room dimensions updated:", {
    width: CONFIG.rw,
    depth: CONFIG.rd,
  });

  if (scene) {
    const allFurniture = getAllFurniture(scene);

    allFurniture.forEach((mesh) => {
      const pos = mesh.position;
      const rw = CONFIG.rw;
      const rd = CONFIG.rd;

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
    });

    console.log("🔄 All furniture repositioned");
  }
};

// ============================================================================
// MATERIAL CACHE - FIX UNTUK MASALAH LIGHTING
// ============================================================================

const materialCache = new Map<string, BABYLON.PBRMaterial>();

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
  // Force update world matrix untuk menjamin bounding box akurat setelah rotasi
  mesh.computeWorldMatrix(true);
  const bounds = mesh.getHierarchyBoundingVectors(true);
  const width = bounds.max.x - bounds.min.x;
  const depth = bounds.max.z - bounds.min.z;

  return {
    minX: mesh.position.x - width / 2,
    maxX: mesh.position.x + width / 2,
    minZ: mesh.position.z - depth / 2,
    maxZ: mesh.position.z + depth / 2,
    width,
    depth,
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

const determineClosestWall = (
  position: BABYLON.Vector3,
): "back" | "front" | "right" | "left" => {
  const { roomConfig } = useRoomStore.getState().present;
  const rw = roomConfig.width;
  const rd = roomConfig.depth;
  const SNAP_THRESHOLD = 0.1; // <-- UBAH INI! Coba 0.2 - 0.5

  const distToBack = Math.abs(position.z - rd / 2);
  const distToFront = Math.abs(position.z + rd / 2);
  const distToRight = Math.abs(position.x - rw / 2);
  const distToLeft = Math.abs(position.x + rw / 2);

  const minDist = Math.min(distToBack, distToFront, distToRight, distToLeft);

  // CRITICAL: Hanya snap ke wall jika SANGAT dekat
  // Ini mencegah snap terlalu cepat saat user masih jauh dari tembok
  if (minDist > SNAP_THRESHOLD) {
    // Kalau masih jauh dari semua tembok, tetap di wall sebelumnya
    // Atau default ke wall tertentu
    // Untuk sekarang, kita tetap return wall terdekat tapi dengan batasan
  }

  if (minDist === distToBack) return "back";
  if (minDist === distToFront) return "front";
  if (minDist === distToRight) return "right";
  return "left";
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
  // FIX: Reset Quaternion jika ada, agar rotasi texture/mesh normal
  if (mesh.rotationQuaternion) mesh.rotationQuaternion = null;

  // PERBAIKAN UTAMA: Gunakan cached material
  // Ini mencegah material baru dibuat terus-menerus yang menyebabkan perubahan lighting
  const material = getOrCreateMaterial(texName, scene);
  mesh.material = material;
};

export const autoScaleMesh = (
  mesh: BABYLON.AbstractMesh,
  targetHeight: number = 80,
): number => {
  const boundsInfo = mesh.getHierarchyBoundingVectors(true);
  const sizeY = boundsInfo.max.y - boundsInfo.min.y;
  const scaleFactor = sizeY > 0 ? targetHeight / sizeY : 1;
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

  dragBehavior.useObjectOrientationForDragging = false;
  dragBehavior.moveAttached = false;

  let snapIndicator: BABYLON.Mesh | null = null;
  let previousValidPosition = mesh.position.clone();
  let previousValidRotation = mesh.rotation.y;
  let currentWall: WallSide | null = null;

  dragBehavior.onDragStartObservable.add(() => {
    updateRoomDimensions();

    if (mesh.rotationQuaternion) {
      mesh.rotation = mesh.rotationQuaternion.toEulerAngles();
      mesh.rotationQuaternion = null;
    }

    previousValidPosition = mesh.position.clone();
    previousValidRotation = mesh.rotation.y;

    const { captureCurrentState } = useRoomStore.getState();
    captureCurrentState();
    console.log("📸 Captured state BEFORE drag");
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

    snapIndicator = BABYLON.MeshBuilder.CreateBox(
      "snapInd",
      { width: 2, height: 100, depth: 2 },
      scene,
    );
    const mat = new BABYLON.StandardMaterial("snapMat", scene);
    mat.emissiveColor = BABYLON.Color3.Green();
    snapIndicator.material = mat;
    snapIndicator.isPickable = false;

    const canvas = scene.getEngine().getRenderingCanvas();
    if (canvas) canvas.style.cursor = "grabbing";
  });

  dragBehavior.onDragObservable.add((event) => {
    const pointerPos = event.dragPlanePoint;
    const { roomConfig } = useRoomStore.getState().present;
    const rw = roomConfig.width;
    const rd = roomConfig.depth;

    // ⭐ THRESHOLD DINAMIS
    const SWITCH_THRESHOLD_PERCENT = 0.01; // 15%
    const switchThreshold = Math.min(rw, rd) * SWITCH_THRESHOLD_PERCENT;

    // Hitung jarak ke setiap tembok
    const distToBack = Math.abs(pointerPos.z - rd / 2);
    const distToFront = Math.abs(pointerPos.z + rd / 2);
    const distToRight = Math.abs(pointerPos.x - rw / 2);
    const distToLeft = Math.abs(pointerPos.x + rw / 2);

    // Cari wall terdekat
    const minDist = Math.min(distToBack, distToFront, distToRight, distToLeft);
    let nearestWall: WallSide = "back";

    if (minDist === distToBack) nearestWall = "back";
    else if (minDist === distToFront) nearestWall = "front";
    else if (minDist === distToRight) nearestWall = "right";
    else nearestWall = "left";

    // Tentukan target wall
    let targetWall: WallSide = currentWall || nearestWall;

    if (minDist < switchThreshold) {
      if (nearestWall !== currentWall) {
      }
      targetWall = nearestWall;
    }

    // Update current wall
    currentWall = targetWall;

    // ⭐ CRITICAL FIX: Tentukan rotasi DULU sebelum hitung posisi
    let targetRotation = 0;
    if (targetWall === "back") targetRotation = Math.PI;
    else if (targetWall === "front") targetRotation = 0;
    else if (targetWall === "right") targetRotation = -Math.PI / 2;
    else if (targetWall === "left") targetRotation = Math.PI / 2;

    // ⭐ FIX ROTASI GLITCH: Matikan quaternion dan set rotasi dengan bersih
    if (mesh.rotationQuaternion) {
      mesh.rotationQuaternion = null;
    }
    mesh.rotation.y = targetRotation;
    mesh.computeWorldMatrix(true);

    // ⭐ SNAP KE TEMBOK - Gunakan getWallSnapPosition
    const snapPos = getWallSnapPosition(
      targetWall,
      mesh,
      pointerPos,
      undefined, // Force recalculate
    );

    // Apply posisi hasil snap (BUKAN posisi pointer!)
    mesh.position.x = snapPos.x;
    mesh.position.z = snapPos.z;

    // Update indicator
    if (snapIndicator) {
      snapIndicator.position = mesh.position.clone();
      snapIndicator.position.y += 50;
    }

    // Cek collision (updated)
    mesh.computeWorldMatrix(true);

    const allFurniture = getAllFurniture(scene, mesh);
    const myBoxAtTarget = getMeshAABB(mesh);
    let collidingFurniture: BABYLON.AbstractMesh | null = null;

    for (const other of allFurniture) {
      if (checkAABBOverlap(myBoxAtTarget, getMeshAABB(other))) {
        collidingFurniture = other;
        break;
      }
    }

    if (collidingFurniture) {
      const otherBox = getMeshAABB(collidingFurniture);
      const dragDirection = pointerPos.x - previousValidPosition.x;

      let targetX: number;
      if (dragDirection > 0) {
        targetX = otherBox.maxX + myBoxAtTarget.width / 2 + 2;
      } else {
        targetX = otherBox.minX - myBoxAtTarget.width / 2 - 2;
      }

      const newSnapPos = getWallSnapPosition(
        targetWall,
        mesh,
        new BABYLON.Vector3(targetX, 0, pointerPos.z),
      );

      mesh.position.x = newSnapPos.x;
      mesh.position.z = newSnapPos.z;

      if (snapIndicator && snapIndicator.material) {
        (snapIndicator.material as BABYLON.StandardMaterial).emissiveColor =
          BABYLON.Color3.Yellow();
      }
    } else {
      previousValidPosition.copyFrom(mesh.position);
      previousValidRotation = mesh.rotation.y;

      if (snapIndicator && snapIndicator.material) {
        (snapIndicator.material as BABYLON.StandardMaterial).emissiveColor =
          BABYLON.Color3.Green();
      }
    }

    if (snapIndicator) {
      snapIndicator.position = mesh.position.clone();
      snapIndicator.position.y += 50;
    }
  });

  dragBehavior.onDragEndObservable.add(() => {
    console.log("🔴 DRAG END - Starting");

    const allFurniture = getAllFurniture(scene, mesh);
    const myBox = getMeshAABB(mesh);
    let hasCollision = false;

    for (const other of allFurniture) {
      if (checkAABBOverlap(myBox, getMeshAABB(other))) {
        hasCollision = true;
        break;
      }
    }

    console.log("🔴 Collision:", hasCollision);

    if (hasCollision) {
      mesh.position.copyFrom(previousValidPosition);
      mesh.rotation.y = previousValidRotation;
      console.log("❌ Reverted due to collision");
    } else {
      console.log("✅ No collision, saving transform...");

      // ⭐ SAVE TRANSFORM WITH HISTORY
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

      console.log("💾 Transform to save:", transform);

      const allFurnitureMeshes = getAllFurniture(scene);
      const meshIndex = allFurnitureMeshes.indexOf(mesh);

      console.log(
        "🔍 Mesh index:",
        meshIndex,
        "Total furniture:",
        allFurnitureMeshes.length,
      );

      if (meshIndex === 0) {
        saveTransformToHistory(0, transform, true);
        console.log("💾 Saved MAIN model WITH HISTORY");
      } else if (meshIndex > 0) {
        saveTransformToHistory(meshIndex - 1, transform, false);
        console.log(`💾 Saved ADDITIONAL ${meshIndex - 1} WITH HISTORY`);
      }
    }

    if (snapIndicator) {
      snapIndicator.dispose();
      snapIndicator = null;
    }

    const canvas = scene.getEngine().getRenderingCanvas();
    if (canvas) canvas.style.cursor = "grab";
  });

  mesh.addBehavior(dragBehavior);
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
      if (canvas.getAttribute("data-visual-cue") !== "dragged") {
        if (pick.hit && pick.pickedMesh) {
          const isFurniture =
            pick.pickedMesh.metadata === "furniture" ||
            (pick.pickedMesh.parent &&
              pick.pickedMesh.parent.metadata === "furniture");

          canvas.style.cursor = isFurniture ? "grab" : "default";
        } else {
          canvas.style.cursor = "default";
        }
      }
    }
  });
};

export const setupAutoHideWalls = (
  scene: BABYLON.Scene,
  walls: BABYLON.Mesh[],
  camera: BABYLON.ArcRotateCamera,
) => {
  scene.registerBeforeRender(() => {
    walls.forEach((w) => {
      if (!w.metadata) return;
      const cam = camera.position;
      // const offset = 10;
      const offset = 0;

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
