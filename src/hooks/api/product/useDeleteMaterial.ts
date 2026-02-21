import useAxios from "@/hooks/useAxios";
import { ProductMaterial } from "@/types/materialProduct";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type DeleteMaterialResponse = Pick<ProductMaterial, "id" | "deletedAt">;

type DeleteMaterialOptions = {
  onSuccess?: (result: DeleteMaterialResponse) => void;
  onError?: (error: unknown) => void;
};

const normalizeResponse = <T>(payload: unknown): T => {
  return ((payload as { data?: unknown })?.data ?? payload) as T;
};

const useDeleteMaterial = (options?: DeleteMaterialOptions) => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (materialId: string) => {
      const { data } = await axiosInstance.delete(
        `/product/material/${materialId}`,
      );
      return normalizeResponse<DeleteMaterialResponse>(data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["material", result.id] });
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export default useDeleteMaterial;
