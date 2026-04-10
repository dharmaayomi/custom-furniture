import useAxios from "@/hooks/useAxios";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export interface GetDeliveryFeeEstimatesPayload {
  addressId: number;
  configuration: Record<string, unknown>;
}

export interface DeliveryFeeEstimate {
  type: "PICKUP" | "DELIVERY" | "STORE_DELIVERY";
  label: string;
  available: boolean;
  fee: number | null;
}

const useGetDeliveryFeeEstimates = () => {
  const axiosInstance = useAxios();
  return useMutation<DeliveryFeeEstimate[], unknown, GetDeliveryFeeEstimatesPayload>({
    mutationFn: async (payload) => {
      const { data } = await axiosInstance.post<{
        data?: DeliveryFeeEstimate[];
      }>(
        "/order/delivery-fee-estimates",
        payload,
      );
      return ((data as { data?: DeliveryFeeEstimate[] })?.data ??
        data) as DeliveryFeeEstimate[];
    },
    onSuccess: () => {
      toast.success("Estimasi biaya pengiriman berhasil dihitung.");
    },
    onError: (error) => {
      console.error("[useGetDeliveryFeeEstimates] request failed", error);
      toast.error("Gagal menghitung estimasi biaya pengiriman.");
    },
  });
};

export default useGetDeliveryFeeEstimates;
