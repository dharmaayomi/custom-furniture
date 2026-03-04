import useAxios from "@/hooks/useAxios";
import {
  GetNotificationsQuery,
  GetNotificationsResponse,
} from "@/types/notification";
import { useQuery } from "@tanstack/react-query";

const emptyResponse: GetNotificationsResponse = {
  data: [],
  unreadCount: 0,
  meta: {
    page: 1,
    perPage: 0,
    total: 0,
    hasNext: false,
    hasPrevious: false,
  },
};

const normalizeNotificationsResponse = (
  payload: unknown,
): GetNotificationsResponse => {
  const raw = payload as any;

  if (Array.isArray(raw?.data) && typeof raw?.unreadCount === "number") {
    return raw as GetNotificationsResponse;
  }

  if (
    Array.isArray(raw?.data?.data) &&
    typeof raw?.data?.unreadCount === "number"
  ) {
    return raw.data as GetNotificationsResponse;
  }

  return emptyResponse;
};

const useGetNotifications = (query?: GetNotificationsQuery, enabled = true) => {
  const axiosInstance = useAxios();

  const normalizedQuery: Required<
    Pick<GetNotificationsQuery, "page" | "perPage" | "sortBy" | "orderBy">
  > &
    Omit<GetNotificationsQuery, "page" | "perPage" | "sortBy" | "orderBy"> = {
    page: query?.page ?? 1,
    perPage: query?.perPage ?? 6,
    sortBy: query?.sortBy ?? "createdAt",
    orderBy: query?.orderBy ?? "desc",
    search: query?.search,
  };

  return useQuery<GetNotificationsResponse>({
    queryKey: ["notifications", normalizedQuery],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/notification", {
        params: normalizedQuery,
      });
      return normalizeNotificationsResponse(data);
    },
    enabled,
  });
};

export default useGetNotifications;
