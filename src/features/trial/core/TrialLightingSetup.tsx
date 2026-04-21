// import * as BABYLON from "@babylonjs/core";
// import { TRIAL_LIGHTING_CONFIG, TRIAL_ROOM_CONFIG } from "./TrialConfig";
// import { env } from "process";

// const createPointHelper = (
//   scene: BABYLON.Scene,
//   light: BABYLON.PointLight,
//   name: string,
//   color: BABYLON.Color3,
// ) => {
//   const sphere = BABYLON.MeshBuilder.CreateSphere(
//     `${name}Sphere`,
//     { diameter: 0.18 },
//     scene,
//   );
//   sphere.position = light.position.clone();

//   const material = new BABYLON.StandardMaterial(`${name}Mat`, scene);
//   material.emissiveColor = color;
//   material.alpha = 0.55;
//   sphere.material = material;

//   return sphere;
// };

// const createHemisphericHelper = (
//   scene: BABYLON.Scene,
//   light: BABYLON.HemisphericLight,
//   name: string,
//   color: BABYLON.Color3,
// ) => {
//   const anchor = new BABYLON.Vector3(0, 2.2, 0);

//   const sphere = BABYLON.MeshBuilder.CreateSphere(
//     `${name}Sphere`,
//     { diameter: 0.16 },
//     scene,
//   );
//   sphere.position = anchor;

//   const direction = light.direction.normalize();
//   const arrowLength = 0.9;
//   const arrow = BABYLON.MeshBuilder.CreateCylinder(
//     `${name}Arrow`,
//     { height: arrowLength, diameter: 0.05 },
//     scene,
//   );
//   arrow.position = anchor.add(direction.scale(arrowLength / 2));

//   const up = BABYLON.Vector3.Up();
//   const angle = Math.acos(BABYLON.Vector3.Dot(up, direction));
//   const axis = BABYLON.Vector3.Cross(up, direction).normalize();

//   if (axis.length() > 0) {
//     arrow.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, angle);
//   }

//   const material = new BABYLON.StandardMaterial(`${name}Mat`, scene);
//   material.emissiveColor = color;
//   material.alpha = 0.55;
//   sphere.material = material;
//   arrow.material = material;

//   return { sphere, arrow };
// };

// const createSpotHelper = (
//   scene: BABYLON.Scene,
//   light: BABYLON.SpotLight,
//   name: string,
//   color: BABYLON.Color3,
// ) => {
//   // Sphere di posisi lampu
//   const sphere = BABYLON.MeshBuilder.CreateSphere(
//     `${name}Sphere`,
//     { diameter: 0.18 },
//     scene,
//   );
//   sphere.position = light.position.clone();

//   // Arrow menunjukkan arah SpotLight (ke bawah)
//   const direction = light.direction.normalize();
//   const arrowLength = 0.9;
//   const arrow = BABYLON.MeshBuilder.CreateCylinder(
//     `${name}Arrow`,
//     { height: arrowLength, diameter: 0.05 },
//     scene,
//   );
//   arrow.position = light.position.add(direction.scale(arrowLength / 2));

//   const up = BABYLON.Vector3.Up();
//   const angle = Math.acos(BABYLON.Vector3.Dot(up, direction));
//   const axis = BABYLON.Vector3.Cross(up, direction).normalize();
//   if (axis.length() > 0) {
//     arrow.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, angle);
//   }

//   // Cone wireframe untuk visualisasi sudut spot
//   const coneHeight = 1.2;
//   const coneRadius = Math.tan(light.angle / 2) * coneHeight;
//   const cone = BABYLON.MeshBuilder.CreateCylinder(
//     `${name}Cone`,
//     {
//       height: coneHeight,
//       diameterTop: 0,
//       diameterBottom: coneRadius * 2,
//       tessellation: 16,
//     },
//     scene,
//   );
//   cone.position = light.position.add(direction.scale(coneHeight / 2));
//   if (axis.length() > 0) {
//     cone.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, angle);
//   }

//   const material = new BABYLON.StandardMaterial(`${name}Mat`, scene);
//   material.emissiveColor = color;
//   material.alpha = 0.15;
//   material.wireframe = true;
//   sphere.material = material;
//   arrow.material = material;
//   cone.material = material;

//   return { sphere, arrow, cone };
// };

// const createLightHelpers = (
//   scene: BABYLON.Scene,
//   lights: {
//     ambientLight: BABYLON.HemisphericLight;
//     ceilingLamp: BABYLON.SpotLight;
//   },
// ) => {
//   const ambientHelper = createHemisphericHelper(
//     scene,
//     lights.ambientLight,
//     "trialAmbientHelper",
//     new BABYLON.Color3(0.2, 0.9, 1),
//   );

