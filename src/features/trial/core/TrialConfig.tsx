export const TRIAL_TEXTURES = {
  floor: "/assets/texture/Oak_Herringbone.jpg",
  wall: "/assets/texture/pale-stucco-pattern.jpg",
  // wall: "/assets/texture/pale-stucco-pattern.jpg",
  ceiling: "/assets/texture/gray-abstract-texture.jpg",
  trim: "/assets/texture/light-wood-texture.jpg",
} as const;

export const TRIAL_ROOM_CONFIG = {
  width: 6.8,
  depth: 6.6,
  height: 3,
  wallThickness: 0.09,
  floorThickness: 0.09,
  vinylThickness: 0.02,
  trimHeight: 0.08,
  wallColor: "#F2F0EB",
  floorTexture: "/assets/texture/wood-texture.jpg",
} as const;

export const TRIAL_CAMERA_CONFIG = {
  alpha: -Math.PI / 2,
  beta: Math.PI / 2,
  radius: 0.1,
  zoomInRadius: 2.5,
  targetY: 1.2,
  // targetY: 0,
  wheelPrecision: 70,
  lowerBetaLimit: 0.1,
  upperBetaLimit: Math.PI / 1.85,
  lowerRadiusLimit: 1,
  upperRadiusLimit: 15,
  minTargetY: 0.2,
  maxTargetY: 2.0,
} as const;

export const TRIAL_LIGHTING_CONFIG = {
  ambientIntensity: 0.6,
  pointIntensity: 9,
  pointRange: 12,
  directionalIntensity: 1.4,
} as const;
