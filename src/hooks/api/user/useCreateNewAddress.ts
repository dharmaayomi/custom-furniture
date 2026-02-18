import useAxios from "@/hooks/useAxios";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-error";
import { Address } from "@/types/address";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import z from "zod";

export const createAddressSchema = z.object({
  label: z.string().min(1, "Label is required"),
  recipientName: z.string().min(1, "Recipient name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  line1: z.string().min(1, "Street address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  district: z.string().min(1, "District is required"),
  province: z.string().min(1, "Province is required"),
  country: z.string().min(1, "Country is required"),
  isDefault: z.boolean(),
  latitude: z.preprocess((value) => Number(value), z.number()),
  longitude: z.preprocess((value) => Number(value), z.number()),
  postalCode: z.preprocess((value) => Number(value), z.number()),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;

type CreateAddressOptions = {
  onSuccess?: (result: Address) => void;
  onError?: (error: unknown) => void;
};

const useCreateNewAddress = (
  userId?: number,
  options?: CreateAddressOptions,
) => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAddressInput) => {
      if (!userId) {
        throw new Error("Missing userId");
      }
      const { data } = await axiosInstance.post(
        `/user/${userId}/address`,
        payload,
      );
      return data as Address;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(
        ["user-addresses", userId],
        (
          previous:
            | Address[]
            | ({ data: Address[] } & Record<string, unknown>)
            | undefined,
        ) => {
          if (Array.isArray(previous)) {
            return [result, ...previous.filter((item) => item.id !== result.id)];
          }

          if (previous && Array.isArray(previous.data)) {
            return {
              ...previous,
              data: [
                result,
                ...previous.data.filter((item) => item.id !== result.id),
              ],
            };
          }

          return [result];
        },
      );
      queryClient.refetchQueries({
        queryKey: ["user-addresses", userId],
        type: "all",
      });
      queryClient.setQueryData(["user-address", userId, result.id], result);
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      console.error("[useCreateNewAddress] request failed", {
        status: getApiErrorStatus(error),
        message: getApiErrorMessage(error, "Failed to create address."),
      });
      options?.onError?.(error);
    },
  });
};

export default useCreateNewAddress;
