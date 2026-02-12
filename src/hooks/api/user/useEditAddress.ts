import useAxios from "@/hooks/useAxios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import z from "zod";

export const editAddressSchema = z.object({
  label: z.string().optional(),
  recipientName: z.string().optional(),
  phoneNumber: z.string().optional(),
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
  latitude: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? undefined
        : Number(value),
    z.number().optional(),
  ),
  longitude: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? undefined
        : Number(value),
    z.number().optional(),
  ),
  postalCode: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? undefined
        : Number(value),
    z.number().optional(),
  ),
});

export type EditAddressSchema = z.infer<typeof editAddressSchema>;

const useEditAddress = (userId: number, addressId: number) => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: EditAddressSchema) => {
      if (!userId || !addressId) {
        throw new Error("Missing userId or addressId");
      }
      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
      );
      const { data } = await axiosInstance.patch(
        `/user/${userId}/address/${addressId}`,
        cleanedPayload,
      );
      return data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["user-addresses", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-address", userId, addressId],
      });
      queryClient.setQueryData(["user-address", userId, addressId], result);
    },
  });
};

export default useEditAddress;
