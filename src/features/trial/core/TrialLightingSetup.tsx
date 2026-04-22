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
