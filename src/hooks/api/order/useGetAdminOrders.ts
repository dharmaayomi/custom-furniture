import useAxios from "@/hooks/useAxios";
import { normalizeCustomOrderList } from "@/lib/order-normalize";
import { PageableResponse } from "@/types/pagination";
import { CustomOrder, OrderStatus } from "@/types/customOrder";
import { useQuery } from "@tanstack/react-query";

type AdminOrderSortBy =
  | "id"
  | "orderNumber"
  | "status"
  | "deliveryType"
  | "grandTotalPrice"
  | "totalPaid"
  | "remaining"
  | "createdAt"
  | "updatedAt";

type AdminOrderOrderBy = "asc" | "desc";

type GetAdminOrdersQuery = {
  page?: number;
  perPage?: number;
  sortBy?: AdminOrderSortBy;
  orderBy?: AdminOrderOrderBy;
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
};

type GetAdminOrdersResponse = PageableResponse<CustomOrder>;

const emptyResponse: GetAdminOrdersResponse = {
  data: [],
  meta: {
    page: 1,
    perPage: 0,
    total: 0,
    hasNext: false,
    hasPrevious: false,
  },
};

const normalizeAdminOrdersResponse = (
  payload: unknown,
): GetAdminOrdersResponse => {
  const raw = payload as any;

  if (Array.isArray(raw?.data) && raw?.meta) {
    const normalized = raw as GetAdminOrdersResponse;
    return {
      ...normalized,
      data: normalizeCustomOrderList(normalized.data),
    };
  }

  if (Array.isArray(raw?.data?.data) && raw?.data?.meta) {
    const normalized = raw.data as GetAdminOrdersResponse;
    return {
      ...normalized,
      data: normalizeCustomOrderList(normalized.data),
    };
  }

  return emptyResponse;
};

const useGetAdminOrders = (query?: GetAdminOrdersQuery) => {
  const axiosInstance = useAxios();

  const normalizedQuery: Required<
    Pick<GetAdminOrdersQuery, "page" | "perPage" | "sortBy" | "orderBy">
  > &
    Omit<GetAdminOrdersQuery, "page" | "perPage" | "sortBy" | "orderBy"> = {
    page: query?.page ?? 1,
    perPage: query?.perPage ?? 50,
    sortBy: query?.sortBy ?? "createdAt",
    orderBy: query?.orderBy ?? "desc",
    status: query?.status,
    dateFrom: query?.dateFrom,
    dateTo: query?.dateTo,
  };

  return useQuery<GetAdminOrdersResponse>({
    queryKey: ["admin-orders", normalizedQuery],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/order/admin", {
        params: normalizedQuery,
      });
      return normalizeAdminOrdersResponse(data);
    },
  });
};

export default useGetAdminOrders;
