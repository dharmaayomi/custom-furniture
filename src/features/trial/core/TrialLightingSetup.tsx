import * as BABYLON from "@babylonjs/core";
import { TRIAL_LIGHTING_CONFIG, TrialRoomConfig } from "./TrialConfig";

export type TrialThemeMode = "light" | "dark";

export interface TrialLightingResult {
  ambientLight: BABYLON.HemisphericLight;
  ceilingLamp: BABYLON.SpotLight;
  accentLight: BABYLON.SpotLight;
  shadowGenerator: BABYLON.ShadowGenerator;
  updateForRoomConfig: (roomConfig: TrialRoomConfig) => void;
  updateThemeMode: (themeMode: TrialThemeMode) => void;
}

const TRIAL_ENV_TEXTURE_PATH = "/assets/room-light.env";

const applyLightingPreset = (
  scene: BABYLON.Scene,
  ambientLight: BABYLON.HemisphericLight,
  ceilingLamp: BABYLON.SpotLight,
  accentLight: BABYLON.SpotLight,
  shadowGenerator: BABYLON.ShadowGenerator,
  themeMode: TrialThemeMode,
) => {
  if (themeMode === "dark") {
    scene.environmentIntensity = 0.2;

    ambientLight.intensity = 0.7;
    // ambientLight.diffuse = new BABYLON.Color3(0.3, 0.34, 0.42);
    // ambientLight.groundColor = new BABYLON.Color3(0.11, 0.12, 0.16);
    ambientLight.diffuse = new BABYLON.Color3(0.58, 0.55, 0.5);
    ambientLight.groundColor = new BABYLON.Color3(0.32, 0.3, 0.27);

    ceilingLamp.intensity = TRIAL_LIGHTING_CONFIG.pointIntensity * 1.4;
    // ceilingLamp.diffuse = new BABYLON.Color3(1, 0.82, 0.64);
    ceilingLamp.diffuse = new BABYLON.Color3(1, 0.92, 0.82);

    accentLight.intensity = 2.8;
    // accentLight.diffuse = new BABYLON.Color3(0.5, 0.58, 0.82);
    accentLight.diffuse = new BABYLON.Color3(0.95, 0.9, 0.85);

    shadowGenerator.setDarkness(0.3);
    return;
  }

  scene.environmentIntensity = 0.3;

  ambientLight.intensity = 1.15;
  ambientLight.diffuse = new BABYLON.Color3(0.72, 0.7, 0.66);
  ambientLight.groundColor = new BABYLON.Color3(0.55, 0.53, 0.5);

  ceilingLamp.intensity = TRIAL_LIGHTING_CONFIG.pointIntensity * 1.2;
  ceilingLamp.diffuse = new BABYLON.Color3(1, 0.95, 0.88);

  accentLight.intensity = 1.15;
  accentLight.diffuse = new BABYLON.Color3(0.96, 0.95, 1);

  shadowGenerator.setDarkness(0.25);
};

export const setupTrialLighting = (
  scene: BABYLON.Scene,
  roomConfig: TrialRoomConfig,
  themeMode: TrialThemeMode,
): TrialLightingResult => {
  const { depth, height, width } = roomConfig;

  const envTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
    TRIAL_ENV_TEXTURE_PATH,
    scene,
  );
  envTexture.rotationY = -Math.PI / 2;
  scene.environmentTexture = envTexture;

  const ambientLight = new BABYLON.HemisphericLight(
    "trial-ambient",
    new BABYLON.Vector3(0, 1, 0),
    scene,
  );

  const ceilingLamp = new BABYLON.SpotLight(
    "trial-ceiling-lamp",
    new BABYLON.Vector3(-width * 0.08, height - 0.25, -depth * 0.06),
    new BABYLON.Vector3(0.1, -1, 0.18),
    Math.PI / 1.35,
    2.2,
    scene,
  );
  ceilingLamp.range = TRIAL_LIGHTING_CONFIG.pointRange;

  const accentLight = new BABYLON.SpotLight(
    "trial-accent-lamp",
    new BABYLON.Vector3(width * 0.32, height - 0.4, -depth * 0.18),
    new BABYLON.Vector3(-0.34, -1, 0.42),
    Math.PI / 1.6,
    2.8,
    scene,
  );
  accentLight.range = Math.max(TRIAL_LIGHTING_CONFIG.pointRange * 0.9, 8);

  const shadowGenerator = new BABYLON.ShadowGenerator(2048, ceilingLamp);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 32;

  applyLightingPreset(
    scene,
    ambientLight,
    ceilingLamp,
    accentLight,
    shadowGenerator,
    themeMode,
  );

  return {
    ambientLight,
    ceilingLamp,
    accentLight,
    shadowGenerator,
    updateForRoomConfig: (nextRoomConfig) => {
      ceilingLamp.position.set(
        -nextRoomConfig.width * 0.08,
        nextRoomConfig.height - 0.25,
        -nextRoomConfig.depth * 0.06,
      );
      accentLight.position.set(
        nextRoomConfig.width * 0.32,
        nextRoomConfig.height - 0.4,
        -nextRoomConfig.depth * 0.18,
      );
    },
    updateThemeMode: (nextThemeMode) => {
      applyLightingPreset(
        scene,
        ambientLight,
        ceilingLamp,
        accentLight,
        shadowGenerator,
        nextThemeMode,
      );
    },
  };
};
