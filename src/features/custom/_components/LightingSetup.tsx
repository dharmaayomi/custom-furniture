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

  //   // Debug Helpers
  const utilLayer = new BABYLON.UtilityLayerRenderer(scene);

  // Helper function to create light gizmo
  const createLightGizmo = (light: BABYLON.Light, color: BABYLON.Color3) => {
    const gizmo = new BABYLON.LightGizmo(utilLayer);
    gizmo.light = light;
    gizmo.material.emissiveColor = color;
  };

  // Helper function to create position marker
  const createPositionMarker = (
    position: BABYLON.Vector3,
    color: BABYLON.Color3,
    name: string,
  ) => {
    const sphere = BABYLON.MeshBuilder.CreateSphere(
      `${name}_marker`,
      { diameter: 20 },
      scene,
    );
    sphere.position = position.clone();
    const mat = new BABYLON.StandardMaterial(`${name}_mat`, scene);
    mat.emissiveColor = color;
    mat.disableLighting = true;
    sphere.material = mat;
    return sphere;
  };

  // Helper function to create direction arrow for directional/spot lights
  const createDirectionArrow = (
    position: BABYLON.Vector3,
    direction: BABYLON.Vector3,
    color: BABYLON.Color3,
    name: string,
  ) => {
    const arrow = BABYLON.MeshBuilder.CreateCylinder(
      `${name}_arrow`,
      { height: 100, diameter: 5 },
      scene,
    );
    const cone = BABYLON.MeshBuilder.CreateCylinder(
      `${name}_cone`,
      { height: 30, diameterTop: 0, diameterBottom: 15 },
      scene,
    );
    cone.parent = arrow;
    cone.position.y = 65;

    arrow.position = position.clone();

    // Calculate rotation to point in direction
    const up = new BABYLON.Vector3(0, 1, 0);
    const angle = Math.acos(BABYLON.Vector3.Dot(up, direction.normalize()));
    const axis = BABYLON.Vector3.Cross(up, direction.normalize());
    if (axis.length() > 0) {
      arrow.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, angle);
    }

    const mat = new BABYLON.StandardMaterial(`${name}_mat`, scene);
    mat.emissiveColor = color;
    mat.disableLighting = true;
    arrow.material = mat;
    cone.material = mat;

    return arrow;
  };

  // Create debug visualizations
  createLightGizmo(ceilingLamp, new BABYLON.Color3(1, 1, 0));
  createPositionMarker(
    ceilingLamp.position,
    new BABYLON.Color3(1, 1, 0),
    "ceiling1",
  );

  createLightGizmo(fillLight, new BABYLON.Color3(0.5, 0.5, 1));
  createDirectionArrow(
    new BABYLON.Vector3(0, wallHeight - 100, 0),
    fillLight.direction,
    new BABYLON.Color3(0.5, 0.5, 1),
    "fillLight",
  );

  createLightGizmo(mainSpot, new BABYLON.Color3(1, 0, 0));
  createDirectionArrow(
    mainSpot.position,
    mainSpot.direction,
    new BABYLON.Color3(1, 0, 0),
    "mainSpot",
  );

  createLightGizmo(spot2, new BABYLON.Color3(0, 1, 0));
  createDirectionArrow(
    spot2.position,
    spot2.direction,
    new BABYLON.Color3(0, 1, 0),
    "spot2",
  );

  createLightGizmo(spot3, new BABYLON.Color3(1, 0, 1));
  createDirectionArrow(
    spot3.position,
    spot3.direction,
    new BABYLON.Color3(1, 0, 1),
    "spot3",
  );

  return {
    ceilingLamp,
  };
};
