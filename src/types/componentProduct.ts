import { PageableResponse } from "./pagination";

export type ProductComponent = {
  id: string;
  componentName: string;
  componentUrl: string;
  componentSku: string;
  componentCategory: ComponentCategory;
  componentDesc: string;
  price: number;
  weight: number;
  componentImageUrls: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type ComponentCategory =
  | "SHELF"
  | "DRAWER"
  | "HANGER"
  | "DOOR"
  | "RAIL"
  | "ACCESSORY"
  | "HARDWARE";

export type CreateComponentInput = {
  componentName: string;
  componentUrl: string;
  componentSku: string;
  componentDesc: string;
  componentCategory: ComponentCategory;
  price: number | string;
  weight: number | string;
  componentImageUrls: string[];
};

export type UpdateComponentInput = Partial<
  Pick<
    CreateComponentInput,
    | "componentName"
    | "componentUrl"
    | "componentSku"
    | "componentDesc"
    | "componentCategory"
    | "price"
    | "weight"
    | "componentImageUrls"
  >
> & {
  isActive?: boolean;
};

export type ComponentSortBy =
  | "componentName"
  | "componentCategory"
  | "price"
  | "createdAt"
  | "updatedAt";

export type ComponentOrderBy = "asc" | "desc";

export type GetComponentsQuery = {
  page?: number;
  perPage?: number;
  sortBy?: ComponentSortBy;
  orderBy?: ComponentOrderBy;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  category?: ComponentCategory;
  search?: string;
};

export type GetComponentsResponse = PageableResponse<ProductComponent>;
