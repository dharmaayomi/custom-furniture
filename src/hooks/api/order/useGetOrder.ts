import useAxios from "@/hooks/useAxios";
import { normalizeCustomOrder } from "@/lib/order-normalize";
import { CustomOrder } from "@/types/customOrder";
import { useQuery } from "@tanstack/react-query";

const useGetOrder = (orderId?: string) => {
  const axiosInstance = useAxios();
  return useQuery<CustomOrder>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/order/${orderId}`);
      const order = ((data as { data?: CustomOrder })?.data ?? data) as CustomOrder;
      return normalizeCustomOrder(order);
    },
    enabled: !!orderId,
  });
};

export default useGetOrder;
