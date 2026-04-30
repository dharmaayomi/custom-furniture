import * as BABYLON from "@babylonjs/core";
import { TRIAL_TEXTURES, TrialRoomConfig } from "./TrialConfig";
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

const createClampedTexture = (
  scene: BABYLON.Scene,
  path: string,
  uScale = 1,
  vScale = 1,
) => {
  const texture = new BABYLON.Texture(path, scene);
  texture.uScale = uScale;
  texture.vScale = vScale;
  texture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
  texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
  texture.anisotropicFilteringLevel = 8;
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

const createWallSurfaceMaterial = (
  scene: BABYLON.Scene,
  name: string,
  horizontalSpan: number,
  verticalSpan: number,
  wallColor: string,
) => {
  const wallTileWorldSize = 1;
  const uScale = Math.max(horizontalSpan / wallTileWorldSize, 0.001);
  const vScale = Math.max(verticalSpan / wallTileWorldSize, 0.001);

  const material = new BABYLON.PBRMaterial(name, scene);
  material.albedoTexture = createTexture(
    scene,
    TRIAL_TEXTURES.wall,
    uScale,
    vScale,
  );
  material.albedoColor = hexToColor3(wallColor);
  material.bumpTexture = createTexture(
    scene,
    TRIAL_TEXTURES.bump_wall,
    uScale,
    vScale,
  );
  material.bumpTexture.level = 1;
  material.invertNormalMapX = true;
  material.invertNormalMapY = true;
  material.roughness = 0.85;
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

/**
 * Wall profile with mitered left/right joins only.
 * Bottom and top stay flush so the wall meets the floor and ceiling cleanly.
 */
const createSolidMiterWall = (
  name: string,
  length: number,
  thickness: number,
  height: number,
  scene: BABYLON.Scene,
) => {
  const T = thickness;
  const L = length;
  const H = height;

  const positions = [
    // Outer face
    0,
    0,
    T,
    L,
    0,
    T,
    L,
    H,
    T,
    0,
    H,
    T,

    // Inner face, inset only on left/right edges
    T,
    0,
    0,
    L - T,
    0,
    0,
    L - T,
    H,
    0,
    T,
    H,
    0,
  ];

  const indices = [
    4, 6, 5, 4, 7, 6, 0, 1, 2, 0, 2, 3, 0, 4, 5, 0, 5, 1, 3, 2, 6, 3, 6, 7, 0,
    3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2,
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

export interface TrialRoomResult {
  floor: BABYLON.Mesh;
  ceiling: BABYLON.Mesh;
  backWall: BABYLON.Mesh;
  floorVinyl: BABYLON.Mesh;
  frontWall: BABYLON.Mesh;
  innerBackWall: BABYLON.Mesh;
  innerFrontWall: BABYLON.Mesh;
  innerLeftWall: BABYLON.Mesh;
  innerRightWall: BABYLON.Mesh;
  innerCeiling: BABYLON.Mesh;
  leftWall: BABYLON.Mesh;
  rightWall: BABYLON.Mesh;
  walls: BABYLON.Mesh[];
  shadowCasters: BABYLON.Mesh[];
  dispose: () => void;
}

export const setupTrialRoom = (
  scene: BABYLON.Scene,
  roomConfig: TrialRoomConfig,
): TrialRoomResult => {
  const {
    width,
    depth,
    height,
    wallThickness,
    floorThickness,
    vinylThickness,
    wallColor,
    floorTexture,
  } = roomConfig;

  // Hitung Dimensi Luar agar presisi menutup satu sama lain
  const outerWidth = width + 2 * wallThickness;
  const outerDepth = depth + 2 * wallThickness;

  const frameMat = new BABYLON.PBRMaterial("frame-mat", scene);
  frameMat.albedoColor = new BABYLON.Color3(0.8, 0.8, 0.8);
  frameMat.roughness = 0.8;
  frameMat.metallic = 0;
  frameMat.backFaceCulling = false;
  frameMat.unlit = true;

  const innerWallHeight = height - wallThickness - floorThickness;

  const widthWallMat = createWallSurfaceMaterial(
    scene,
    "inner-wall-width-mat",
    width,
    innerWallHeight,
    wallColor,
  );
  widthWallMat.zOffset = -0.005;
  const depthWallMat = createWallSurfaceMaterial(
    scene,
    "inner-wall-depth-mat",
    depth,
    innerWallHeight,
    wallColor,
  );
  depthWallMat.zOffset = -0.005;

  const innerCeilingMat = new BABYLON.PBRMaterial("inner-ceiling-mat", scene);
  innerCeilingMat.albedoColor = hexToColor3("#cccccc");
  innerCeilingMat.roughness = 0.75;
  innerCeilingMat.metallic = 0;
  innerCeilingMat.backFaceCulling = false;
  innerCeilingMat.zOffset = -0.005;

  // 1. LANTAI (Floor)
  const floor = createSolidMiterPanel(
    "floor",
    outerWidth,
    wallThickness,
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
  floor.material = frameMat;
  floor.receiveShadows = true;
  floor.metadata = { side: "floor" };

  const floorVinyl = BABYLON.MeshBuilder.CreateBox(
    "floorVinyl",
    { width: width, height: vinylThickness, depth: depth },
    scene,
  );
  floorVinyl.position.y = floorThickness - vinylThickness / 2 + 0.002;
  floorVinyl.receiveShadows = true;
  floorVinyl.metadata = { side: "floor" };

  const floorVinylMat = new BABYLON.PBRMaterial("floorVinylMat", scene);
  floorVinylMat.roughness = 0.7;
  floorVinylMat.metallic = 0;
  floorVinylMat.metadata = { side: "floor" };

  const vinylTexture = new BABYLON.Texture(
    floorTexture,
    scene,

    false, // noMipmap = false (pastikan mipmap aktif)
    true, // invertY
    BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
  );
  vinylTexture.uScale = width / 2;
  vinylTexture.vScale = depth / 2;
  vinylTexture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
  vinylTexture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
  vinylTexture.anisotropicFilteringLevel = 16;

  floorVinylMat.albedoTexture = vinylTexture;
  floorVinylMat.albedoColor = new BABYLON.Color3(1.0, 1.0, 1.0);
  floorVinyl.material = floorVinylMat;

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
  ceiling.material = frameMat;
  ceiling.metadata = { side: "ceiling" };

  // 3. DINDING (Walls)

  // Back Wall
  const backWall = createSolidMiterWall(
    "wall_back",
    outerWidth,
    wallThickness,
    height,
    scene,
  );

  backWall.position.set(-(width / 2 + wallThickness), 0, depth / 2);
  backWall.metadata = { side: "back" };

  // Front Wall
  const frontWall = createSolidMiterWall(
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
  const leftWall = createSolidMiterWall(
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
  const rightWall = createSolidMiterWall(
    "wall_right",
    outerDepth,
    wallThickness,
    height,
    scene,
  );
  rightWall.rotation.y = Math.PI / 2;
  rightWall.position.set(width / 2, 0, depth / 2 + wallThickness);
  rightWall.metadata = { side: "right" };

  const frameWalls = [backWall, frontWall, leftWall, rightWall];
  frameWalls.forEach((w) => {
    w.material = frameMat;
    w.receiveShadows = true;
  });

  const innerWallY = floorThickness + innerWallHeight / 2;
  const innerSurfaceThickness = 0.02;

  const innerBackWall = BABYLON.MeshBuilder.CreatePlane(
    "inner_wall_back",
    { width, height: innerWallHeight },
    scene,
  );
  innerBackWall.position.set(
    0,
    innerWallY,
    depth / 2 - innerSurfaceThickness / 2,
  );
  innerBackWall.rotation.y = Math.PI;
  innerBackWall.material = widthWallMat;

  innerBackWall.receiveShadows = true;
  innerBackWall.metadata = { side: "back" };

  const innerFrontWall = BABYLON.MeshBuilder.CreatePlane(
    "inner_wall_front",
    { width, height: innerWallHeight },
    scene,
  );
  innerFrontWall.position.set(
    0,
    innerWallY,
    -depth / 2 + innerSurfaceThickness / 2,
  );
  innerFrontWall.material = widthWallMat;
  innerFrontWall.receiveShadows = true;
  innerFrontWall.metadata = { side: "front" };

  const innerLeftWall = BABYLON.MeshBuilder.CreatePlane(
    "inner_wall_left",
    { width: depth, height: innerWallHeight },
    scene,
  );
  innerLeftWall.position.set(
    -width / 2 + innerSurfaceThickness / 2,
    innerWallY,
    0,
  );
  innerLeftWall.rotation.y = Math.PI / 2;
  innerLeftWall.material = depthWallMat;
  innerLeftWall.receiveShadows = true;
  innerLeftWall.metadata = { side: "left" };

  const innerRightWall = BABYLON.MeshBuilder.CreatePlane(
    "inner_wall_right",
    { width: depth, height: innerWallHeight },
    scene,
  );
  innerRightWall.position.set(
    width / 2 - innerSurfaceThickness / 2,
    innerWallY,
    0,
  );
  innerRightWall.rotation.y = -Math.PI / 2;
  innerRightWall.material = depthWallMat;
  innerRightWall.receiveShadows = true;
  innerRightWall.metadata = { side: "right" };

  const innerCeiling = BABYLON.MeshBuilder.CreateBox(
    "inner_ceiling",
    { width, height: innerSurfaceThickness, depth },
    scene,
  );
  innerCeiling.position.set(
    0,
    height - wallThickness - innerSurfaceThickness / 2,
    0,
  );
  innerCeiling.material = innerCeilingMat;
  innerCeiling.receiveShadows = true;
  innerCeiling.metadata = { side: "ceiling" };

  const walls = [
    ...frameWalls,
    innerBackWall,
    innerFrontWall,
    innerLeftWall,
    innerRightWall,
    ceiling,
    innerCeiling,
    floor,
    floorVinyl,
  ];
  const shadowCasters = [
    backWall,
    frontWall,
    leftWall,
    rightWall,
    ceiling,
    innerBackWall,
    innerFrontWall,
    innerLeftWall,
    innerRightWall,
    innerCeiling,
  ];
  const allMeshes = [
    floor,
    ceiling,
    backWall,
    floorVinyl,
    frontWall,
    innerBackWall,
    innerFrontWall,
    innerLeftWall,
    innerRightWall,
    innerCeiling,
    leftWall,
    rightWall,
  ];

  return {
    floor,
    ceiling,
    backWall,
    floorVinyl,
    frontWall,
    innerBackWall,
    innerFrontWall,
    innerLeftWall,
    innerRightWall,
    innerCeiling,
    leftWall,
    rightWall,
    walls,
    shadowCasters,
    dispose: () => {
      allMeshes.forEach((mesh) => mesh.dispose());
      vinylTexture.dispose();
      frameMat.dispose();
      widthWallMat.dispose(true, true);
      depthWallMat.dispose(true, true);
      innerCeilingMat.dispose();
      floorVinylMat.dispose();
    },
  };
};
