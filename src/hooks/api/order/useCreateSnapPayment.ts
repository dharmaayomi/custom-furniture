import useAxios from "@/hooks/useAxios";
import { useMutation } from "@tanstack/react-query";
import z from "zod";

const createSnapPaymentSchema = z.object({
  orderId: z.string().trim().min(1, "orderId is required"),
  phase: z.enum(["DP", "FULL"]).optional(),
});

export type CreateSnapPaymentInput = z.infer<typeof createSnapPaymentSchema>;

export type CreateSnapPaymentResponse = {
  orderId: string;
  paymentId: string;
  phase: string;
  amount: number;
  paymentUrl: string;
  token?: string;
};

const useCreateSnapPayment = () => {
  const axiosInstance = useAxios();
  return useMutation({
    mutationFn: async (payload: CreateSnapPaymentInput) => {
      const validated = createSnapPaymentSchema.parse(payload);
      const { data } = await axiosInstance.post(
        "/payment/create-snap",
        validated,
      );
      return ((data as { data?: CreateSnapPaymentResponse })?.data ??
        data) as CreateSnapPaymentResponse;
    },
  });
};

export default useCreateSnapPayment;
