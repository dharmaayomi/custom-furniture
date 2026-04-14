// import * as BABYLON from "@babylonjs/core";

// import { TRIAL_CAMERA_CONFIG } from "./TrialConfig";

// export const setupTrialCamera = (
//   canvas: HTMLCanvasElement,
//   scene: BABYLON.Scene,
// ) => {
//   const camera = new BABYLON.ArcRotateCamera(
//     "trial-camera",
//     TRIAL_CAMERA_CONFIG.alpha,
//     TRIAL_CAMERA_CONFIG.beta,
//     TRIAL_CAMERA_CONFIG.radius,
//     new BABYLON.Vector3(0, TRIAL_CAMERA_CONFIG.targetY, 0),
//     scene,
//   );

//   camera.attachControl(canvas, true);
//   camera.lowerRadiusLimit = TRIAL_CAMERA_CONFIG.lowerRadiusLimit;
//   camera.upperRadiusLimit = TRIAL_CAMERA_CONFIG.upperRadiusLimit;
//   camera.lowerBetaLimit = TRIAL_CAMERA_CONFIG.lowerBetaLimit;
//   camera.upperBetaLimit = TRIAL_CAMERA_CONFIG.upperBetaLimit;
//   camera.wheelPrecision = TRIAL_CAMERA_CONFIG.wheelPrecision;
//   camera.panningSensibility = 140;
//   camera.useAutoRotationBehavior = false;

//   scene.activeCamera = camera;

//   return camera;
// };

import * as BABYLON from "@babylonjs/core";
import { TRIAL_CAMERA_CONFIG } from "./TrialConfig";

export const setupTrialCamera = (
  canvas: HTMLCanvasElement,
  scene: BABYLON.Scene,
): BABYLON.ArcRotateCamera => {
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    TRIAL_CAMERA_CONFIG.alpha,
    TRIAL_CAMERA_CONFIG.beta,
    TRIAL_CAMERA_CONFIG.radius,
    new BABYLON.Vector3(0, TRIAL_CAMERA_CONFIG.targetY, 0),
    scene,
  );

  camera.attachControl(canvas, true);

  camera.mapPanning = true;
  camera.useAutoRotationBehavior = false;
  scene.activeCamera = camera;

  // ===== Limits =====
  camera.wheelPrecision = TRIAL_CAMERA_CONFIG.wheelPrecision;
  camera.lowerBetaLimit = TRIAL_CAMERA_CONFIG.lowerBetaLimit;
  camera.upperBetaLimit = TRIAL_CAMERA_CONFIG.upperBetaLimit;
  camera.lowerRadiusLimit = TRIAL_CAMERA_CONFIG.lowerRadiusLimit;
  camera.upperRadiusLimit = TRIAL_CAMERA_CONFIG.upperRadiusLimit;

  scene.onBeforeRenderObservable.add(() => {
    const lowerLimit = camera.lowerRadiusLimit ?? 0;
    const t = BABYLON.Scalar.Clamp((camera.radius - lowerLimit) / 1.2, 0, 1);

    camera.panningSensibility = BABYLON.Scalar.Lerp(800, 350, t);
    camera.wheelPrecision = BABYLON.Scalar.Lerp(120, 50, t);
  });

  let isPointerDown = false;
  let lastPointerY = 0;

  scene.onPointerObservable.add((pointerInfo) => {
    switch (pointerInfo.type) {
      case BABYLON.PointerEventTypes.POINTERDOWN:
        isPointerDown = true;
        lastPointerY = scene.pointerY;
        break;

      case BABYLON.PointerEventTypes.POINTERUP:
        isPointerDown = false;
        break;

      case BABYLON.PointerEventTypes.POINTERMOVE:
        if (!isPointerDown) return;

        lastPointerY = scene.pointerY;

        break;
    }
  });

  // ===== Smooth zoom in =====
  const zoomInAnimation = new BABYLON.Animation(
    "cameraZoomIn",
    "radius",
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
  );

  zoomInAnimation.setKeys([
    { frame: 0, value: 6 },
    { frame: 90, value: TRIAL_CAMERA_CONFIG.zoomInRadius },
  ]);

  const easing = new BABYLON.CubicEase();
  easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
  zoomInAnimation.setEasingFunction(easing);
  camera.animations.push(zoomInAnimation);
  scene.beginAnimation(camera, 0, 90, false);

  scene.getEngine().onResizeObservable.add(() => {});

  return camera;
};
