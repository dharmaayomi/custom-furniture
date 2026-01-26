import * as BABYLON from "@babylonjs/core";
import { ROOM_DIMENSIONS, MATERIAL_CONFIG, TEXTURE_PATHS } from "./RoomConfig";
import { RoomConfig } from "@/store/useRoomStore";

// Helper konversi Hex ke Color3
const hexToColor3 = (hex: string) => {
  return BABYLON.Color3.FromHexString(hex);
};

export const setupRoom = (scene: BABYLON.Scene, config: RoomConfig) => {
  const {
    width: rw,
    depth: rd,
    height: wallHeight,
    wallColor,
    floorTexture: floorTexturePath,
  } = config;
  const { wallThickness, floorThickness, vinylThickness } = ROOM_DIMENSIONS;

  // --- 1. FLOOR BASE ---
  const floorBase = BABYLON.MeshBuilder.CreateBox(
    "floorBase",
    { width: rw, height: floorThickness - vinylThickness, depth: rd },
    scene,
  );
  floorBase.position.y = (floorThickness - vinylThickness) / 2;
  floorBase.receiveShadows = true;

  const floorBaseMat = new BABYLON.PBRMaterial("floorBaseMat", scene);
  floorBaseMat.albedoColor = hexToColor3("#F2F0EB");
  floorBaseMat.roughness = 0.5;
  floorBaseMat.metallic = 0;
  floorBase.material = floorBaseMat;

  // --- 2. FLOOR VINYL (Dynamic Texture) ---
  const floorVinyl = BABYLON.MeshBuilder.CreateBox(
    "floorVinyl",
    { width: rw, height: vinylThickness, depth: rd },
    scene,
  );
  floorVinyl.position.y = floorThickness - vinylThickness / 2;
  floorVinyl.receiveShadows = true;

  const floorVinylMat = new BABYLON.PBRMaterial("floorVinylMat", scene);
  floorVinylMat.roughness = MATERIAL_CONFIG.floor.roughness;
  floorVinylMat.metallic = MATERIAL_CONFIG.floor.metallic;
  floorVinylMat.directIntensity = 1.5;

  const texture = new BABYLON.Texture(floorTexturePath, scene);
  texture.uScale = rw / 100;
  texture.vScale = rd / 100;
  floorVinylMat.albedoTexture = texture;
  floorVinyl.material = floorVinylMat;

  // --- 3. CEILING ---
  const ceiling = BABYLON.MeshBuilder.CreateBox(
    "ceiling",
    { width: rw, height: floorThickness, depth: rd },
    scene,
  );
  ceiling.position.y = wallHeight - floorThickness / 2;
  ceiling.receiveShadows = true;
  ceiling.metadata = { side: "ceiling" };

  // --- 4. WALLS (Dynamic Color) ---
  const wallMat = new BABYLON.PBRMaterial("wallMat", scene);
  wallMat.albedoColor = hexToColor3(wallColor); // Gunakan warna dari config
  wallMat.roughness = MATERIAL_CONFIG.interior.roughness;
  wallMat.metallic = MATERIAL_CONFIG.interior.metallic;
  wallMat.directIntensity = 2.0;
  const walls: BABYLON.Mesh[] = [];

  // Helper untuk buat dinding
  const createWall = (
    name: string,
    w: number,
    d: number,
    x: number,
    z: number,
    side: string,
  ) => {
    const wall = BABYLON.MeshBuilder.CreateBox(
      name,
      { width: w, height: wallHeight, depth: d },
      scene,
    );
    wall.position.set(x, wallHeight / 2, z);
    wall.material = wallMat;
    wall.metadata = { side };
    wall.receiveShadows = true;
    walls.push(wall);
    return wall;
  };

  // Back
  createWall(
    "wall_back",
    rw + wallThickness * 2,
    wallThickness,
    0,
    rd / 2 + wallThickness / 2,
    "back",
  );
  // Front
  createWall(
    "wall_front",
    rw + wallThickness * 2,
    wallThickness,
    0,
    -rd / 2 - wallThickness / 2,
    "front",
  );
  // Left
  createWall(
    "wall_left",
    wallThickness,
    wallThickness,
    -rw / 2 - wallThickness / 2,
    0,
    "left",
  ).scaling.z = rd / wallThickness; // Scale Z agar sesuai depth

  const leftWall = BABYLON.MeshBuilder.CreateBox(
    "wall_left",
    { width: wallThickness, height: wallHeight, depth: rd },
    scene,
  );
  leftWall.position.set(-rw / 2 - wallThickness / 2, wallHeight / 2, 0);
  leftWall.material = wallMat;
  leftWall.metadata = { side: "left" };
  leftWall.receiveShadows = true;
  walls.push(leftWall);

  // Right
  const rightWall = BABYLON.MeshBuilder.CreateBox(
    "wall_right",
    { width: wallThickness, height: wallHeight, depth: rd },
    scene,
  );
  rightWall.position.set(rw / 2 + wallThickness / 2, wallHeight / 2, 0);
  rightWall.material = wallMat;
  rightWall.metadata = { side: "right" };
  rightWall.receiveShadows = true;
  walls.push(rightWall);

  ceiling.material = wallMat;

  walls.push(ceiling);
  return { walls, floorVinyl, ceiling, floorBase };
};
