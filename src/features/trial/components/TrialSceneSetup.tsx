import * as BABYLON from "@babylonjs/core";

import { setupTrialCamera } from "./TrialCameraSetup";
import { setupTrialLighting } from "./TrialLightingSetup";
import { loadProductBase } from "./TrialModelLoader";
import { setupTrialRoom } from "./TrialRoomSetup";

const setupTrialAutoHideWalls = (
  scene: BABYLON.Scene,
  walls: BABYLON.Mesh[],
  camera: BABYLON.ArcRotateCamera,
) => {
  return scene.onBeforeRenderObservable.add(() => {
    walls.forEach((wall) => {
      if (!wall.metadata) return;

      const cam = camera.position;
      const offset = 0;

      if (wall.metadata.side === "back" && cam.z > wall.position.z + offset) {
        wall.visibility = 0;
      } else if (
        wall.metadata.side === "front" &&
        cam.z < wall.position.z - offset
      ) {
        wall.visibility = 0;
      } else if (
        wall.metadata.side === "left" &&
        cam.x < wall.position.x - offset
      ) {
        wall.visibility = 0;
      } else if (
        wall.metadata.side === "right" &&
        cam.x > wall.position.x + offset
      ) {
        wall.visibility = 0;
      } else if (wall.metadata.side === "ceiling" && cam.y > wall.position.y) {
        wall.visibility = 0;
      } else if (wall.metadata.side === "floor" && cam.y < wall.position.y) {
        wall.visibility = 0;
      } else {
        wall.visibility = 1;
      }
    });
  });
};

export const initTrialRoom = (canvas: HTMLCanvasElement) => {
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.95, 0.96, 0.96, 1);

  const camera = setupTrialCamera(canvas, scene);
  const { shadowGenerator } = setupTrialLighting(scene);
  const room = setupTrialRoom(scene);
  let loadedModel: { dispose: () => void } | null = null;
  let isDisposed = false;

  void loadProductBase(scene, shadowGenerator).then((result) => {
    if (isDisposed) {
      result?.dispose();
      return;
    }
    loadedModel = result;
  });

  const autoHideObserver = setupTrialAutoHideWalls(scene, room.walls, camera);

  [
    room.backWall,
    room.frontWall,
    room.leftWall,
    room.rightWall,
    room.ceiling,
    room.innerBackWall,
    room.innerFrontWall,
    room.innerLeftWall,
    room.innerRightWall,
    room.innerCeiling,
  ].forEach((mesh) => {
    shadowGenerator.addShadowCaster(mesh, false);
  });

  scene.imageProcessingConfiguration.toneMappingEnabled = true;
  scene.imageProcessingConfiguration.toneMappingType =
    BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
  scene.imageProcessingConfiguration.exposure = 1.1;
  scene.imageProcessingConfiguration.contrast = 1.35;
  engine.runRenderLoop(() => {
    scene.render();
  });

  const handleResize = () => {
    engine.resize();
  };

  window.addEventListener("resize", handleResize);

  return () => {
    isDisposed = true;
    window.removeEventListener("resize", handleResize);
    scene.onBeforeRenderObservable.remove(autoHideObserver);
    loadedModel?.dispose();
    scene.dispose();
    engine.dispose();
  };
};
