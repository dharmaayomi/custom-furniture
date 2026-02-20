import useAxios from "@/hooks/useAxios";
import { ProductComponent, UpdateComponentInput } from "@/types/product";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateComponentParams = {
  componentId: string;
  payload: UpdateComponentInput;
};

const normalizeResponse = <T>(payload: unknown): T => {
  return ((payload as { data?: unknown })?.data ?? payload) as T;
};

const useUpdateComponent = () => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ componentId, payload }: UpdateComponentParams) => {
      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
      ) as UpdateComponentInput;

      if (typeof cleanedPayload.componentName === "string") {
        cleanedPayload.componentName = cleanedPayload.componentName.trim();
      }
      if (typeof cleanedPayload.componentUrl === "string") {
        cleanedPayload.componentUrl = cleanedPayload.componentUrl.trim();
      }
      if (typeof cleanedPayload.componentDesc === "string") {
        cleanedPayload.componentDesc = cleanedPayload.componentDesc.trim();
      }
      if (typeof cleanedPayload.price !== "undefined") {
        cleanedPayload.price = Number(cleanedPayload.price);
      }
      if (typeof cleanedPayload.weight !== "undefined") {
        cleanedPayload.weight = Number(cleanedPayload.weight);
      }
      if (Array.isArray(cleanedPayload.componentImageUrls)) {
        cleanedPayload.componentImageUrls = cleanedPayload.componentImageUrls
          .map((imageUrl) => imageUrl.trim())
          .filter(Boolean);
      }

      const { data } = await axiosInstance.patch(
        `/product/component/${componentId}/edit`,
        cleanedPayload,
      );

      return normalizeResponse<ProductComponent>(data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
      queryClient.invalidateQueries({ queryKey: ["component", result.id] });
    },
  });
};

export default useUpdateComponent;
