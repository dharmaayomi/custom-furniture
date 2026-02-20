import useAxios from "@/hooks/useAxios";
import { ProductComponent } from "@/types/product";
import { useQuery } from "@tanstack/react-query";

const normalizeResponse = <T,>(payload: unknown): T => {
  return ((payload as { data?: unknown })?.data ?? payload) as T;
};

const useGetComponentById = (componentId?: string) => {
  const axiosInstance = useAxios();

  return useQuery<ProductComponent>({
    queryKey: ["component", componentId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/product/component/${componentId}`,
      );
      return normalizeResponse<ProductComponent>(data);
    },
    enabled: !!componentId,
  });
};

export default useGetComponentById;
