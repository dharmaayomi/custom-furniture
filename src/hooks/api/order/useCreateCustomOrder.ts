import useAxios from "@/hooks/useAxios";
import { normalizeCustomOrder } from "@/lib/order-normalize";
import { CustomOrder } from "@/types/customOrder";
import { useMutation } from "@tanstack/react-query";
import z from "zod";

const deliveryTypeSchema = z.enum(["DELIVERY", "PICKUP", "STORE_DELIVERY"]);

export const createCustomOrderSchema = z
  .object({
    designCode: z.string().trim().optional(),
    previewUrl: z.string().trim().url().optional(),
    deliveryType: deliveryTypeSchema,
    addressId: z.preprocess(
      (value) =>
        value === undefined || value === null || value === ""
          ? undefined
          : Number(value),
      z.number().int().positive().optional(),
    ),
    notes: z.string().trim().optional(),
    configuration: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (value) =>
      Boolean(value.designCode && value.designCode.trim()) ||
      Boolean(value.configuration),
    {
      message: "Either designCode or configuration is required",
      path: ["designCode"],
    },
  )
  .refine(
    (value) => value.deliveryType === "PICKUP" || Boolean(value.addressId),
    {
      message: "Address is required for delivery.",
      path: ["addressId"],
    },
  );

export type CreateCustomOrderInput = z.infer<typeof createCustomOrderSchema>;

type CreateCustomOrderResponse = CustomOrder & {
  userDesign?: unknown;
};

const useCreateCustomOrder = () => {
  const axiosInstance = useAxios();
  return useMutation({
    mutationFn: async (payload: CreateCustomOrderInput) => {
      const validated = createCustomOrderSchema.parse(payload);
      const { data } = await axiosInstance.post<CreateCustomOrderResponse>(
        "/order/create-custom-order",
        validated,
      );
      return normalizeCustomOrder(data);
    },
  });
};

export default useCreateCustomOrder;
