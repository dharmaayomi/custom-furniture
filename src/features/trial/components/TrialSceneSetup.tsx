import * as BABYLON from "@babylonjs/core";

import { TRIAL_ROOM_CONFIG } from "./TrialConfig";
import { setupTrialCamera } from "./TrialCameraSetup";
import { setupTrialLighting } from "./TrialLightingSetup";
import { setupTrialRoom } from "./TrialRoomSetup";

const setupTrialAutoHideWalls = (
  scene: BABYLON.Scene,
  walls: BABYLON.Mesh[],
  camera: BABYLON.ArcRotateCamera,
) => {
  const rw = TRIAL_ROOM_CONFIG.width;
  const wallThickness = TRIAL_ROOM_CONFIG.wallThickness;

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
      } else {
        wall.visibility = 1;
      }
    });
  });
};

export const initTrialRoom = (canvas: HTMLCanvasElement) => {
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.95, 0.96, 0.98, 1);

  const camera = setupTrialCamera(canvas, scene);
  const { ceilingLamp } = setupTrialLighting(scene);
  const room = setupTrialRoom(scene);

  const autoHideObserver = setupTrialAutoHideWalls(scene, room.walls, camera);

  // [
  //   room.backWall,
  //   room.frontWall,
  //   room.leftWall,
  //   room.rightWall,
  //   room.ceiling,
  //   room.floor,
  // ].forEach((mesh) => {
  //   shadowGenerator.addShadowCaster(mesh, false);
  // });

  engine.runRenderLoop(() => {
    scene.render();
  });

  const handleResize = () => {
    engine.resize();
  };

  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
    scene.onBeforeRenderObservable.remove(autoHideObserver);
    scene.dispose();
    engine.dispose();
  };
};
