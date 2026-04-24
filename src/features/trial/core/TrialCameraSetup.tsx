import * as BABYLON from "@babylonjs/core";
import {
  TRIAL_CAMERA_CONFIG,
  TRIAL_ROOM_CONFIG,
  TrialRoomConfig,
} from "./TrialConfig";

// export const setupTrialCamera = (
//   canvas: HTMLCanvasElement,
//   scene: BABYLON.Scene,
//   roomConfig: TrialRoomConfig,
// ): BABYLON.ArcRotateCamera => {
//   let zoomTarget = new BABYLON.Vector3(0, TRIAL_CAMERA_CONFIG.targetY, 0);
//   const getPointerInput = () =>
//     camera.inputs.attached["pointers"] as
//       | BABYLON.ArcRotateCameraPointersInput
//       | undefined;

//   const ensureCameraInputAttached = () => {
//     const pointerInput = getPointerInput();
//     if (!pointerInput?.buttons.length) {
//       return;
//     }

//     if (!camera.inputs.attachedToElement) {
//       camera.attachControl(canvas, true);
//     }
//   };

//   const clampZoomTarget = (point: BABYLON.Vector3) => {
//     const margin = 0.5;
//     const halfW = roomConfig.width / 2 - margin;
//     const halfD = roomConfig.depth / 2 - margin;
//     point.x = BABYLON.Scalar.Clamp(point.x, -halfW, halfW);
//     point.z = BABYLON.Scalar.Clamp(point.z, -halfD, halfD);
//     point.y = BABYLON.Scalar.Clamp(
//       point.y,
//       roomConfig.floorThickness + margin,
//       roomConfig.height - roomConfig.wallThickness - margin,
//     );
//   };
//   const updateZoomTargetFromPointer = () => {
//     const pick = scene.pick(
//       scene.pointerX,
//       scene.pointerY,
//       // (mesh) => mesh.isPickable && mesh.isVisible && mesh.visibility > 0,
//       (mesh) => mesh.isPickable && mesh.metadata?.kind !== "bounding-box",
//     );

//     if (!pick?.hit || !pick.pickedPoint) {
//       return;
//     }

//     zoomTarget.copyFrom(pick.pickedPoint);
//     clampZoomTarget(zoomTarget);
//   };

//   const camera = new BABYLON.ArcRotateCamera(
//     "camera",
//     TRIAL_CAMERA_CONFIG.alpha,
//     TRIAL_CAMERA_CONFIG.beta,
//     TRIAL_CAMERA_CONFIG.radius,
//     new BABYLON.Vector3(0, TRIAL_CAMERA_CONFIG.targetY, 0),
//     scene,
//   );

//   camera.attachControl(canvas, true);

//   camera.mapPanning = true;
//   camera.useAutoRotationBehavior = false;
//   camera.zoomToMouseLocation = false;
//   camera.wheelDeltaPercentage = 0.01;
//   camera.panningSensibility = 200;
//   scene.activeCamera = camera;

//   // ===== Limits =====
//   camera.wheelPrecision = TRIAL_CAMERA_CONFIG.wheelPrecision;
//   camera.lowerBetaLimit = TRIAL_CAMERA_CONFIG.lowerBetaLimit;
//   camera.upperBetaLimit = TRIAL_CAMERA_CONFIG.upperBetaLimit;
//   camera.lowerRadiusLimit = TRIAL_CAMERA_CONFIG.lowerRadiusLimit;
//   camera.upperRadiusLimit = TRIAL_CAMERA_CONFIG.upperRadiusLimit;
//   camera.minZ = 0.02;
//   camera.maxZ = 100;

//   scene.onPrePointerObservable.add((pointerInfo) => {
//     if (pointerInfo.type !== BABYLON.PointerEventTypes.POINTERWHEEL) {
//       return;
//     }

//     ensureCameraInputAttached();

//     const wheelEvent = pointerInfo.event as WheelEvent;
//     const isZoomingIn = wheelEvent.deltaY < 0;

