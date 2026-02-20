import { PageableResponse } from "./pagination";

export type ShareableDesign = {
  id: number;
  designCode: string;
  configHash: string;
  configuration: unknown;
  expiresAt?: string | null;
  createdAt: string;
};

export type SavedDesign = {
  id: number;
  userId: number;
  designCode: string;
  designName: string;
  configuration: any;
  fileFinalUrl?: string;
  previewUrl?: string;
  createdAt: string;
};

export type GetSavedDesignsQuery = {
  page?: number;
  perPage?: number;
  sortBy?: "createdAt" | "updatedAt" | "designName";
  orderBy?: "asc" | "desc";
};

export type GetSavedDesignsResponse = PageableResponse<SavedDesign>;
