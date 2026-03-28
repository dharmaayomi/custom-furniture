import useAxios from "@/hooks/useAxios";
import { PaymentAttempt } from "@/types/payment";
import { useQuery } from "@tanstack/react-query";

const normalizePaymentAttempt = (payload: unknown): PaymentAttempt | null => {
  const raw = payload as any;

  if (raw?.data && typeof raw.data === "object" && !Array.isArray(raw.data)) {
    return raw.data as PaymentAttempt;
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as PaymentAttempt;
  }

  return null;
};

const useGetAttemptDetail = (attemptId?: string) => {
  const axiosInstance = useAxios();
  const normalizedAttemptId = attemptId?.trim() ?? "";

  return useQuery<PaymentAttempt | null>({
    queryKey: ["payment-attempt", normalizedAttemptId],
    enabled: Boolean(normalizedAttemptId),
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/payment/${encodeURIComponent(normalizedAttemptId)}/detail-attempt`,
      );
      return normalizePaymentAttempt(data);
    },
  });
};

export default useGetAttemptDetail;
