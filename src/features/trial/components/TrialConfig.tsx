export const TRIAL_ROOM_DIMENSIONS = {
  wallHeight: 3,
  wallThickness: 0.1,
  floorThickness: 0.097,
  vinylThickness: 0.003,
} as const;

export const FLOOR_Y =
  TRIAL_ROOM_DIMENSIONS.floorThickness + TRIAL_ROOM_DIMENSIONS.vinylThickness;

export const TRIAL_MATERIAL_CONFIG = {
  interior: {
    color: [0.95, 0.94, 0.92] as const,
    roughness: 0.4,
    metallic: 0,
  },
  floor: {
    roughness: 0.4,
    metallic: 0,
  },
  furniture: {
    roughness: 0.4,
    metallic: 0.1,
    directIntensity: 1.5,
    environmentIntensity: 1.2,
    specularIntensity: 0.5,
    albedoBoost: 1.2,
  },
} as const;
