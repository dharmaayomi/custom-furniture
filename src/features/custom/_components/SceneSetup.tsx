import * as BABYLON from "@babylonjs/core";
import { setupCamera } from "./CameraSetup";
import { setupLighting } from "./LightingSetup";
import { setupPointerInteractions } from "./MeshUtils_WallSnap";
import { CONFIG } from "./RoomConfig";

/**
 * Create debug helpers to visualize room bounds
 */
const createDebugHelpers = (scene: BABYLON.Scene) => {
  const { rw, rd } = CONFIG;

  // Create lines to show room boundaries on floor
  const points = [
    new BABYLON.Vector3(-rw / 2, 1, -rd / 2), // Front-left
    new BABYLON.Vector3(rw / 2, 1, -rd / 2), // Front-right
    new BABYLON.Vector3(rw / 2, 1, rd / 2), // Back-right
    new BABYLON.Vector3(-rw / 2, 1, rd / 2), // Back-left
    new BABYLON.Vector3(-rw / 2, 1, -rd / 2), // Close the loop
  ];

  const lines = BABYLON.MeshBuilder.CreateLines(
    "roomBounds",
    { points },
    scene,
  );
  lines.isPickable = false;

  // Add text labels for walls
  console.log("=== ROOM DEBUG INFO ===");
  console.log("Room Width (X):", rw, "(-" + rw / 2 + " to +" + rw / 2 + ")");
  console.log("Room Depth (Z):", rd, "(-" + rd / 2 + " to +" + rd / 2 + ")");
  console.log("Back Wall: Z =", rd / 2);
  console.log("Front Wall: Z =", -rd / 2);
  console.log("Right Wall: X =", rw / 2);
  console.log("Left Wall: X =", -rw / 2);
  console.log("=====================");

  // Add axis helper at center
  const axisSize = 100;
  const axisX = BABYLON.MeshBuilder.CreateLines(
    "axisX",
    {
      points: [
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(axisSize, 0, 0),
      ],
    },
    scene,
  );
  axisX.color = new BABYLON.Color3(1, 0, 0); // Red = X

  const axisY = BABYLON.MeshBuilder.CreateLines(
    "axisY",
    {
      points: [
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(0, axisSize, 0),
      ],
    },
    scene,
  );
  axisY.color = new BABYLON.Color3(0, 1, 0); // Green = Y

  const axisZ = BABYLON.MeshBuilder.CreateLines(
    "axisZ",
    {
      points: [
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(0, 0, axisSize),
      ],
    },
    scene,
  );
  axisZ.color = new BABYLON.Color3(0, 0, 1); // Blue = Z

  // Make them not pickable
  axisX.isPickable = false;
  axisY.isPickable = false;
  axisZ.isPickable = false;
};

/**
 * Create and initialize the complete scene with auto-snap system
 */
// export const createScene = (
//   canvas: HTMLCanvasElement,
//   engine: BABYLON.Engine,
// ) => {
//   const scene = new BABYLON.Scene(engine);
//   scene.clearColor = new BABYLON.Color4(0.96, 0.96, 0.96, 1);

//   // scene.environmentIntensity = 0.8;

//   // // Image Processing
//   // scene.imageProcessingConfiguration.exposure = 1.8;
//   // scene.imageProcessingConfiguration.contrast = 1.1;
//   // scene.imageProcessingConfiguration.toneMappingEnabled = true;
//   // scene.imageProcessingConfiguration.toneMappingType =
//   //   BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;

//   console.log("🎯 Scene initialized with Auto-Snap system");

//   // Setup camera (fixed smooth camera)
//   const camera = setupCamera(canvas, scene);

//   // Setup lighting
//   const { ceilingLamp } = setupLighting(scene);

//   // Setup room (floor, walls, ceiling)
//   const { walls, floorVinyl, ceiling } = setupRoom(scene);

//   // Setup shadow generator
//   const shadowGen = new BABYLON.ShadowGenerator(2048, ceilingLamp);
//   shadowGen.useBlurExponentialShadowMap = true;
//   shadowGen.blurKernel = 64;
//   shadowGen.setDarkness(0.35);
//   shadowGen.addShadowCaster(ceiling);

//   // Setup pointer interactions
//   setupPointerInteractions(scene, canvas);

//   // Setup auto-hide walls
//   setupAutoHideWalls(scene, walls, camera);

//   // Add debug helpers
//   createDebugHelpers(scene);

//   return scene;
// };

export const createScene = (
  canvas: HTMLCanvasElement,
  engine: BABYLON.Engine,
) => {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.96, 0.96, 0.96, 1);

  // Setup camera
  const camera = setupCamera(canvas, scene);

  // Setup lighting
  const { ceilingLamp } = setupLighting(scene);

  // Setup shadow generator (Tanpa menambahkan ceiling dulu)
  const shadowGen = new BABYLON.ShadowGenerator(2048, ceilingLamp);
  shadowGen.useBlurExponentialShadowMap = true;
  shadowGen.blurKernel = 30;
  shadowGen.setDarkness(0.15);

  // Setup pointer interactions
  setupPointerInteractions(scene, canvas);

  // RETURN object references
  return { scene, camera, shadowGen };
};
