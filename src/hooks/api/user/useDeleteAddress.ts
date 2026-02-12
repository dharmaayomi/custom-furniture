import useAxios from "@/hooks/useAxios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type DeleteAddressOptions = {
  onSuccess?: (result: unknown) => void;
  onError?: (error: unknown) => void;
};

const useDeleteAddress = (
  userId?: number,
  addressId?: number,
  options?: DeleteAddressOptions,
) => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!userId || !addressId) {
        throw new Error("Missing userId or addressId");
      }
      const { data } = await axiosInstance.delete(
        `/user/${userId}/address/${addressId}`,
      );
      return data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["user-addresses", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-address", userId, addressId],
      });
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export default useDeleteAddress;
