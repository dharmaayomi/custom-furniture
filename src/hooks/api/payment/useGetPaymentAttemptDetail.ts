import useAxios from "@/hooks/useAxios";
import { PaymentAttempt } from "@/types/payment";
import { useQuery } from "@tanstack/react-query";

const normalizePaymentAttempts = (payload: unknown): PaymentAttempt[] => {
  const raw = payload as any;

  if (Array.isArray(raw?.data)) {
    return raw.data as PaymentAttempt[];
  }

  if (Array.isArray(raw)) {
    return raw as PaymentAttempt[];
  }

  return [];
};

const useGetPaymentAttemptDetail = (paymentId?: string) => {
  const axiosInstance = useAxios();
  const normalizedPaymentId = paymentId?.trim() ?? "";

  return useQuery<PaymentAttempt[]>({
    queryKey: ["payment-attempt-detail", normalizedPaymentId],
    enabled: Boolean(normalizedPaymentId),
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/payment/${encodeURIComponent(normalizedPaymentId)}/attempts`,
      );

      return normalizePaymentAttempts(data);
    },
  });
};

export default useGetPaymentAttemptDetail;
