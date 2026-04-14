export const TRIAL_TEXTURES = {
  floor: "/assets/texture/Oak_Herringbone.jpg",
  wall: "/assets/texture/texture-of-dry-concrete-wall.jpg",
  ceiling: "/assets/texture/gray-abstract-texture.jpg",
  trim: "/assets/texture/light-wood-texture.jpg",
} as const;

export const TRIAL_ROOM_CONFIG = {
  width: 6.8,
  depth: 6.6,
  height: 3,
  wallThickness: 0.12,
  floorThickness: 0.08,
  trimHeight: 0.08,
} as const;

export const TRIAL_CAMERA_CONFIG = {
  alpha: -Math.PI / 2.2,
  beta: Math.PI / 2.8,
  radius: 8.5,
  targetY: 1.2,
  lowerRadiusLimit: 4.5,
  upperRadiusLimit: 12,
  lowerBetaLimit: 0.7,
  upperBetaLimit: Math.PI / 2.05,
  wheelPrecision: 35,
} as const;

export const TRIAL_LIGHTING_CONFIG = {
  ambientIntensity: 0.65,
  pointIntensity: 28,
  pointRange: 18,
  directionalIntensity: 1.4,
} as const;
