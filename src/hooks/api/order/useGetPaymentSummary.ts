import useAxios from "@/hooks/useAxios";
import { useQuery } from "@tanstack/react-query";

export interface OrderPaymentSummary {
  totalPaid: number;
  remaining: number;
  dpAmount: number;
  dueNow: number;
}

const normalizePaymentSummaryResponse = (payload: unknown): OrderPaymentSummary => {
  const wrapped = payload as { data?: unknown };
  const source = (wrapped?.data ?? payload) as Partial<OrderPaymentSummary>;

  return {
    totalPaid: Number(source.totalPaid ?? 0),
    remaining: Number(source.remaining ?? 0),
    dpAmount: Number(source.dpAmount ?? 0),
    dueNow: Number(source.dueNow ?? 0),
  };
};

const useGetPaymentSummary = (orderId?: string) => {
  const axiosInstance = useAxios();

  return useQuery<OrderPaymentSummary>({
    queryKey: ["order-payment-summary", orderId],
    enabled: Boolean(orderId),
    queryFn: async () => {
      if (!orderId) {
        throw new Error("orderId is required");
      }

      const { data } = await axiosInstance.get(`/order/${orderId}/summary`);
      return normalizePaymentSummaryResponse(data);
    },
    staleTime: 60 * 1000,
  });
};

export default useGetPaymentSummary;
