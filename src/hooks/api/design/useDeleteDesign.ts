import useAxios from "@/hooks/useAxios";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-error";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type DeleteDesignOptions = {
  onSuccess?: (result: unknown) => void;
  onError?: (error: unknown) => void;
};

const useDeleteDesign = (
  userId?: number,
  designCode?: string,
  options?: DeleteDesignOptions,
) => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!designCode) {
        throw new Error("Missing designCode");
      }
      const { data } = await axiosInstance.delete(`/design/delete/${designCode}`);
      return data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["saved-designs", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["saved-design", userId, designCode],
      });
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      console.error("[useDeleteDesign] request failed", {
        status: getApiErrorStatus(error),
        message: getApiErrorMessage(error, "Failed to delete design."),
      });
      options?.onError?.(error);
    },
  });
};

export default useDeleteDesign;
