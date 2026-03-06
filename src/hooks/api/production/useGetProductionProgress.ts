import useAxios from "@/hooks/useAxios";
import { ProductionProgress } from "@/types/production";
import { useQuery } from "@tanstack/react-query";

type GetProductionProgressResponse = ProductionProgress[];

const normalizeProductionProgressResponse = (
  payload: unknown,
): GetProductionProgressResponse => {
  const raw = payload as unknown;

  if (Array.isArray(raw)) {
    return raw as GetProductionProgressResponse;
  }

  const nested = (raw as { data?: unknown })?.data;
  if (Array.isArray(nested)) {
    return nested as GetProductionProgressResponse;
  }

  return [];
};

const useGetProductionProgress = (orderId?: string) => {
  const axiosInstance = useAxios();

  return useQuery<GetProductionProgressResponse>({
    queryKey: ["production-progress", orderId],
    enabled: Boolean(orderId),
    queryFn: async () => {
      if (!orderId) {
        throw new Error("orderId is required");
      }

      const { data } = await axiosInstance.get(`/production/${orderId}`);
      return normalizeProductionProgressResponse(data);
    },
  });
};

export default useGetProductionProgress;

