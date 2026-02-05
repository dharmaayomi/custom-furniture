import * as BABYLON from "@babylonjs/core";
import { CONFIG, LIGHTING_CONFIG, ROOM_DIMENSIONS } from "./RoomConfig";
import { useRoomStore } from "@/store/useRoomStore";

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
    new BABYLON.Vector3(0, wallHeight - 0.1, 0),
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
    new BABYLON.Vector3(0, wallHeight + 0.9, 0),
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
    new BABYLON.Vector3(-rw / 4, wallHeight, 0),
    new BABYLON.Vector3(-1, -1.1, 0),
    Math.PI / 0.9, // semakin kecil semakin lebar
    2,
    scene,
  );
  spot2.intensity = 1.5; // Naikkan karena lampu dikurangi
  spot2.diffuse = new BABYLON.Color3(1, 0.93, 0.8);
  spot2.range = 25;
  spot2.exponent = 1.5;

  // Spot Light Kanan
  const spot3 = new BABYLON.SpotLight(
    "spot3",
    new BABYLON.Vector3(rw / 4, wallHeight, 0),
    new BABYLON.Vector3(1, -1.1, 0),
    Math.PI / 0.9, // LEBIH LEBAR (≈ 82°)
    2,
    scene,
  );
  spot3.intensity = 1.5;
  spot3.diffuse = new BABYLON.Color3(1, 0.93, 0.8);
  spot3.range = 25;
  spot3.exponent = 1.5;

  // ========== HELPERS ==========
  // createLightHelpers(scene, {
  //   ceilingLamp,
  //   fillLight,
  //   fillLight2,
  //   mainSpot,
  //   spot2,
  //   spot3,
  // });

  return {
    ceilingLamp,
    // shadowGenerator,
  };
};

// Helper function untuk menampilkan visualisasi lampu
const createLightHelpers = (
  scene: BABYLON.Scene,
  lights: {
    ceilingLamp: BABYLON.PointLight;
    fillLight: BABYLON.DirectionalLight;
    fillLight2: BABYLON.DirectionalLight;
    mainSpot: BABYLON.SpotLight;
    spot2: BABYLON.SpotLight;
    spot3: BABYLON.SpotLight;
  },
) => {
  // Helper untuk Point Light (Ceiling Lamp)
  const ceilingSphere = BABYLON.MeshBuilder.CreateSphere(
    "ceilingHelper",
    { diameter: 0.2 },
    scene,
  );
  ceilingSphere.position = lights.ceilingLamp.position.clone();
  const ceilingMat = new BABYLON.StandardMaterial("ceilingHelperMat", scene);
  ceilingMat.emissiveColor = new BABYLON.Color3(1, 1, 0);
  ceilingMat.alpha = 0.5;
  ceilingSphere.material = ceilingMat;

  // Helper untuk Directional Lights (Fill Lights)
  createDirectionalHelper(
    scene,
    lights.fillLight,
    "fillLightHelper",
    new BABYLON.Color3(0, 1, 1),
  );
  createDirectionalHelper(
    scene,
    lights.fillLight2,
    "fillLight2Helper",
    new BABYLON.Color3(0, 0.8, 1),
  );

  // Helper untuk Spot Lights
  createSpotHelper(
    scene,
    lights.mainSpot,
    "mainSpotHelper",
    new BABYLON.Color3(1, 0.5, 0),
  );
  createSpotHelper(
    scene,
    lights.spot2,
    "spot2Helper",
    new BABYLON.Color3(1, 0, 0),
  );
  createSpotHelper(
    scene,
    lights.spot3,
    "spot3Helper",
    new BABYLON.Color3(0, 1, 0),
  );
};

// Helper untuk Directional Light
const createDirectionalHelper = (
  scene: BABYLON.Scene,
  light: BABYLON.DirectionalLight,
  name: string,
  color: BABYLON.Color3,
) => {
  const position = new BABYLON.Vector3(0, 2, 0);

  // Sphere di posisi awal
  const sphere = BABYLON.MeshBuilder.CreateSphere(
    name + "Sphere",
    { diameter: 0.15 },
    scene,
  );
  sphere.position = position;

  // Arrow menunjukkan arah
  const direction = light.direction.normalize();
  const arrowLength = 1;
  const arrow = BABYLON.MeshBuilder.CreateCylinder(
    name + "Arrow",
    { height: arrowLength, diameter: 0.05 },
    scene,
  );
  arrow.position = position.add(direction.scale(arrowLength / 2));

  // Rotate arrow to point in direction
  const up = BABYLON.Vector3.Up();
  const angle = Math.acos(BABYLON.Vector3.Dot(up, direction));
  const axis = BABYLON.Vector3.Cross(up, direction).normalize();
  if (axis.length() > 0) {
    arrow.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, angle);
  }

  // Material
  const mat = new BABYLON.StandardMaterial(name + "Mat", scene);
  mat.emissiveColor = color;
  mat.alpha = 0.6;
  sphere.material = mat;
  arrow.material = mat;
};

// Helper untuk Spot Light
const createSpotHelper = (
  scene: BABYLON.Scene,
  light: BABYLON.SpotLight,
  name: string,
  color: BABYLON.Color3,
) => {
  // Sphere di posisi lampu
  const sphere = BABYLON.MeshBuilder.CreateSphere(
    name + "Sphere",
    { diameter: 0.15 },
    scene,
  );
  sphere.position = light.position.clone();

  // Cone menunjukkan arah dan angle
  const direction = light.direction.normalize();
  const coneHeight = 0.8;
  const cone = BABYLON.MeshBuilder.CreateCylinder(
    name + "Cone",
    {
      height: coneHeight,
      diameterTop: 0,
      diameterBottom: Math.tan(light.angle) * coneHeight * 2,
    },
    scene,
  );
  cone.position = light.position.add(direction.scale(coneHeight / 2));

  // Rotate cone to point in direction
  const up = BABYLON.Vector3.Up();
  const angle = Math.acos(BABYLON.Vector3.Dot(up, direction));
  const axis = BABYLON.Vector3.Cross(up, direction).normalize();
  if (axis.length() > 0) {
    cone.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, angle);
  }

  // Material
  const mat = new BABYLON.StandardMaterial(name + "Mat", scene);
  mat.emissiveColor = color;
  mat.alpha = 0.3;
  mat.wireframe = true;
  sphere.material = mat;
  cone.material = mat;
};