//     if (isZoomingIn) {
//       updateZoomTargetFromPointer();
//     } else {
//       zoomTarget.copyFrom(camera.target);

//       // Saat zoom out & radius mentok di lower limit,
//       // nudge radius biar wheel event ga "nyangkut"
//       const lowerLimit = camera.lowerRadiusLimit ?? 0.1;
//       if (camera.radius <= lowerLimit + 0.05) {
//         camera.radius = lowerLimit + 0.1;
//       }
//     }
//   });

//   scene.onBeforeRenderObservable.add(() => {
//     const lowerLimit = camera.lowerRadiusLimit ?? 0.1;
//     const upperLimit = camera.upperRadiusLimit ?? 15;

//     const t = BABYLON.Scalar.Clamp(
//       (camera.radius - lowerLimit) / (upperLimit - lowerLimit),
//       0,
//       1,
//     );

//     camera.panningSensibility = BABYLON.Scalar.Lerp(10000, 500, t);

//     camera.pinchPrecision = BABYLON.Scalar.Lerp(100, 10, t);
//     BABYLON.Vector3.LerpToRef(camera.target, zoomTarget, 0.1, camera.target);
//     if (camera.radius > lowerLimit + 0.5) {
//       camera.target.y = BABYLON.Scalar.Lerp(
//         camera.target.y,
//         TRIAL_CAMERA_CONFIG.targetY,
//         0.03,
//       );
//     }
//     if (isPanning) {
//       zoomTarget.copyFrom(camera.target);
//     } else {
//       BABYLON.Vector3.LerpToRef(camera.target, zoomTarget, 0.1, camera.target);
//       if (camera.radius > lowerLimit + 0.5) {
//         camera.target.y = BABYLON.Scalar.Lerp(
//           camera.target.y,
//           TRIAL_CAMERA_CONFIG.targetY,
//           0.03,
//         );
//       }
//     }
//   });

//   let isPointerDown = false;
//   let lastPointerY = 0;
//   let isPanning = false;

//   scene.onPointerObservable.add((pointerInfo) => {
//     switch (pointerInfo.type) {
//       case BABYLON.PointerEventTypes.POINTERDOWN:
//         ensureCameraInputAttached();
//         isPointerDown = true;
//         lastPointerY = scene.pointerY;
//         if ((pointerInfo.event as PointerEvent).button === 2) {
//           isPanning = true;
//         }
//         break;

//       case BABYLON.PointerEventTypes.POINTERUP:
//         ensureCameraInputAttached();
//         isPointerDown = false;
//         break;

//       case BABYLON.PointerEventTypes.POINTERMOVE:
//         if (!isPointerDown) return;
//         lastPointerY = scene.pointerY;
//         break;
//     }
//   });

//   // ===== Smooth zoom in =====
//   const zoomInAnimation = new BABYLON.Animation(
//     "cameraZoomIn",
//     "radius",
//     60,
//     BABYLON.Animation.ANIMATIONTYPE_FLOAT,
//     BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
//   );

//   zoomInAnimation.setKeys([
//     { frame: 0, value: 6 },
//     { frame: 90, value: TRIAL_CAMERA_CONFIG.zoomInRadius },
//   ]);

//   const easing = new BABYLON.CubicEase();
//   easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
//   zoomInAnimation.setEasingFunction(easing);
//   camera.animations.push(zoomInAnimation);
//   scene.beginAnimation(camera, 0, 90, false);

//   scene.getEngine().onResizeObservable.add(() => {});

