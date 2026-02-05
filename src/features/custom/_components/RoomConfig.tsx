export type RoomType = "kitchen" | "bathroom" | "bedroom" | "living";

export const CONFIG = {
  // Scene units are meters (1 Babylon unit = 1 meter)
  rw: 6,
  rd: 5,
  type: "kitchen" as RoomType,
  yellowZoneWidth: 2.5,
};

export const ROOM_DIMENSIONS = {
  wallHeight: 3,
  wallThickness: 0.1,
  floorThickness: 0.097,
  vinylThickness: 0.003,
} as const;

// Reference floor height used for placing models on the floor surface
export const FLOOR_Y =
  ROOM_DIMENSIONS.floorThickness + ROOM_DIMENSIONS.vinylThickness;

export const CAMERA_CONFIG = {
  // alpha: -Math.PI / 2,
  // // beta: Math.PI / 2.2,
  // beta: Math.PI / 1.2,
  // radius: 600,
  // targetY: 140,
  // wheelPrecision: 0.2,
  // lowerBetaLimit: 0.2,
  // upperBetaLimit: Math.PI / 2.02,
  // lowerRadiusLimit: 90,
  // upperRadiusLimit: 1500,
  // minTargetY: 60,
  // maxTargetY: 160,
  alpha: -Math.PI / 2,
  beta: Math.PI / 2,
  radius: 6,
  targetY: 1.2,
  wheelPrecision: 30,
  lowerBetaLimit: 0.1,
  upperBetaLimit: Math.PI / 1.85,
  lowerRadiusLimit: 0.5,
  upperRadiusLimit: 12,
  minTargetY: 0.2,
  maxTargetY: 2.0,
} as const;

export const LIGHTING_CONFIG = {
  ambient: {
    intensity: 0.5,
    diffuse: [1, 0.95, 0.85] as const,
    // groundColor: [0.6, 0.55, 0.45] as const,
    groundColor: [0.3, 0.3, 0.3] as const,
  },
  ceilingLamp: {
    intensity: 2.5,
    diffuse: [1, 0.92, 0.8] as const,
    range: 25,
  },
  mainSpot: {
    intensity: 7.0,
    diffuse: [1, 0.95, 0.85] as const,
    range: 8,
    angle: Math.PI / 6,
    exponent: 8,
  },
} as const;

export const MATERIAL_CONFIG = {
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

export const TEXTURE_PATHS: Record<RoomType, string> = {
  bathroom: "/assets/texture/fine-wood-texture.jpg",
  kitchen: "/assets/texture/wood-texture.jpg",
  bedroom: "/assets/texture/light-wood-texture.jpg",
  living: "/assets/texture/light-wood-texture.jpg",
};
