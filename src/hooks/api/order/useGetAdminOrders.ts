import useAxios from "@/hooks/useAxios";
import { PageableResponse } from "@/types/pagination";
import { CustomOrder, OrderStatus } from "@/types/customOrder";
import { useQuery } from "@tanstack/react-query";

type AdminOrderSortBy =
  | "id"
  | "orderNumber"
  | "status"
  | "deliveryType"
  | "grandTotalPrice"
  | "totalAmountPaid"
  | "remainingAmount"
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
    return raw as GetAdminOrdersResponse;
  }

  if (Array.isArray(raw?.data?.data) && raw?.data?.meta) {
    return raw.data as GetAdminOrdersResponse;
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