//   const ceilingHelper = createSpotHelper(
//     scene,
//     lights.ceilingLamp,
//     "trialCeilingHelper",
//     new BABYLON.Color3(1, 0.9, 0.2),
//   );

//   return {
//     ambientHelper,
//     ceilingHelper,
//   };
// };

// export const setupTrialLighting = (scene: BABYLON.Scene) => {
//   const { height } = TRIAL_ROOM_CONFIG;

//   const envTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
//     "https://assets.babylonjs.com/environments/studio.env",
//     scene,
//   );
//   envTexture.rotationY = Math.PI / 2;
//   scene.environmentTexture = envTexture;
//   scene.environmentIntensity = 0.25;

//   // 1. Ambient — groundColor dibedakan agar ada gradasi vertikal natural
//   const ambientLight = new BABYLON.HemisphericLight(
//     "trial-ambient",
//     new BABYLON.Vector3(0, 1, 0),
//     scene,
//   );
//   // ambientLight.intensity = TRIAL_LIGHTING_CONFIG.ambientIntensity;
//   ambientLight.diffuse = new BABYLON.Color3(0.72, 0.7, 0.66);
//   ambientLight.groundColor = new BABYLON.Color3(0.55, 0.53, 0.5);
//   // ambientLight.groundColor = new BABYLON.Color3(0.85, 0.85, 0.85);
//   ambientLight.intensity = 1.2; // Naikkan kompensasi karena env diturunkan
//   // ambientLight.diffuse = new BABYLON.Color3(0.96, 0.96, 0.96); // Atas terang merata
//   // ambientLight.groundColor = new BABYLON.Color3(0.85, 0.85, 0.85);

//   const lampY = height - 0.25;
//   const ceilingLamp = new BABYLON.SpotLight(
//     "trial-ceiling-lamp",
//     new BABYLON.Vector3(0, lampY, 0),
//     new BABYLON.Vector3(0, -1, 0),
//     Math.PI / 1.2, // angle ~82°
//     2.0, // exponent soft edge
//     scene,
//   );
//   ceilingLamp.intensity = TRIAL_LIGHTING_CONFIG.pointIntensity * 1.2;
//   ceilingLamp.range = TRIAL_LIGHTING_CONFIG.pointRange;
//   ceilingLamp.diffuse = new BABYLON.Color3(1, 0.95, 0.88);
//   // ceilingLamp.diffuse = new BABYLON.Color3(1, 0.97, 0.92);

//   const shadowGenerator = new BABYLON.ShadowGenerator(2048, ceilingLamp);
//   shadowGenerator.useBlurExponentialShadowMap = true;
//   shadowGenerator.blurKernel = 32;
//   shadowGenerator.setDarkness(0.25);

//   // const lampPanel = BABYLON.MeshBuilder.CreatePlane(
//   //   "lamp-panel",
//   //   { width: 2, height: 0.6 },
//   //   scene,
//   // );
//   // lampPanel.position.set(0, height - 0.01, 0);
//   // lampPanel.rotation.x = Math.PI / 2;

//   // const lampPanelMat = new BABYLON.StandardMaterial("lamp-panel-mat", scene);
//   // lampPanelMat.emissiveColor = new BABYLON.Color3(1, 0.97, 0.9);
//   // lampPanelMat.disableLighting = true;
//   // lampPanel.material = lampPanelMat;
//   // lampPanel.isVisible = false;

//   // const fillLight = new BABYLON.HemisphericLight(
//   //   "trial-fill",
//   //   new BABYLON.Vector3(0, -1, 0), // dari bawah ke atas → fill ke ceiling & walls
//   //   scene,
//   // );
//   // fillLight.intensity = 0.18;
//   // fillLight.diffuse = new BABYLON.Color3(1, 0.98, 0.94);
//   // fillLight.groundColor = new BABYLON.Color3(0.9, 0.88, 0.84);

//   return {
//     ambientLight,
//     ceilingLamp,
//     shadowGenerator,
//   };
// };
import * as BABYLON from "@babylonjs/core";
import { TRIAL_LIGHTING_CONFIG, TRIAL_ROOM_CONFIG } from "./TrialConfig";

// ─── Dev-only helper (hanya muncul saat DEV_LIGHTS=true) ──────────────────────
// Uncomment baris berikut di TrialSceneSetup saat butuh debug visual:
//   const { debugDispose } = createLightHelpers(scene, { ambientLight, ceilingLamp });
//   return { ..., debugDispose };

