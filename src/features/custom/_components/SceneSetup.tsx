import * as BABYLON from "@babylonjs/core";
import { setupCamera } from "./CameraSetup";
import { setupLighting } from "./LightingSetup";
import { setupPointerInteractions } from "./MeshUtils_WallSnap";
import { CONFIG } from "./RoomConfig";

/**
 * Create and initialize the complete scene with auto-snap system
 */

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

  // Inisialisasi Highlight Layer
  const hl = new BABYLON.HighlightLayer("hl1", scene);

  // Setup pointer interactions
  setupPointerInteractions(scene, canvas);

  // RETURN object references
  return { scene, camera, shadowGen, hl };
};
