export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PageableResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationQueries {
  perPage?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
