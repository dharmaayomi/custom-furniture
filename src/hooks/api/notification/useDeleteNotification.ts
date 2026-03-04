import useAxios from "@/hooks/useAxios";
import { NotificationItem } from "@/types/notification";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";

type DeleteNotificationResponse = Pick<NotificationItem, "id">;
type DeleteNotificationOptions = {
  onSuccess?: (result: DeleteNotificationResponse) => void;
  onError?: (error: unknown) => void;
};
const useDeleteNotification = (options?: DeleteNotificationOptions) => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      const { data } = await axiosInstance.delete(
        `/notification/${notificationId}/delete`,
      );
      return data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export default useDeleteNotification;
