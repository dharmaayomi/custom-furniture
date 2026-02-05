import * as BABYLON from "@babylonjs/core";
import { CAMERA_CONFIG } from "./RoomConfig";

export const setupCamera = (
  canvas: HTMLCanvasElement,
  scene: BABYLON.Scene,
): BABYLON.ArcRotateCamera => {
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    CAMERA_CONFIG.alpha,
    CAMERA_CONFIG.beta,
    CAMERA_CONFIG.radius,
    new BABYLON.Vector3(0, CAMERA_CONFIG.targetY, 0),
    scene,
  );

  camera.attachControl(canvas, true);

  camera.mapPanning = true;
  camera.useAutoRotationBehavior = false;
  scene.activeCamera = camera;

  // ===== Limits =====
  camera.wheelPrecision = CAMERA_CONFIG.wheelPrecision;
  camera.lowerBetaLimit = CAMERA_CONFIG.lowerBetaLimit;
  camera.upperBetaLimit = CAMERA_CONFIG.upperBetaLimit;
  camera.lowerRadiusLimit = CAMERA_CONFIG.lowerRadiusLimit;
  camera.upperRadiusLimit = CAMERA_CONFIG.upperRadiusLimit;

  // scene.onBeforeRenderObservable.add(() => {
  //   const lowerLimit = camera.lowerRadiusLimit ?? 0;
  //   if (camera.radius <= lowerLimit + 0.01) {
  //     camera.panningSensibility = 250;
  //     camera.wheelPrecision = 20;
  //   } else {
  //     camera.panningSensibility = 390;
  //     camera.wheelPrecision = CAMERA_CONFIG.wheelPrecision;
  //   }
  // });

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
    { frame: 90, value: 2.5 },
  ]);

  const easing = new BABYLON.CubicEase();
  easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
  zoomInAnimation.setEasingFunction(easing);
  camera.animations.push(zoomInAnimation);
  scene.beginAnimation(camera, 0, 90, false);

  scene.getEngine().onResizeObservable.add(() => {
    // The engine.resize() method is called automatically by Babylon.js
    // No need to manually set aspect ratio
  });

  return camera;
};
