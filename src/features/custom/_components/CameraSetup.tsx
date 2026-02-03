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

  // ===== IKEA-style: drag DOWN = move FORWARD =====
  const prevPointerY = { value: 0 };

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

        const deltaY = scene.pointerY - lastPointerY;
        lastPointerY = scene.pointerY;

        // camera.target.y -= deltaY * 0.25;
        // camera.target.y -= deltaY * 0.08;

        // camera.target.y = BABYLON.Scalar.Clamp(
        //   camera.target.y,
        //   CAMERA_CONFIG.minTargetY,
        //   CAMERA_CONFIG.maxTargetY,
        // );
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
    { frame: 0, value: 600 },
    { frame: 90, value: 200 },
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
