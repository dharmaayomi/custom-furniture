import * as BABYLON from "@babylonjs/core";
import { CONFIG, MATERIAL_CONFIG } from "./RoomConfig";

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

export const determineClosestWall = (position: BABYLON.Vector3): WallSide => {
  const { rw, rd } = CONFIG;

  const distToBack = Math.abs(rd / 2 - position.z);
  const distToFront = Math.abs(-rd / 2 - position.z);
  const distToRight = Math.abs(rw / 2 - position.x);
  const distToLeft = Math.abs(-rw / 2 - position.x);

  const minDist = Math.min(distToBack, distToFront, distToRight, distToLeft);

  if (minDist === distToBack) return "back";
  if (minDist === distToFront) return "front";
  if (minDist === distToRight) return "right";
  return "left";
};

/**
 * Mendapatkan dimensi LOKAL (Width & Depth asli) dari mesh.
 * Kita asumsikan saat load rotasi 0, Width = X, Depth = Z.
 * Fungsi ini mencoba "menebak" dimensi asli meskipun barang sedang miring.
 */
const getLocalDimensions = (mesh: BABYLON.AbstractMesh) => {
  // Pastikan quaternion mati dulu agar rotasi Euler valid
  if (mesh.rotationQuaternion) mesh.rotationQuaternion = null;

  const currentRot = mesh.rotation.y;
  // Cek apakah barang sedang miring (90 atau 270 derajat)
  // Gunakan toleransi karena float tidak presisi
  const isSideways =
    Math.abs(Math.abs(currentRot) - Math.PI / 2) < 0.2 ||
    Math.abs(Math.abs(currentRot) - Math.PI * 1.5) < 0.2;

  const bounds = mesh.getHierarchyBoundingVectors(true);
  const worldWidth = Math.abs(bounds.max.x - bounds.min.x);
  const worldDepth = Math.abs(bounds.max.z - bounds.min.z);

  // Jika miring, berarti Width Dunia = Depth Asli, dan sebaliknya
  if (isSideways) {
    return { width: worldDepth, depth: worldWidth };
  }
  return { width: worldWidth, depth: worldDepth };
};

export const getWallSnapPosition = (
  wall: WallSide,
  mesh: BABYLON.AbstractMesh,
  pointerPos: BABYLON.Vector3,
  fixedDims?: { width: number; depth: number }, // Optional: dimensi fix jika sudah diketahui
): WallSnapPosition => {
  const { rw, rd } = CONFIG;
  const offset = 1;

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
  // Jika dimensi fix diberikan (dari onDragStart), pakai itu agar stabil.
  // Jika tidak, hitung sendiri.
  const dims = fixedDims || getLocalDimensions(mesh);
  const localWidth = dims.width;
  const localDepth = dims.depth;

  // 3. Tentukan Dimensi Efektif untuk Clamping
  // Jika nempel tembok Back/Front: Panjang barang = Local Width. Tebal = Local Depth.
  // Jika nempel tembok Left/Right: Panjang barang = Local Depth. Tebal = Local Width. (SALAH)
  // KOREKSI:
  // Saat diputar 90 derajat (nempel kiri/kanan):
  // Sisi yang sejajar tembok adalah Local Width (Sisi panjang barang).
  // Sisi yang menonjol keluar adalah Local Depth (Sisi tebal barang).
  // Jadi 'dimParallel' selalu localWidth, 'dimPerpendicular' selalu localDepth.
  // (Asumsi barang lebih lebar daripada tebal, seperti lemari/meja standar).

  const dimParallel = localWidth;
  const dimPerpendicular = localDepth;

  let finalX = 0;
  let finalZ = 0;

  // 4. Hitung Posisi
  if (wall === "back") {
    finalZ = rd / 2 - dimPerpendicular / 2 - offset;
    const minX = -(rw / 2) + dimParallel / 2;
    const maxX = rw / 2 - dimParallel / 2;
    finalX = Math.max(minX, Math.min(maxX, pointerPos.x));
  } else if (wall === "front") {
    finalZ = -(rd / 2) + dimPerpendicular / 2 + offset;
    const minX = -(rw / 2) + dimParallel / 2;
    const maxX = rw / 2 - dimParallel / 2;
    finalX = Math.max(minX, Math.min(maxX, pointerPos.x));
  } else if (wall === "right") {
    finalX = rw / 2 - dimPerpendicular / 2 - offset;
    const minZ = -(rd / 2) + dimParallel / 2;
    const maxZ = rd / 2 - dimParallel / 2;
    finalZ = Math.max(minZ, Math.min(maxZ, pointerPos.z));
  } else if (wall === "left") {
    finalX = -(rw / 2) + dimPerpendicular / 2 + offset;
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
  const { rw, rd } = CONFIG;
  const gap = 2;

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
      )
        isValid = false;
    } else {
      if (
        pos.z + newMeshWidth / 2 > rd / 2 ||
        pos.z - newMeshWidth / 2 < -rd / 2
      )
        isValid = false;
    }

    if (!isValid) continue;

    const testBox = {
      minX:
        pos.wall === "left" || pos.wall === "right"
          ? pos.x - newMeshDepth / 2
          : pos.x - newMeshWidth / 2,
      maxX:
        pos.wall === "left" || pos.wall === "right"
          ? pos.x + newMeshDepth / 2
          : pos.x + newMeshWidth / 2,
      minZ:
        pos.wall === "left" || pos.wall === "right"
          ? pos.z - newMeshWidth / 2
          : pos.z - newMeshDepth / 2,
      maxZ:
        pos.wall === "left" || pos.wall === "right"
          ? pos.z + newMeshWidth / 2
          : pos.z + newMeshDepth / 2,
      width: newMeshWidth,
      depth: newMeshDepth,
    };

    let hasCollision = false;
    for (const other of allFurniture) {
      if (other === targetFurniture) continue;
      if (checkAABBOverlap(testBox as BoundingBox, getMeshAABB(other))) {
        hasCollision = true;
        break;
      }
    }

    if (!hasCollision) return pos;
  }

  return null;
};

