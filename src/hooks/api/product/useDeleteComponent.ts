import useAxios from "@/hooks/useAxios";
import { ProductComponent } from "@/types/product";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type DeleteComponentResponse = Pick<ProductComponent, "id" | "deletedAt">;

type DeleteComponentOptions = {
  onSuccess?: (result: DeleteComponentResponse) => void;
  onError?: (error: unknown) => void;
};

const normalizeResponse = <T>(payload: unknown): T => {
  return ((payload as { data?: unknown })?.data ?? payload) as T;
};

const useDeleteComponent = (options?: DeleteComponentOptions) => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (componentId: string) => {
      const { data } = await axiosInstance.delete(
        `/product/component/${componentId}`,
      );
      return normalizeResponse<DeleteComponentResponse>(data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
      queryClient.invalidateQueries({ queryKey: ["component", result.id] });
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export default useDeleteComponent;
