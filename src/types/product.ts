export type ProductBase = {
  id: number;
  productName: string;
  sku: string;
  productUrl: string;
  description: string;
  basePrice: number;
  height: number;
  width: number;
  depth: number;
  images: string[];
  isActive: boolean;
  isCustomizable: boolean;
};

export type ProductComponent = {
  id: number;
  componentName: string;
  componentUrl: string;
  category: ComponentCategory;
  componentDesc: string;
  price: number;
  componentImageUrls: string[];
  isActive: boolean;
};

enum ComponentCategory {
  "SHELF",
  "DRAWER",
  "HANGER",
  "DOOR",
  "RAIL",
  "ACCESSORY",
  "HARDWARE",
}

export type ProductMaterial = {
  id: number;
  materialName: string;
  materialUrl: string;
  materialDesc: string;
  meterialImageUrls: string[];
  isActive: boolean;
};

export type CustomOrderItem = {
  productBaseId: number;
  materialId: number | null;
  lockedBasePrice: number;
  lockedMaterialPrice: number;
  itemTotalPrice: number;
};

export type CustomOrderComponent = {
  componentId: number;
  quantity: number;
  lockedPricePerUnit: number;
  lockedSubTotal: number;
};