//   return camera;
// };
export const setupTrialCamera = (
  canvas: HTMLCanvasElement,
  scene: BABYLON.Scene,
  roomConfig: TrialRoomConfig,
): BABYLON.ArcRotateCamera => {
  let zoomTarget = new BABYLON.Vector3(0, TRIAL_CAMERA_CONFIG.targetY, 0);

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
  camera.zoomToMouseLocation = false;
  camera.wheelDeltaPercentage = 0.01;
  scene.activeCamera = camera;

  camera.wheelPrecision = TRIAL_CAMERA_CONFIG.wheelPrecision;
  camera.lowerBetaLimit = TRIAL_CAMERA_CONFIG.lowerBetaLimit;
  camera.upperBetaLimit = TRIAL_CAMERA_CONFIG.upperBetaLimit;
  camera.lowerRadiusLimit = TRIAL_CAMERA_CONFIG.lowerRadiusLimit;
  camera.upperRadiusLimit = TRIAL_CAMERA_CONFIG.upperRadiusLimit;
  camera.minZ = 0.02;
  camera.maxZ = 100;

  // ===== Helper: cek posisi kamera =====
  const isCameraInsideRoom = () => {
    const pos = camera.position;
    const halfW = TRIAL_ROOM_CONFIG.width / 2;
    const halfD = TRIAL_ROOM_CONFIG.depth / 2;
    return (
      pos.x > -halfW &&
      pos.x < halfW &&
      pos.z > -halfD &&
      pos.z < halfD &&
      pos.y > 0 &&
      pos.y < TRIAL_ROOM_CONFIG.height
    );
  };

  // ===== Zoom to pointer =====
  scene.onPrePointerObservable.add((pointerInfo) => {
    if (pointerInfo.type !== BABYLON.PointerEventTypes.POINTERWHEEL) return;

    const wheelEvent = pointerInfo.event as WheelEvent;
    const isZoomingIn = wheelEvent.deltaY < 0;

    if (isZoomingIn) {
      if (!isCameraInsideRoom()) {
        zoomTarget.set(0, TRIAL_CAMERA_CONFIG.targetY, 0);
      } else {
        const pick = scene.pick(
          scene.pointerX,
          scene.pointerY,
          (mesh) => mesh.isPickable && mesh.metadata?.kind !== "bounding-box",
        );
        if (pick?.hit && pick.pickedPoint) {
          zoomTarget.copyFrom(pick.pickedPoint);
        }
      }
    } else {
      zoomTarget.copyFrom(camera.target);
      const lowerLimit = camera.lowerRadiusLimit ?? 0.1;
      if (camera.radius <= lowerLimit + 0.05) {
        camera.radius = lowerLimit + 0.1;
      }
    }
  });

  // ===== Pan fix =====
  let isPanning = false;
  let isPointerDown = false;

  scene.onPointerObservable.add((pointerInfo) => {
    switch (pointerInfo.type) {
      case BABYLON.PointerEventTypes.POINTERDOWN:
        isPointerDown = true;
        if ((pointerInfo.event as PointerEvent).button === 2) isPanning = true;
        break;
      case BABYLON.PointerEventTypes.POINTERUP:
        isPointerDown = false;
        isPanning = false;
        break;
      case BABYLON.PointerEventTypes.POINTERMOVE:
        if (!isPointerDown) return;
        break;
    }
  });

  scene.onBeforeRenderObservable.add(() => {
    const lowerLimit = camera.lowerRadiusLimit ?? 0.1;
    const upperLimit = camera.upperRadiusLimit ?? 15;
    const t = BABYLON.Scalar.Clamp(
      (camera.radius - lowerLimit) / (upperLimit - lowerLimit),
      0,
      1,
    );

    camera.panningSensibility = BABYLON.Scalar.Lerp(10000, 500, t);
    camera.pinchPrecision = BABYLON.Scalar.Lerp(100, 10, t);

    if (isPanning) {
      zoomTarget.copyFrom(camera.target);
    } else {
      BABYLON.Vector3.LerpToRef(camera.target, zoomTarget, 0.1, camera.target);
      if (camera.radius > lowerLimit + 0.5) {
        camera.target.y = BABYLON.Scalar.Lerp(
          camera.target.y,
          TRIAL_CAMERA_CONFIG.targetY,
          0.03,
        );
      }
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

  return camera;
};
