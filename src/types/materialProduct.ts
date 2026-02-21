import { PageableResponse } from "./pagination";

export type ProductMaterial = {
  id: string;
  materialName: string;
  materialUrl: string;
  materialDesc: string;
  materialSku: string;
  materialCategory?: MaterialCategory | null;
  price?: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type MaterialCategory = "FLOOR" | "WALL" | "FURNITURE";

export type CreateMaterialInput = {
  materialName: string;
  materialUrl: string;
  materialSku: string;
  materialDesc: string;
  materialCategory: MaterialCategory;
  price: number | string;
};

export type UpdateMaterialInput = Partial<
  Pick<
    CreateMaterialInput,
    | "materialName"
    | "materialUrl"
    | "materialSku"
    | "materialDesc"
    | "materialCategory"
    | "price"
  >
> & {
  isActive?: boolean;
};

export type MaterialSortBy =
  | "materialName"
  | "materialCategory"
  | "price"
  | "createdAt"
  | "updatedAt";

export type MaterialOrderBy = "asc" | "desc";

export type GetMaterialsQuery = {
  page?: number;
  perPage?: number;
  sortBy?: MaterialSortBy;
  orderBy?: MaterialOrderBy;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  category?: MaterialCategory;
  search?: string;
};

export type GetMaterialsResponse = PageableResponse<ProductMaterial>;
