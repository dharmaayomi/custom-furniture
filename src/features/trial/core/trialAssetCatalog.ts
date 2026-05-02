/**
 * Step 1:
 * Mirror the backend models here first, so later we can swap the mock arrays
 * with real API/DB data without rewriting the trial UI flow.
 */

export type TrialAssetCategory = "frame" | "interior" | "material";
export const TRIAL_ASSET_DRAG_TYPE = "application/x-trial-asset-id";

export type ComponentCategory =
  | "DRAWER"
  | "SHELF"
  | "GLASS_SHELF"
  | "HANGING_ROD"
  | "DIVIDER";

export type MaterialCategory = "FRAME" | "INTERIOR" | "FINISH";

export interface TrialProductBase {
  id: string;
  productName: string;
  sku: string;
  productUrl: string;
  description: string;
  basePrice: number;
  width: number;
  height: number;
  depth: number;
  weight: number;
  images: string[];
  isActive: boolean;
  isCustomizable: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrialProductComponent {
  id: string;
  componentName: string;
  componentUrl: string;
  componentCategory: ComponentCategory | null;
  componentDesc: string;
  componentSku: string | null;
  price: number;
  weight: number;
  componentImageUrls: string[];
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface TrialProductMaterial {
  id: string;
  materialName: string;
  materialUrl: string;
  materialDesc: string;
  materialSku: string | null;
  materialCategories: MaterialCategory[];
  price: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Step 2:
 * Mock `ProductBase` exactly like the backend contract.
 * In the current trial flow, this is the same thing as Frame Lemari.
 */
export const TRIAL_PRODUCT_BASES: TrialProductBase[] = [
  {
    id: "base-wd-602",
    productName: "WD 602",
    sku: "WD-602",
    productUrl: "/assets/trial/wd-602.glb",
    description: "Frame lemari single bay untuk test posisi dasar.",
    basePrice: 7800000,
    width: 60,
    height: 220,
    depth: 45,
    weight: 82,
    images: ["/assets/trial/frames.webp"],
    isActive: true,
    isCustomizable: true,
    deletedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    id: "base-wd-1808",
    productName: "WD 1808",
    sku: "WD-1808",
    productUrl: "/assets/trial/wd-1808.glb",
    description: "Frame lemari lebar untuk test swap base furniture.",
    basePrice: 14200000,
    width: 180,
    height: 220,
    depth: 45,
    weight: 164,
    images: ["/assets/trial/frames.webp"],
    isActive: true,
    isCustomizable: true,
    deletedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    id: "base-wic-1228",
    productName: "WIC 1228",
    sku: "WIC-1228",
    // productUrl: "/assets/trial/wic-1228.glb",
    productUrl: "/assets/trial/FULL-WIC.glb",
    description: "Frame lemari walk-in untuk test size berbeda.",
    basePrice: 16800000,
    width: 120,
    height: 240,
    depth: 60,
    weight: 176,
    images: ["/assets/trial/frames.webp"],
    isActive: true,
    isCustomizable: true,
    deletedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
];

/**
 * Step 3:
 * Mock `ProductComponent` exactly like the backend contract.
 * In the current trial flow, this is the same thing as Interior Lemari.
 */
export const TRIAL_PRODUCT_COMPONENTS: TrialProductComponent[] = [
  {
    id: "component-drawer",
    componentName: "Drawer",
    componentUrl: "/assets/trial/drawer.glb",
    componentCategory: "DRAWER",
    componentDesc: "Modul laci interior untuk frame lemari.",
    componentSku: "COMP-DRW-001",
    price: 1450000,
    weight: 12,
    componentImageUrls: ["/assets/trial/interior.webp"],
    isActive: true,
    deletedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    id: "component-glass-shelf",
    componentName: "Glass Shelf",
    componentUrl: "/assets/trial/glass-shelf.glb",
    componentCategory: "GLASS_SHELF",
    componentDesc: "Rak kaca interior untuk test attachment.",
    componentSku: "COMP-GLS-001",
    price: 980000,
    weight: 5,
    componentImageUrls: ["/assets/trial/interior.webp"],
    isActive: true,
    deletedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    id: "component-hanging-rod",
    componentName: "Hanging Rod",
    componentUrl: "/assets/trial/hanging-rod.glb",
    componentCategory: "HANGING_ROD",
    componentDesc: "Tiang gantung untuk test interior lemari.",
    componentSku: "COMP-HRD-001",
    price: 650000,
    weight: 2,
    componentImageUrls: ["/assets/trial/interior.webp"],
    isActive: true,
    deletedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    id: "component-shelf",
    componentName: "Shelf",
    componentUrl: "/assets/trial/shelf.glb",
    componentCategory: "SHELF",
    componentDesc: "Rak standar untuk test multi component.",
    componentSku: "COMP-SHF-001",
    price: 720000,
    weight: 6,
    componentImageUrls: ["/assets/trial/interior.webp"],
    isActive: true,
    deletedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    id: "component-vertical-divider",
    componentName: "Vertical Divider",
    componentUrl: "/assets/trial/vertical-divider.glb",
    componentCategory: "DIVIDER",
    componentDesc: "Partisi vertical interior untuk test stacking.",
    componentSku: "COMP-DIV-001",
    price: 840000,
    weight: 9,
    componentImageUrls: ["/assets/trial/interior.webp"],
    isActive: true,
    deletedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
];

/**
 * Step 4:
 * Mock `ProductMaterials` too, even though material apply logic is not wired yet.
 * This keeps the data structure ready for the backend shape from the start.
 */
export const TRIAL_PRODUCT_MATERIALS: TrialProductMaterial[] = [
  {
    id: "material-oak",
    materialName: "Oak Finish",
    materialUrl: "/assets/trial/frames.webp",
    materialDesc: "Finishing oak terang untuk frame lemari.",
    materialSku: "MAT-OAK-001",
    materialCategories: ["FRAME", "FINISH"],
    price: 450000,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: null,
  },
  {
    id: "material-walnut",
    materialName: "Walnut Finish",
    materialUrl: "/assets/trial/interior.webp",
    materialDesc: "Finishing walnut untuk interior lemari.",
    materialSku: "MAT-WAL-001",
    materialCategories: ["INTERIOR", "FINISH"],
    price: 520000,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: null,
  },
];

/**
 * Step 5:
 * Keep one lightweight view model for the drawer cards.
 * The UI reads this shape, but the source data still follows the backend contract above.
 */
export interface TrialAssetItem {
  id: string;
  name: string;
  size: string;
  price: number;
  image: string;
  modelPath: string;
  category: TrialAssetCategory;
  initialRotationY?: number;
  fitWidthMode?: "keep" | "shrink" | "fill";
  fitHeightMode?: "keep" | "shrink" | "fill";
  fitDepthMode?: "keep" | "shrink" | "fill";
  sourceType: "productBase" | "productComponent" | "productMaterial";
  sourceId: string;
}

const formatSize = (width: number, depth: number, height: number) =>
  `${width} x ${depth} x ${height} cm`;

const INTERIOR_INITIAL_ROTATION_BY_ID: Partial<
  Record<TrialProductComponent["id"], number>
> = {};

const INTERIOR_FIT_BY_ID: Partial<
  Record<
    TrialProductComponent["id"],
    Pick<TrialAssetItem, "fitWidthMode" | "fitHeightMode" | "fitDepthMode">
  >
> = {
  "component-drawer": {
    fitWidthMode: "fill",
    fitDepthMode: "shrink",
  },
  "component-shelf": {
    fitWidthMode: "fill",
    fitHeightMode: "keep",
    fitDepthMode: "shrink",
  },
  "component-glass-shelf": {
    fitWidthMode: "fill",
    fitHeightMode: "keep",
    fitDepthMode: "shrink",
  },
  "component-hanging-rod": {
    fitWidthMode: "fill",
    fitHeightMode: "keep",
    fitDepthMode: "keep",
  },
  "component-vertical-divider": {
    fitWidthMode: "keep",
    fitHeightMode: "shrink",
    fitDepthMode: "shrink",
  },
};

const productBaseToAsset = (item: TrialProductBase): TrialAssetItem => ({
  id: item.id,
  name: item.productName,
  size: formatSize(item.width, item.depth, item.height),
  price: item.basePrice,
  image: item.images[0] ?? "/assets/trial/frames.webp",
  modelPath: item.productUrl,
  category: "frame",
  sourceType: "productBase",
  sourceId: item.id,
});

const productComponentToAsset = (
  item: TrialProductComponent,
): TrialAssetItem => ({
  id: item.id,
  name: item.componentName,
  size: item.componentCategory ?? "Interior",
  price: Math.round(item.price),
  image: item.componentImageUrls[0] ?? "/assets/trial/interior.webp",
  modelPath: item.componentUrl,
  category: "interior",
  initialRotationY: INTERIOR_INITIAL_ROTATION_BY_ID[item.id],
  fitWidthMode: INTERIOR_FIT_BY_ID[item.id]?.fitWidthMode ?? "keep",
  fitHeightMode: INTERIOR_FIT_BY_ID[item.id]?.fitHeightMode ?? "keep",
  fitDepthMode: INTERIOR_FIT_BY_ID[item.id]?.fitDepthMode ?? "keep",
  sourceType: "productComponent",
  sourceId: item.id,
});

const productMaterialToAsset = (
  item: TrialProductMaterial,
): TrialAssetItem => ({
  id: item.id,
  name: item.materialName,
  size: item.materialCategories.join(", "),
  price: item.price ?? 0,
  image: item.materialUrl,
  modelPath: "",
  category: "material",
  sourceType: "productMaterial",
  sourceId: item.id,
});

export const TRIAL_ASSET_CATALOG: TrialAssetItem[] = [
  ...TRIAL_PRODUCT_BASES.map(productBaseToAsset),
  ...TRIAL_PRODUCT_COMPONENTS.map(productComponentToAsset),
  ...TRIAL_PRODUCT_MATERIALS.map(productMaterialToAsset),
];

export const getTrialProductBaseById = (assetId: string) =>
  TRIAL_PRODUCT_BASES.find((item) => item.id === assetId) ?? null;

export const getTrialProductComponentById = (assetId: string) =>
  TRIAL_PRODUCT_COMPONENTS.find((item) => item.id === assetId) ?? null;

export const getTrialProductMaterialById = (assetId: string) =>
  TRIAL_PRODUCT_MATERIALS.find((item) => item.id === assetId) ?? null;

export const getTrialAssetById = (assetId: string) =>
  TRIAL_ASSET_CATALOG.find((asset) => asset.id === assetId) ?? null;

export const getTrialAssetsByCategory = (category: TrialAssetCategory) =>
  TRIAL_ASSET_CATALOG.filter((asset) => asset.category === category);
