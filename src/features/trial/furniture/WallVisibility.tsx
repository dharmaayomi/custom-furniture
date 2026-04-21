import * as BABYLON from "@babylonjs/core";

export const setupTrialAutoHideWalls = (
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
