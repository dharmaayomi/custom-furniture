import useAxios from "@/hooks/useAxios";
import { CustomOrderPayment } from "@/types/customOrder";
import { useQuery } from "@tanstack/react-query";

const normalizeUserPaymentsResponse = (payload: unknown): CustomOrderPayment[] => {
  if (Array.isArray(payload)) return payload as CustomOrderPayment[];

  const wrapped = payload as { data?: unknown };
  if (Array.isArray(wrapped?.data)) {
    return wrapped.data as CustomOrderPayment[];
  }

  return [];
};

const useGetUserPayments = (userId?: number) => {
  const axiosInstance = useAxios();

  return useQuery<CustomOrderPayment[]>({
    queryKey: ["user-payments", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error("userId is required");
      }

      const { data } = await axiosInstance.get(`/user/${userId}/payments`);
      return normalizeUserPaymentsResponse(data);
    },
    staleTime: 60 * 1000,
  });
};

export default useGetUserPayments;
