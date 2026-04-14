import { setupCamera } from "@/features/custom/_components/CameraSetup";
import { setupLighting } from "@/features/custom/_components/LightingSetup";
import * as BABYLON from "@babylonjs/core";

export const createSceneTrial = (
  canvas: HTMLCanvasElement,
  engine: BABYLON.Engine,
) => {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.96, 0.96, 0.96, 1);

  const camera = setupCamera(canvas, scene);

  const { ceilingLamp } = setupLighting(scene);
  if (!scene.metadata) scene.metadata = {};
  scene.metadata.allowedLightIds = scene.lights.map((l) => l.uniqueId);

  const shadowGen = new BABYLON.ShadowGenerator(2048, ceilingLamp);
  shadowGen.useBlurExponentialShadowMap = true;
  shadowGen.blurKernel = 30;
  shadowGen.setDarkness(0.15);

  const hl = new BABYLON.HighlightLayer("hl1", scene);

  return { scene, camera, shadowGen, hl };
};
