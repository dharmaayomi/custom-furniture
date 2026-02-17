import useAxios from "@/hooks/useAxios";
import { UpdateProductInput } from "@/types/product";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateProductParams = {
  productId: number;
  payload: UpdateProductInput;
};

const useUpdateProduct = () => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, payload }: UpdateProductParams) => {
      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
      );
      const { data } = await axiosInstance.patch(
        `/product/${productId}`,
        cleanedPayload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export default useUpdateProduct;
