import useAxios from "@/hooks/useAxios";
import { useMutation } from "@tanstack/react-query";
import z from "zod";

const corePayloadSchema = z.record(z.string(), z.unknown());

const createSnapPaymentSchema = z.object({
  orderId: z.string().trim().min(1, "orderId is required"),
  phase: z.enum(["DP", "PROGRESS_1", "PROGRESS_2", "FINAL"]).optional(),
  channel: z.enum(["SNAP", "CORE"]).optional(),
  corePayload: corePayloadSchema.optional(),
});

export type CreateSnapPaymentInput = z.infer<typeof createSnapPaymentSchema>;

export type CreateSnapPaymentResponse = {
  orderId: string;
  paymentId: string;
  phase: string;
  amount: number;
  paymentUrl?: string | null;
  token?: string;
  channel?: "SNAP" | "CORE";
  paymentType?: string;
  vaNumbers?: Array<{ bank: string; va_number: string }>;
  permataVaNumber?: string | null;
  billKey?: string | null;
  billerCode?: string | null;
  qrString?: string | null;
  actions?: Array<{ name?: string; method?: string; url: string }>;
  raw?: unknown;
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