// ============================================================================
// TEXTURE & UTILITIES
// ============================================================================

export const applyTextureToMesh = (
  mesh: BABYLON.AbstractMesh,
  texName: string,
  scene: BABYLON.Scene,
) => {
  const texturePath = "/assets/texture/" + texName;
  const newTex = new BABYLON.Texture(texturePath, scene);

  // FIX: Reset Quaternion jika ada, agar rotasi texture/mesh normal
  if (mesh.rotationQuaternion) mesh.rotationQuaternion = null;

  const pbrMat = new BABYLON.PBRMaterial("customMat_" + texName, scene);
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

  mesh.material = pbrMat;
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

  // Simpan dimensi asli barang saat drag mulai agar tidak berubah-ubah saat diputar
  let cachedDimensions = { width: 0, depth: 0 };

  dragBehavior.onDragStartObservable.add(() => {
    // === CRITICAL FIX ===
    // Matikan rotationQuaternion. Jika ini aktif, mesh.rotation.y tidak akan berfungsi.
    if (mesh.rotationQuaternion) {
      // Konversi rotasi saat ini ke Euler sebelum dimatikan (opsional, tapi aman)
      mesh.rotation = mesh.rotationQuaternion.toEulerAngles();
      mesh.rotationQuaternion = null;
    }
    // ====================

    // Cache dimensi lokal (Width = Sisi Panjang, Depth = Sisi Tebal)
    cachedDimensions = getLocalDimensions(mesh);

    previousValidPosition = mesh.position.clone();
    previousValidRotation = mesh.rotation.y;

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

    // 1. Tentukan tembok
    const targetWall = determineClosestWall(pointerPos);

    // 2. Hitung snap position menggunakan dimensi yang sudah di-cache
    const snapPos = getWallSnapPosition(
      targetWall,
      mesh,
      pointerPos,
      cachedDimensions,
    );

    // 3. Apply Rotasi & Posisi
    // Karena quaternion sudah null, ini SEHARUSNYA memutar mesh secara visual
    mesh.rotation.y = snapPos.rotation;
    mesh.position.x = snapPos.x;
    mesh.position.z = snapPos.z;

    // Update indicator visual
    if (snapIndicator) {
      snapIndicator.position = mesh.position.clone();
      snapIndicator.position.y += 50;
    }

    // 4. Cek Collision
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
      if (snapIndicator && snapIndicator.material) {
        (snapIndicator.material as BABYLON.StandardMaterial).emissiveColor =
          BABYLON.Color3.Red();
      }
    } else {
      previousValidPosition.copyFrom(mesh.position);
      previousValidRotation = mesh.rotation.y;
      if (snapIndicator && snapIndicator.material) {
        (snapIndicator.material as BABYLON.StandardMaterial).emissiveColor =
          BABYLON.Color3.Green();
      }
    }
  });

  dragBehavior.onDragEndObservable.add(() => {
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
      console.log("Collision detected on drop, reverting...");
      mesh.position.copyFrom(previousValidPosition);
      mesh.rotation.y = previousValidRotation;
    }

    if (snapIndicator) {
      snapIndicator.dispose();
      snapIndicator = null;
    }

    console.log(
      `Placed at Wall: ${determineClosestWall(mesh.position)} | Rot: ${mesh.rotation.y.toFixed(2)}`,
    );

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
      const offset = 10;

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
