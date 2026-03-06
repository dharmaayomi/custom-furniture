import useAxios from "@/hooks/useAxios";
import { OrderStatus } from "@/types/customOrder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import z from "zod";

const startOrderSchema = z.object({
  orderId: z.string().trim().min(1, "orderId is required"),
});

export type StartOrderInput = z.infer<typeof startOrderSchema>;

export type StartOrderResponse = {
  message: string;
  data: OrderStatus;
};

const useStartOrder = () => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId }: StartOrderInput) => {
      const validated = startOrderSchema.parse({ orderId });
      const { data } = await axiosInstance.patch(
        `/order/admin/${validated.orderId}/start`,
      );

      return ((data as { data?: StartOrderResponse })?.data ??
        data) as StartOrderResponse;
    },
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin-order", variables.orderId],
      });
    },
  });
};

export default useStartOrder;
