import * as BABYLON from "@babylonjs/core";

import { TRIAL_LIGHTING_CONFIG, TRIAL_ROOM_CONFIG } from "./TrialConfig";

const createPointHelper = (
  scene: BABYLON.Scene,
  light: BABYLON.PointLight,
  name: string,
  color: BABYLON.Color3,
) => {
  const sphere = BABYLON.MeshBuilder.CreateSphere(
    `${name}Sphere`,
    { diameter: 0.18 },
    scene,
  );
  sphere.position = light.position.clone();

  const material = new BABYLON.StandardMaterial(`${name}Mat`, scene);
  material.emissiveColor = color;
  material.alpha = 0.55;
  sphere.material = material;

  return sphere;
};

const createHemisphericHelper = (
  scene: BABYLON.Scene,
  light: BABYLON.HemisphericLight,
  name: string,
  color: BABYLON.Color3,
) => {
  const anchor = new BABYLON.Vector3(0, 2.2, 0);

  const sphere = BABYLON.MeshBuilder.CreateSphere(
    `${name}Sphere`,
    { diameter: 0.16 },
    scene,
  );
  sphere.position = anchor;

  const direction = light.direction.normalize();
  const arrowLength = 0.9;
  const arrow = BABYLON.MeshBuilder.CreateCylinder(
    `${name}Arrow`,
    { height: arrowLength, diameter: 0.05 },
    scene,
  );
  arrow.position = anchor.add(direction.scale(arrowLength / 2));

  const up = BABYLON.Vector3.Up();
  const angle = Math.acos(BABYLON.Vector3.Dot(up, direction));
  const axis = BABYLON.Vector3.Cross(up, direction).normalize();

  if (axis.length() > 0) {
    arrow.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, angle);
  }

  const material = new BABYLON.StandardMaterial(`${name}Mat`, scene);
  material.emissiveColor = color;
  material.alpha = 0.55;
  sphere.material = material;
  arrow.material = material;

  return { sphere, arrow };
};

const createLightHelpers = (
  scene: BABYLON.Scene,
  lights: {
    ambientLight: BABYLON.HemisphericLight;
    ceilingLamp: BABYLON.PointLight;
  },
) => {
  const ambientHelper = createHemisphericHelper(
    scene,
    lights.ambientLight,
    "trialAmbientHelper",
    new BABYLON.Color3(0.2, 0.9, 1),
  );

  const ceilingHelper = createPointHelper(
    scene,
    lights.ceilingLamp,
    "trialCeilingHelper",
    new BABYLON.Color3(1, 0.9, 0.2),
  );

  return {
    ambientHelper,
    ceilingHelper,
  };
};

export const setupTrialLighting = (scene: BABYLON.Scene) => {
  const ambientLight = new BABYLON.HemisphericLight(
    "trial-ambient",
    new BABYLON.Vector3(0, 1, 0),
    scene,
  );
  ambientLight.intensity = TRIAL_LIGHTING_CONFIG.ambientIntensity;
  ambientLight.diffuse = new BABYLON.Color3(1, 0.98, 0.94);
  // ambientLight.groundColor = new BABYLON.Color3(0.72, 0.72, 0.72);
  ambientLight.groundColor = ambientLight.diffuse;

  const ceilingLamp = new BABYLON.PointLight(
    "trial-ceiling-lamp",
    new BABYLON.Vector3(0, TRIAL_ROOM_CONFIG.height - 0.85, 0),
    scene,
  );
  ceilingLamp.intensity = TRIAL_LIGHTING_CONFIG.pointIntensity;
  ceilingLamp.range = TRIAL_LIGHTING_CONFIG.pointRange;
  ceilingLamp.diffuse = new BABYLON.Color3(1, 0.95, 0.88);

  const shadowGenerator = new BABYLON.ShadowGenerator(1024, ceilingLamp);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 16;
  shadowGenerator.setDarkness(0.2);

  const helpers = createLightHelpers(scene, {
    ambientLight,
    ceilingLamp,
  });

  return {
    ambientLight,
    ceilingLamp,
    shadowGenerator,
    helpers,
  };
};
