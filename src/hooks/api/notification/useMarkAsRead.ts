import useAxios from "@/hooks/useAxios";
import { NotificationItem } from "@/types/notification";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useMarkAsRead = () => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      const { data } = await axiosInstance.patch<NotificationItem>(
        `/notification/${notificationId}/read`,
      );
      return ((data as { data?: NotificationItem })?.data ??
        data) as NotificationItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
};

export default useMarkAsRead;
