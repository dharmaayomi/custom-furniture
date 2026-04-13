import useAxios from "@/hooks/useAxios";
import { normalizeCustomOrder } from "@/lib/order-normalize";
import { CustomOrder } from "@/types/customOrder";
import { useQuery } from "@tanstack/react-query";

type UseGetOrderOptions = {
  enabled?: boolean;
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  retry?: boolean | number;
};

const useGetOrder = (orderId?: string, options?: UseGetOrderOptions) => {
  const axiosInstance = useAxios();

  return useQuery<CustomOrder>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/order/${orderId}`);
      const order = ((data as { data?: CustomOrder })?.data ??
        data) as CustomOrder;
      return normalizeCustomOrder(order);
    },
    enabled: options?.enabled ?? !!orderId,
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: options?.refetchOnWindowFocus,
    staleTime: options?.staleTime,
    retry: options?.retry,
  });
};

export default useGetOrder;
