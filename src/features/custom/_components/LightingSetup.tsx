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
  ambientLight.intensity = 0.5; // Naikkan untuk kompensasi lampu yang dikurangi
  ambientLight.diffuse = new BABYLON.Color3(...LIGHTING_CONFIG.ambient.diffuse);
  ambientLight.groundColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Naikkan groundColor

  // Ceiling Lamp (Main)
  const ceilingLamp = new BABYLON.PointLight(
    "ceilingLamp",
    new BABYLON.Vector3(0, wallHeight - 10, 0),
    scene,
  );
  ceilingLamp.intensity = 1.5; // Naikkan
  ceilingLamp.diffuse = new BABYLON.Color3(
    ...LIGHTING_CONFIG.ceilingLamp.diffuse,
  );
  ceilingLamp.range = LIGHTING_CONFIG.ceilingLamp.range;

  // Fill Light - HANYA 1 saja, dari depan-atas
  const fillLight = new BABYLON.DirectionalLight(
    "fillLight",
    new BABYLON.Vector3(0, -1, 0.3),
    scene,
  );
  fillLight.intensity = 0.8; // TURUNKAN dari 1.5
  fillLight.diffuse = new BABYLON.Color3(1, 0.95, 0.88);

  // Fill Light 2
  const fillLight2 = new BABYLON.DirectionalLight(
    "fillLight2",
    new BABYLON.Vector3(0, -1, -0.3),
    scene,
  );
  fillLight2.intensity = 0.8;
  fillLight2.diffuse = new BABYLON.Color3(1, 0.95, 0.88);

  // Main Spot Light
  const mainSpot = new BABYLON.SpotLight(
    "mainSpot",
    new BABYLON.Vector3(0, wallHeight - 30, 0),
    new BABYLON.Vector3(0, -1, 0),
    LIGHTING_CONFIG.mainSpot.angle,
    LIGHTING_CONFIG.mainSpot.exponent,
    scene,
  );
  mainSpot.intensity = 3.0;
  mainSpot.diffuse = new BABYLON.Color3(...LIGHTING_CONFIG.mainSpot.diffuse);
  mainSpot.range = LIGHTING_CONFIG.mainSpot.range;

  // Spot Light Kiri
  const spot2 = new BABYLON.SpotLight(
    "spot2",
    new BABYLON.Vector3(-rw / 3, wallHeight - 50, 0),
    new BABYLON.Vector3(-1, -0.9, 0),
    Math.PI / 4,
    5,
    scene,
  );
  spot2.intensity = 20.0; // Naikkan karena lampu dikurangi
  spot2.diffuse = new BABYLON.Color3(1, 0.93, 0.8);
  spot2.range = 800;

  // Spot Light Kanan
  const spot3 = new BABYLON.SpotLight(
    "spot3",
    new BABYLON.Vector3(rw / 3, wallHeight - 50, 0),
    new BABYLON.Vector3(1, -0.9, 0),
    Math.PI / 4,
    5,
    scene,
  );
  spot3.intensity = 20.0;
  spot3.diffuse = new BABYLON.Color3(1, 0.93, 0.8);
  spot3.range = 800;

  return {
    ceilingLamp,
  };
};
