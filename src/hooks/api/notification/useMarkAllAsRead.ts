import useAxios from "@/hooks/useAxios";
import { MarkAllAsReadResponse } from "@/types/notification";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useMarkAllAsRead = () => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await axiosInstance.patch<MarkAllAsReadResponse>(
        "/notification/read-all",
      );
      return ((data as { data?: MarkAllAsReadResponse })?.data ??
        data) as MarkAllAsReadResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
};

export default useMarkAllAsRead;
