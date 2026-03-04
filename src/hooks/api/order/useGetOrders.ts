import useAxios from "@/hooks/useAxios";
import { normalizeCustomOrderList } from "@/lib/order-normalize";
import { CustomOrder } from "@/types/customOrder";
import { useQuery } from "@tanstack/react-query";
import { OrderStatus } from "@/types/customOrder";

type UseGetOrdersOptions = {
  status?: OrderStatus;
};

const useGetOrders = (options?: UseGetOrdersOptions) => {
  const axiosInstance = useAxios();
  const status = options?.status;

  return useQuery<CustomOrder[]>({
    queryKey: ["orders", status ?? "ALL"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/order", {
        params: status ? { status } : undefined,
      });
      const orders = ((data as { data?: CustomOrder[] })?.data ?? data) as CustomOrder[];
      return normalizeCustomOrderList(orders);
    },
  });
};

export default useGetOrders;
