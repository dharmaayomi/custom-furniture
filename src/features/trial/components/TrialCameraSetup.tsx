import * as BABYLON from "@babylonjs/core";

import { TRIAL_CAMERA_CONFIG } from "./TrialConfig";

export const setupTrialCamera = (
  canvas: HTMLCanvasElement,
  scene: BABYLON.Scene,
) => {
  const camera = new BABYLON.ArcRotateCamera(
    "trial-camera",
    TRIAL_CAMERA_CONFIG.alpha,
    TRIAL_CAMERA_CONFIG.beta,
    TRIAL_CAMERA_CONFIG.radius,
    new BABYLON.Vector3(0, TRIAL_CAMERA_CONFIG.targetY, 0),
    scene,
  );

  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = TRIAL_CAMERA_CONFIG.lowerRadiusLimit;
  camera.upperRadiusLimit = TRIAL_CAMERA_CONFIG.upperRadiusLimit;
  camera.lowerBetaLimit = TRIAL_CAMERA_CONFIG.lowerBetaLimit;
  camera.upperBetaLimit = TRIAL_CAMERA_CONFIG.upperBetaLimit;
  camera.wheelPrecision = TRIAL_CAMERA_CONFIG.wheelPrecision;
  camera.panningSensibility = 140;
  camera.useAutoRotationBehavior = false;

  scene.activeCamera = camera;

  return camera;
};