const createSpotHelper = (
  scene: BABYLON.Scene,
  light: BABYLON.SpotLight,
  name: string,
  color: BABYLON.Color3,
) => {
  const mat = new BABYLON.StandardMaterial(`${name}Mat`, scene);
  mat.emissiveColor = color;
  mat.alpha = 0.15;
  mat.wireframe = true;

  const sphere = BABYLON.MeshBuilder.CreateSphere(
    `${name}Sphere`,
    { diameter: 0.18 },
    scene,
  );
  sphere.position = light.position.clone();
  sphere.material = mat;

  const direction = light.direction.normalize();
  const arrowLength = 0.9;
  const arrow = BABYLON.MeshBuilder.CreateCylinder(
    `${name}Arrow`,
    { height: arrowLength, diameter: 0.05 },
    scene,
  );
  arrow.position = light.position.add(direction.scale(arrowLength / 2));
  arrow.material = mat;

  const up = BABYLON.Vector3.Up();
  const angle = Math.acos(BABYLON.Vector3.Dot(up, direction));
  const axis = BABYLON.Vector3.Cross(up, direction).normalize();
  if (axis.length() > 0) {
    const q = BABYLON.Quaternion.RotationAxis(axis, angle);
    arrow.rotationQuaternion = q;
  }

  const coneHeight = 1.2;
  const coneRadius = Math.tan(light.angle / 2) * coneHeight;
  const cone = BABYLON.MeshBuilder.CreateCylinder(
    `${name}Cone`,
    {
      height: coneHeight,
      diameterTop: 0,
      diameterBottom: coneRadius * 2,
      tessellation: 16,
    },
    scene,
  );
  cone.position = light.position.add(direction.scale(coneHeight / 2));
  if (axis.length() > 0) {
    cone.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, angle);
  }
  cone.material = mat;

  return {
    dispose: () => {
      sphere.dispose();
      arrow.dispose();
      cone.dispose();
      mat.dispose();
    },
  };
};

/** Panggil hanya saat debugging lighting. Return dispose() untuk cleanup. */
export const createLightHelpers = (
  scene: BABYLON.Scene,
  lights: {
    ceilingLamp: BABYLON.SpotLight;
  },
) => {
  const ceilingHelper = createSpotHelper(
    scene,
    lights.ceilingLamp,
    "trialCeilingHelper",
    new BABYLON.Color3(1, 0.9, 0.2),
  );

  return {
    debugDispose: () => {
      ceilingHelper.dispose();
    },
  };
};

// ─── Main export ───────────────────────────────────────────────────────────────

export interface TrialLightingResult {
  ambientLight: BABYLON.HemisphericLight;
  ceilingLamp: BABYLON.SpotLight;
  shadowGenerator: BABYLON.ShadowGenerator;
}

export const setupTrialLighting = (
  scene: BABYLON.Scene,
): TrialLightingResult => {
  const { height } = TRIAL_ROOM_CONFIG;

  // Environment map — memberikan refleksi PBR yang natural
  const envTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
    "https://assets.babylonjs.com/environments/studio.env",
    scene,
  );
  envTexture.rotationY = Math.PI / 2;
  scene.environmentTexture = envTexture;
  scene.environmentIntensity = 0.25;

  // Ambient — groundColor lebih gelap agar ada gradasi vertikal natural
  const ambientLight = new BABYLON.HemisphericLight(
    "trial-ambient",
    new BABYLON.Vector3(0, 1, 0),
    scene,
  );
  ambientLight.intensity = 1.2;
  ambientLight.diffuse = new BABYLON.Color3(0.72, 0.7, 0.66);
  ambientLight.groundColor = new BABYLON.Color3(0.55, 0.53, 0.5);

  // Ceiling spot — sumber cahaya utama + shadow caster
  const lampY = height - 0.25;
  const ceilingLamp = new BABYLON.SpotLight(
    "trial-ceiling-lamp",
    new BABYLON.Vector3(0, lampY, 0),
    new BABYLON.Vector3(0, -1, 0),
    Math.PI / 1.2, // ~150° cone (wide, soft)
    2.0, // exponent — soft falloff di tepi
    scene,
  );
  ceilingLamp.intensity = TRIAL_LIGHTING_CONFIG.pointIntensity * 1.2;
  ceilingLamp.range = TRIAL_LIGHTING_CONFIG.pointRange;
  ceilingLamp.diffuse = new BABYLON.Color3(1, 0.95, 0.88);

  const shadowGenerator = new BABYLON.ShadowGenerator(2048, ceilingLamp);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 32;
  shadowGenerator.setDarkness(0.25);

  return { ambientLight, ceilingLamp, shadowGenerator };
};
