export interface TrialRoomConfig {
  width: number;
  depth: number;
  height: number;
  wallThickness: number;
  floorThickness: number;
  vinylThickness: number;
  trimHeight: number;
  wallColor: string;
  floorTexture: string;
}

export const TRIAL_TEXTURES = {
  wall: "/assets/texture/white-texture-1.png",
  ceiling: "/assets/texture/gray-abstract-texture.jpg",
  trim: "/assets/texture/light-wood-texture.jpg",
  bump_wall: "/assets/texture/white-map-1.png",
} as const;

export const DEFAULT_TRIAL_ROOM_CONFIG: TrialRoomConfig = {
  width: 6.8,
  depth: 6.6,
  height: 3,
  wallThickness: 0.09,
  floorThickness: 0.09,
  vinylThickness: 0.02,
  trimHeight: 0.08,
  wallColor: "#F2F0EB",
  floorTexture: "/assets/texture/wood-texture.jpg",
};

export const TRIAL_ROOM_CONFIG = DEFAULT_TRIAL_ROOM_CONFIG;

export const TRIAL_FLOOR_TEXTURE_OPTIONS = [
  { name: "Oak Wood", path: "/assets/texture/european-oak.jpg" },
  { name: "Light Wood", path: "/assets/texture/light-wood-texture.jpg" },
  { name: "Fine Wood", path: "/assets/texture/fine-wood-texture.jpg" },
  {
    name: "Concrete",
    path: "/assets/texture/texture-of-dry-concrete-wall.jpg",
  },
  { name: "Carpet", path: "/assets/texture/carpet.jpg" },
  { name: "Tile", path: "/assets/texture/bathroom-tile.jpg" },
  { name: "Herringbone", path: "/assets/texture/Oak_Herringbone.jpg" },
  { name: "Gray Herringbone", path: "/assets/texture/gray_herringbone.jpg" },
] as const;

export const TRIAL_WALL_COLOR_OPTIONS = [
  "#F2F0EB",
  "#E8E0D4",
  "#DDD6CF",
  "#D7D3CC",
  "#CFC6B8",
  "#BFB7AB",
] as const;

export const TRIAL_CAMERA_CONFIG = {
  alpha: -Math.PI / 2,
  beta: Math.PI / 2,
  radius: 1,
  zoomInRadius: 2.5,
  targetY: 1.2,
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

export const CABINET_CONFIG = {
  thickness: 0.019,
  backPanelThick: 0.01,
  backGap: 0.018,
  plinthHeight: 0.1,
  totalDepth: 0.6,
  shelfClearance: 0.1,
  rodClearance: 0.985,
  rodGap: 0.075,
  drawerClearance: 0.25,
  dividerClearance: 0.45,
  snapStep: 0.05,
  minGap: 0.1,
};

type Orientation = "left" | "right";
export const WIC_CONFIG = {
  orientation: "left" as Orientation,

  walkway: {
    minWidth: 0.8,
  },

  modules: {
    defaultWidth: [0.45, 0.6, 0.9],
    height: 2.4,
    depth: 0.6,
  },

  corner: {
    enabled: true,
  },
};
