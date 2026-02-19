import useAxios from "@/hooks/useAxios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type DeleteProductResponse = {
  id: string;
  deletedAt: string;
};

type DeleteProductOptions = {
  onSuccess?: (result: DeleteProductResponse) => void;
  onError?: (error: unknown) => void;
};

const normalizeResponse = <T,>(payload: unknown): T => {
  return ((payload as { data?: unknown })?.data ?? payload) as T;
};

const useDeleteProduct = (options?: DeleteProductOptions) => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await axiosInstance.delete(`/product/${productId}`);
      return normalizeResponse<DeleteProductResponse>(data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", result.id] });
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export default useDeleteProduct;
