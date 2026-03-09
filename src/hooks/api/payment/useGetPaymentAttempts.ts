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

const useGetPaymentAttempts = () => {
  const axiosInstance = useAxios();

  return useQuery<PaymentAttempt[]>({
    queryKey: ["user-payment-attempts"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/user/payment-attempts");

      return normalizePaymentAttempts(data);
    },
  });
};

export default useGetPaymentAttempts;
