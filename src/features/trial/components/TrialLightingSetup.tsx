import * as BABYLON from "@babylonjs/core";

import {
  TRIAL_LIGHTING_CONFIG,
  TRIAL_ROOM_CONFIG,
} from "./TrialConfig";

export const setupTrialLighting = (scene: BABYLON.Scene) => {
  const ambientLight = new BABYLON.HemisphericLight(
    "trial-ambient",
    new BABYLON.Vector3(0, 1, 0),
    scene,
  );
  ambientLight.intensity = TRIAL_LIGHTING_CONFIG.ambientIntensity;
  ambientLight.diffuse = new BABYLON.Color3(1, 0.98, 0.94);
  ambientLight.groundColor = new BABYLON.Color3(0.5, 0.5, 0.55);

  const ceilingLamp = new BABYLON.PointLight(
    "trial-ceiling-lamp",
    new BABYLON.Vector3(0, TRIAL_ROOM_CONFIG.height - 0.35, 0),
    scene,
  );
  ceilingLamp.intensity = TRIAL_LIGHTING_CONFIG.pointIntensity;
  ceilingLamp.range = TRIAL_LIGHTING_CONFIG.pointRange;
  ceilingLamp.diffuse = new BABYLON.Color3(1, 0.96, 0.9);

  const sunlight = new BABYLON.DirectionalLight(
    "trial-sunlight",
    new BABYLON.Vector3(-0.3, -1, 0.2),
    scene,
  );
  sunlight.position = new BABYLON.Vector3(3, TRIAL_ROOM_CONFIG.height + 2, -4);
  sunlight.intensity = TRIAL_LIGHTING_CONFIG.directionalIntensity;
  sunlight.diffuse = new BABYLON.Color3(1, 0.97, 0.92);

  const shadowGenerator = new BABYLON.ShadowGenerator(1024, ceilingLamp);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 24;
  shadowGenerator.setDarkness(0.18);

  return {
    ambientLight,
    ceilingLamp,
    sunlight,
    shadowGenerator,
  };
};
