import useAxios from "@/hooks/useAxios";
import { normalizeCustomOrder } from "@/lib/order-normalize";
import { CustomOrder } from "@/types/customOrder";
import { useQuery } from "@tanstack/react-query";

type GetAdminOrderResponse = CustomOrder | null;

const normalizeAdminOrderResponse = (payload: unknown): GetAdminOrderResponse => {
  const raw = payload as any;

  if (raw?.data && typeof raw.data === "object" && !Array.isArray(raw.data)) {
    return normalizeCustomOrder(raw.data as CustomOrder);
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return normalizeCustomOrder(raw as CustomOrder);
  }

  return null;
};

const useGetAdminOrder = (orderId?: string) => {
  const axiosInstance = useAxios();

  return useQuery<GetAdminOrderResponse>({
    queryKey: ["admin-order", orderId],
    enabled: Boolean(orderId),
    queryFn: async () => {
      if (!orderId) {
        throw new Error("orderId is required");
      }

      const { data } = await axiosInstance.get(`/order/admin/${orderId}`);
      return normalizeAdminOrderResponse(data);
    },
  });
};

export default useGetAdminOrder;
