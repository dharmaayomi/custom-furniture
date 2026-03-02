import useAxios from "@/hooks/useAxios";
import { CustomOrder } from "@/types/customOrder";
import { useQuery } from "@tanstack/react-query";

const useGetOrder = (orderId?: string) => {
  const axiosInstance = useAxios();
  return useQuery<CustomOrder>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/order/${orderId}`);
      return ((data as { data?: CustomOrder })?.data ?? data) as CustomOrder;
    },
    enabled: !!orderId,
  });
};

export default useGetOrder;
