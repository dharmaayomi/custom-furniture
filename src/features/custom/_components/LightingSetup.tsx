import * as BABYLON from "@babylonjs/core";
import { CONFIG, LIGHTING_CONFIG, ROOM_DIMENSIONS } from "./RoomConfig";

export const setupLighting = (scene: BABYLON.Scene) => {
  const { rw, rd } = CONFIG;
  const { wallHeight } = ROOM_DIMENSIONS;

  // Ambient Light
  const ambientLight = new BABYLON.HemisphericLight(
    "ambient",
    new BABYLON.Vector3(0, 1, 0),
    scene,
  );
  ambientLight.intensity = LIGHTING_CONFIG.ambient.intensity;
  ambientLight.diffuse = new BABYLON.Color3(...LIGHTING_CONFIG.ambient.diffuse);
  ambientLight.groundColor = new BABYLON.Color3(
    ...LIGHTING_CONFIG.ambient.groundColor,
  );

  // Ceiling Lamp (Main)
  const ceilingLamp = new BABYLON.PointLight(
    "ceilingLamp",
    new BABYLON.Vector3(0, wallHeight - 40, 0),
    scene,
  );
  ceilingLamp.intensity = LIGHTING_CONFIG.ceilingLamp.intensity;
  ceilingLamp.diffuse = new BABYLON.Color3(
    ...LIGHTING_CONFIG.ceilingLamp.diffuse,
  );
  ceilingLamp.range = LIGHTING_CONFIG.ceilingLamp.range;

  // Ceiling Lamp 2
  const ceilingLamp2 = new BABYLON.PointLight(
    "ceilingLamp2",
    new BABYLON.Vector3(-rw / 4, wallHeight - 50, rd / 4),
    scene,
  );
  ceilingLamp2.intensity = 3.0;
  ceilingLamp2.diffuse = new BABYLON.Color3(1, 0.93, 0.8);
  ceilingLamp2.range = 1200;

  // Ceiling Lamp 3
  const ceilingLamp3 = new BABYLON.PointLight(
    "ceilingLamp3",
    new BABYLON.Vector3(rw / 4, wallHeight - 50, -rd / 4),
    scene,
  );
  ceilingLamp3.intensity = 3.0;
  ceilingLamp3.diffuse = new BABYLON.Color3(1, 0.93, 0.8);
  ceilingLamp3.range = 1200;

  // Fill Light
  const fillLight = new BABYLON.DirectionalLight(
    "fillLight",
    new BABYLON.Vector3(0, -0.5, 0.2),
    scene,
  );
  fillLight.intensity = 0.2;
  fillLight.diffuse = new BABYLON.Color3(1, 0.95, 0.88);

  // Main Spot Light
  const mainSpot = new BABYLON.SpotLight(
    "mainSpot",
    new BABYLON.Vector3(0, wallHeight - 30, 0),
    new BABYLON.Vector3(0, -1, 0),
    LIGHTING_CONFIG.mainSpot.angle,
    LIGHTING_CONFIG.mainSpot.exponent,
    scene,
  );
  mainSpot.intensity = LIGHTING_CONFIG.mainSpot.intensity;
  mainSpot.diffuse = new BABYLON.Color3(...LIGHTING_CONFIG.mainSpot.diffuse);
  mainSpot.range = LIGHTING_CONFIG.mainSpot.range;

  // Spot Light 2
  const spot2 = new BABYLON.SpotLight(
    "spot2",
    new BABYLON.Vector3(-rw / 3, wallHeight - 40, rd / 3),
    new BABYLON.Vector3(0.2, -1, 0),
    Math.PI / 3,
    3,
    scene,
  );
  spot2.intensity = 4.5;
  spot2.diffuse = new BABYLON.Color3(1, 0.93, 0.8);
  spot2.range = 600;

  // Spot Light 3
  const spot3 = new BABYLON.SpotLight(
    "spot3",
    new BABYLON.Vector3(rw / 3, wallHeight - 40, -rd / 3),
    new BABYLON.Vector3(-0.2, -1, 0),
    Math.PI / 3,
    3,
    scene,
  );
  spot3.intensity = 4.5;
  spot3.diffuse = new BABYLON.Color3(1, 0.93, 0.8);
  spot3.range = 600;

  return ceilingLamp;
};
