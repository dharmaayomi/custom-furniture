import { PageableResponse } from "./pagination";

export type ProductBase = {
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
  createdAt: string;
  updatedAt: string;
};

export type ProductComponent = {
  id: string;
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
  id: string;
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

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
};

export type ProductSortBy =
  | "id"
  | "productName"
  | "sku"
  | "basePrice"
  | "createdAt"
  | "updatedAt";

export type ProductOrderBy = "asc" | "desc";

export type GetProductsQuery = {
  page?: number;
  perPage?: number;
  sortBy?: ProductSortBy;
  orderBy?: ProductOrderBy;
  isActive?: boolean;
  isCustomizable?: boolean;
  sku?: string;
  name?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

export type GetProductsResponse = PageableResponse<ProductBase>;

export type UpdateProductInput = Partial<
  Pick<
    ProductBase,
    | "productName"
    | "sku"
    | "productUrl"
    | "description"
    | "basePrice"
    | "width"
    | "height"
    | "depth"
    | "weight"
    | "images"
    | "isActive"
    | "isCustomizable"
  >
>;

export type ProductFormData = {
  productName: string;
  sku: string;
  productFileName: string;
  description: string;
  basePrice: string;
  width: string;
  height: string;
  depth: string;
  weight: string;
  images: string[];
  isActive: boolean;
  isCustomizable: boolean;
};

export type UploadedProductImage = {
  file: File;
  previewUrl: string;
};
