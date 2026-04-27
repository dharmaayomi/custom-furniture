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
