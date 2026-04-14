import * as BABYLON from "@babylonjs/core";
import { TRIAL_ROOM_CONFIG, TRIAL_TEXTURES } from "./TrialConfig";
import earcut from "earcut";

// --- Helpers ──────────────────────────────────────────────────────────────────

const createTexture = (
  scene: BABYLON.Scene,
  path: string,
  uScale: number,
  vScale: number,
) => {
  const texture = new BABYLON.Texture(path, scene);
  texture.uScale = uScale;
  texture.vScale = vScale;
  texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
  texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
  return texture;
};

const hexToColor3 = (hex: string) => {
  return BABYLON.Color3.FromHexString(hex);
};
if (typeof window !== "undefined") {
  (window as any).earcut = earcut;
}

const createMaterial = (
  scene: BABYLON.Scene,
  name: string,
  texturePath: string,
  uScale: number,
  vScale: number,
  color = BABYLON.Color3.White(),
) => {
  const material = new BABYLON.PBRMaterial(name, scene);
  material.albedoTexture = createTexture(scene, texturePath, uScale, vScale);
  material.albedoColor = color;
  material.roughness = 0.9;
  material.metallic = 0;
  material.backFaceCulling = false;
  return material;
};

/**
 * Membuat Panel Solid dengan Miter Joint di keempat sisi.
 * Presisi untuk Dinding, Lantai, dan Plafon agar bertemu di 45 derajat.
 */
const createSolidMiterPanel = (
  name: string,
  length: number, // Panjang sisi luar
  panelThickness: number,
  panelHeight: number, // Tinggi sisi luar
  scene: BABYLON.Scene,
) => {
  const T = panelThickness;
  const L = length;
  const H = panelHeight;

  // 8 Titik untuk membentuk volume solid trapesium 3D
  const positions = [
    // SISI LUAR (Full / Panjang Maksimal) - Z = T
    0,
    0,
    T, // 0: Bawah Kiri Luar
    L,
    0,
    T, // 1: Bawah Kanan Luar
    L,
    H,
    T, // 2: Atas Kanan Luar
    0,
    H,
    T, // 3: Atas Kiri Luar

    // SISI DALAM (Inset T di semua sisi untuk adu manis) - Z = 0
    T,
    T,
    0, // 4: Bawah Kiri Dalam
    L - T,
    T,
    0, // 5: Bawah Kanan Dalam
    L - T,
    H - T,
    0, // 6: Atas Kanan Dalam
    T,
    H - T,
    0, // 7: Atas Kiri Dalam
  ];

  const indices = [
    4,
    6,
    5,
    4,
    7,
    6, // Depan (Dalam Ruangan)
    0,
    1,
    2,
    0,
    2,
    3, // Belakang (Luar Ruangan)
    0,
    4,
    5,
    0,
    5,
    1, // Sisi Bawah
    3,
    2,
    6,
    3,
    6,
    7, // Sisi Atas
    0,
    3,
    7,
    0,
    7,
    4, // Sisi Kiri
    1,
    5,
    6,
    1,
    6,
    2, // Sisi Kanan
  ];

  const normals: number[] = [];
  BABYLON.VertexData.ComputeNormals(positions, indices, normals);

  const vertexData = new BABYLON.VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.normals = normals;

  const mesh = new BABYLON.Mesh(name, scene);
  vertexData.applyToMesh(mesh);
  return mesh;
};

// ─── Main export ──────────────────────────────────────────────────────────────

export const setupTrialRoom = (scene: BABYLON.Scene) => {
  const { width, depth, height, wallThickness, floorThickness } =
    TRIAL_ROOM_CONFIG;

  // Hitung Dimensi Luar agar presisi menutup satu sama lain
  const outerWidth = width + 2 * wallThickness;
  const outerDepth = depth + 2 * wallThickness;

  const wallMat = new BABYLON.StandardMaterial("wall-mat", scene);
  wallMat.diffuseColor = new BABYLON.Color3(0.96, 0.95, 0.93);
  wallMat.backFaceCulling = false;
  const floorMat = createMaterial(
    scene,
    "floor-mat",
    TRIAL_TEXTURES.floor,
    width,
    depth,
  );

  // 1. LANTAI (Floor)
  const floor = createSolidMiterPanel(
    "floor",
    outerWidth,
    floorThickness,
    outerDepth,
    scene,
  );
  floor.rotation.x = Math.PI / 2;
  // Posisi diatur agar bagian dalam trapesium sejajar dengan lantai 0
  floor.position.set(
    -(width / 2 + wallThickness),
    floorThickness,
    -(depth / 2 + wallThickness),
  );
  floor.material = floorMat;

  // 2. PLAFON (Ceiling)
  const ceiling = createSolidMiterPanel(
    "ceiling",
    outerWidth,
    wallThickness,
    outerDepth,
    scene,
  );
  ceiling.rotation.x = -Math.PI / 2;
  ceiling.position.set(
    -(width / 2 + wallThickness),
    height - wallThickness,
    depth / 2 + wallThickness,
  );
  ceiling.material = wallMat;
  ceiling.metadata = { side: "ceiling" };

  // 3. DINDING (Walls)

  // Back Wall
  const backWall = createSolidMiterPanel(
    "wall_back",
    outerWidth,
    wallThickness,
    height,
    scene,
  );

  backWall.position.set(-(width / 2 + wallThickness), 0, depth / 2);
  backWall.metadata = { side: "back" };

  // Front Wall
  const frontWall = createSolidMiterPanel(
    "wall_front",
    outerWidth,
    wallThickness,
    height,
    scene,
  );
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(width / 2 + wallThickness, 0, -depth / 2);
  frontWall.metadata = { side: "front" };

  // Left Wall
  const leftWall = createSolidMiterPanel(
    "wall_left",
    outerDepth,
    wallThickness,
    height,
    scene,
  );
  leftWall.rotation.y = -Math.PI / 2;
  leftWall.position.set(-width / 2, 0, -(depth / 2 + wallThickness));
  leftWall.metadata = { side: "left" };

  // Right Wall
  const rightWall = createSolidMiterPanel(
    "wall_right",
    outerDepth,
    wallThickness,
    height,
    scene,
  );
  rightWall.rotation.y = Math.PI / 2;
  rightWall.position.set(width / 2, 0, depth / 2 + wallThickness);
  rightWall.metadata = { side: "right" };

  const walls = [backWall, frontWall, leftWall, rightWall];
  walls.forEach((w) => {
    w.material = wallMat;
    w.receiveShadows = true;
  });

  return {
    floor,
    ceiling,
    backWall,
    frontWall,
    leftWall,
    rightWall,
    walls: [...walls, ceiling],
  };
};
