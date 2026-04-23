/**
 * Step 1:
 * Define one simple source of truth for every trial asset shown in the right panel.
 *
 * We map:
 * - `wd-*` and `wic-*` into `furniture`
 * - the rest of `/public/assets/trial` into `tambahan`
 */

export type TrialAssetCategory = "furniture" | "tambahan";
export const TRIAL_ASSET_DRAG_TYPE = "application/x-trial-asset-id";

export interface TrialAssetItem {
  id: string;
  name: string;
  size: string;
  price: number;
  image: string;
  modelPath: string;
  category: TrialAssetCategory;
  initialRotationY?: number;
}

export const TRIAL_ASSET_CATALOG: TrialAssetItem[] = [
  {
    id: "wd-602",
    name: "WD 602",
    size: "60 x 45 x 220 cm",
    price: 7800000,
    image: "/assets/trial/frames.webp",
    modelPath: "/assets/trial/wd-602.glb",
    category: "furniture",
  },
  {
    id: "wd-1808",
    name: "WD 1808",
    size: "180 x 45 x 220 cm",
    price: 14200000,
    image: "/assets/trial/frames.webp",
    modelPath: "/assets/trial/wd-1808.glb",
    category: "furniture",
  },
  {
    id: "wic-1228",
    name: "WIC 1228",
    size: "120 x 60 x 240 cm",
    price: 16800000,
    image: "/assets/trial/frames.webp",
    modelPath: "/assets/trial/wic-1228.glb",
    category: "furniture",
  },
  {
    id: "drawer",
    name: "Drawer",
    size: "60 x 45 x 20 cm",
    price: 1450000,
    image: "/assets/trial/interior.webp",
    modelPath: "/assets/trial/drawer.glb",
    category: "tambahan",
  },
  {
    id: "glass-shelf",
    name: "Glass Shelf",
    size: "80 x 35 x 3 cm",
    price: 980000,
    image: "/assets/trial/interior.webp",
    modelPath: "/assets/trial/glass-shelf.glb",
    category: "tambahan",
  },
  {
    id: "hanging-rod",
    name: "Hanging Rod",
    size: "90 x 4 x 4 cm",
    price: 650000,
    image: "/assets/trial/interior.webp",
    modelPath: "/assets/trial/hanging-rod.glb",
    category: "tambahan",
  },
  {
    id: "shelf",
    name: "Shelf",
    size: "80 x 35 x 4 cm",
    price: 720000,
    image: "/assets/trial/interior.webp",
    modelPath: "/assets/trial/shelf.glb",
    category: "tambahan",
  },
  {
    id: "vertical-divider",
    name: "Vertical Divider",
    size: "4 x 45 x 200 cm",
    price: 840000,
    image: "/assets/trial/interior.webp",
    modelPath: "/assets/trial/vertical-divider.glb",
    category: "tambahan",
  },
];

export const getTrialAssetById = (assetId: string) =>
  TRIAL_ASSET_CATALOG.find((asset) => asset.id === assetId) ?? null;

export const getTrialAssetsByCategory = (category: TrialAssetCategory) =>
  TRIAL_ASSET_CATALOG.filter((asset) => asset.category === category);
