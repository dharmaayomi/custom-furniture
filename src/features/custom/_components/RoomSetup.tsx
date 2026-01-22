import * as BABYLON from "@babylonjs/core";
import {
  CONFIG,
  ROOM_DIMENSIONS,
  MATERIAL_CONFIG,
  TEXTURE_PATHS,
} from "./RoomConfig";

export const setupRoom = (scene: BABYLON.Scene) => {
  const { rw, rd, type } = CONFIG;
  const { wallHeight, wallThickness, floorThickness, vinylThickness } =
    ROOM_DIMENSIONS;

  // Floor Base
  const floorBase = BABYLON.MeshBuilder.CreateBox(
    "floorBase",
    { width: rw, height: floorThickness - vinylThickness, depth: rd },
    scene,
  );
  floorBase.position.y = (floorThickness - vinylThickness) / 2;

  const floorBaseMat = new BABYLON.PBRMaterial("floorBaseMat", scene);
  floorBaseMat.albedoColor = new BABYLON.Color3(0.75, 0.65, 0.55);
  floorBaseMat.roughness = 0.7;
  floorBaseMat.metallic = 0;
  floorBase.material = floorBaseMat;

  // Floor Vinyl
  const floorVinyl = BABYLON.MeshBuilder.CreateBox(
    "floorVinyl",
    { width: rw, height: vinylThickness, depth: rd },
    scene,
  );
  floorVinyl.position.y = floorThickness - vinylThickness / 2;

  const floorVinylMat = new BABYLON.PBRMaterial("floorVinylMat", scene);
  floorVinylMat.roughness = MATERIAL_CONFIG.floor.roughness;
  floorVinylMat.metallic = MATERIAL_CONFIG.floor.metallic;

  // Get texture path based on room type
  const texturePath = TEXTURE_PATHS[type] || TEXTURE_PATHS.kitchen;

  const texture = new BABYLON.Texture(texturePath, scene);
  texture.uScale = rw / 100;
  texture.vScale = rd / 100;
  floorVinylMat.albedoTexture = texture;

  floorVinyl.material = floorVinylMat;

  // Ceiling
  const ceiling = BABYLON.MeshBuilder.CreateBox(
    "ceiling",
    { width: rw, height: floorThickness, depth: rd },
    scene,
  );
  ceiling.position.y = wallHeight - floorThickness / 2;

  const ceilingMat = new BABYLON.PBRMaterial("ceilingMat", scene);
  ceilingMat.albedoColor = new BABYLON.Color3(0.96, 0.96, 0.96);
  ceilingMat.roughness = 0.95;
  ceilingMat.metallic = 0;
  ceiling.material = ceilingMat;
  ceiling.metadata = { side: "ceiling" };

  // Wall Material
  const interiorColor = new BABYLON.Color3(...MATERIAL_CONFIG.interior.color);
  const wallMat = new BABYLON.PBRMaterial("wallMat", scene);
  wallMat.albedoColor = interiorColor;
  wallMat.roughness = MATERIAL_CONFIG.interior.roughness;
  wallMat.metallic = MATERIAL_CONFIG.interior.metallic;
  wallMat.backFaceCulling = false;

  const walls: BABYLON.Mesh[] = [];

  // Back Wall
  const backWall = BABYLON.MeshBuilder.CreateBox(
    "wall_back",
    { width: rw + wallThickness * 2, height: wallHeight, depth: wallThickness },
    scene,
  );
  backWall.position.set(0, wallHeight / 2, rd / 2 + wallThickness / 2);
  backWall.material = wallMat;
  backWall.metadata = { side: "back" };
  walls.push(backWall);

  // Front Wall
  const frontWall = BABYLON.MeshBuilder.CreateBox(
    "wall_front",
    { width: rw + wallThickness * 2, height: wallHeight, depth: wallThickness },
    scene,
  );
  frontWall.position.set(0, wallHeight / 2, -rd / 2 - wallThickness / 2);
  frontWall.material = wallMat;
  frontWall.metadata = { side: "front" };
  walls.push(frontWall);

  // Left Wall
  const leftWall = BABYLON.MeshBuilder.CreateBox(
    "wall_left",
    { width: wallThickness, height: wallHeight, depth: rd },
    scene,
  );
  leftWall.position.set(-rw / 2 - wallThickness / 2, wallHeight / 2, 0);
  leftWall.material = wallMat;
  leftWall.metadata = { side: "left" };
  walls.push(leftWall);

  // Right Wall
  const rightWall = BABYLON.MeshBuilder.CreateBox(
    "wall_right",
    { width: wallThickness, height: wallHeight, depth: rd },
    scene,
  );
  rightWall.position.set(rw / 2 + wallThickness / 2, wallHeight / 2, 0);
  rightWall.material = wallMat;
  rightWall.metadata = { side: "right" };
  walls.push(rightWall);

  walls.push(ceiling);

  // Setup shadows
  walls.forEach((wall) => {
    wall.receiveShadows = true;
  });
  ceiling.receiveShadows = true;
  floorVinyl.receiveShadows = true;

  return { walls, floorVinyl, ceiling };
};
