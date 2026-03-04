import useAxios from "@/hooks/useAxios";
import { GetUnreadCountResponse } from "@/types/notification";
import { useQuery } from "@tanstack/react-query";

const normalizeUnreadCountResponse = (payload: unknown): GetUnreadCountResponse => {
  const raw = payload as any;

  if (typeof raw?.unreadCount === "number") {
    return raw as GetUnreadCountResponse;
  }

  if (typeof raw?.data?.unreadCount === "number") {
    return raw.data as GetUnreadCountResponse;
  }

  return { unreadCount: 0 };
};

const useGetUnreadCount = (enabled = true) => {
  const axiosInstance = useAxios();

  return useQuery<GetUnreadCountResponse>({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/notification/unread-count");
      return normalizeUnreadCountResponse(data);
    },
    enabled,
  });
};

export default useGetUnreadCount;
