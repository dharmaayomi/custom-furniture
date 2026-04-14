import * as BABYLON from "@babylonjs/core";
import { setupCamera } from "@/features/custom/_components/CameraSetup";
import { setupLighting } from "@/features/custom/_components/LightingSetup";

export const initTrialRoom = (canvas: HTMLCanvasElement) => {
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.96, 0.96, 0.96, 1);

  const camera = setupCamera(canvas, scene);
  const { ceilingLamp } = setupLighting(scene);

  const shadowGen = new BABYLON.ShadowGenerator(2048, ceilingLamp);
  shadowGen.useBlurExponentialShadowMap = true;

  const roomConfig = {
    width: 4, // x
    height: 2.5, // y
    depth: 5, // z
  };

  const floor = BABYLON.MeshBuilder.CreateGround(
    "floor",
    {
      width: roomConfig.width,
      height: roomConfig.depth,
    },
    scene,
  );
  floor.receiveShadows = true;

  // Matrial sederhana untuk lantai
  const floorMat = new BABYLON.StandardMaterial("floorMat", scene);
  floorMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
  floor.material = floorMat;

  // Dinding Belakang
  const backWall = BABYLON.MeshBuilder.CreatePlane(
    "backWall",
    {
      width: roomConfig.width,
      height: roomConfig.height,
    },
    scene,
  );
  backWall.position.z = roomConfig.depth / 2;
  backWall.position.y = roomConfig.height / 2;

  // Dinding Kiri
  const leftWall = BABYLON.MeshBuilder.CreatePlane(
    "leftWall",
    {
      width: roomConfig.depth,
      height: roomConfig.height,
    },
    scene,
  );
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.x = -roomConfig.width / 2;
  leftWall.position.y = roomConfig.height / 2;

  // Set semua dinding untuk menerima shadow (mirip /custom)
  [backWall, leftWall].forEach((wall) => {
    wall.receiveShadows = true;
    const wallMat = new BABYLON.StandardMaterial("wallMat", scene);
    wallMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
    wall.material = wallMat;
  });

  // Render Loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  return { engine, scene };
};
