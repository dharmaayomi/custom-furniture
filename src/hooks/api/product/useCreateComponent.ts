import useAxios from "@/hooks/useAxios";
import { CreateComponentInput, ProductComponent } from "@/types/product";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CreateComponentOptions = {
  onSuccess?: (result: ProductComponent) => void;
  onError?: (error: unknown) => void;
};

const normalizeResponse = <T>(payload: unknown): T => {
  return ((payload as { data?: unknown })?.data ?? payload) as T;
};

const useCreateComponent = (options?: CreateComponentOptions) => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateComponentInput) => {
      const requestPayload: CreateComponentInput = {
        ...payload,
        componentName: payload.componentName.trim(),
        componentUrl: payload.componentUrl.trim(),
        componentDesc: payload.componentDesc.trim(),
        price: Number(payload.price),
        weight: Number(payload.weight),
        componentImageUrls: payload.componentImageUrls
          .map((imageUrl) => imageUrl.trim())
          .filter(Boolean),
      };

      const { data } = await axiosInstance.post(
        "/product/component",
        requestPayload,
      );
      return normalizeResponse<ProductComponent>(data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export default useCreateComponent;
