import { axiosInstance } from "@/lib/axios";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-error";
import { useMutation } from "@tanstack/react-query";
import z from "zod";

export const confirmDeleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export type ConfirmDeleteAccountInput = z.infer<
  typeof confirmDeleteAccountSchema
>;

type ConfirmDeleteAccountResponse = {
  message: string;
};

type ConfirmDeleteAccountOptions = {
  onSuccess?: (result: ConfirmDeleteAccountResponse) => void;
  onError?: (error: unknown) => void;
};

const useConfirmDeleteAccount = (
  token: string,
  options?: ConfirmDeleteAccountOptions,
) => {
  return useMutation({
    mutationFn: async (payload: ConfirmDeleteAccountInput) => {
      const validatedPayload = confirmDeleteAccountSchema.parse(payload);
      const { data } = await axiosInstance.post(
        "/auth/confirm-delete-account",
        validatedPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return data as ConfirmDeleteAccountResponse;
    },
    onSuccess: (result) => {
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      console.error("[useConfirmDeleteAccount] request failed", {
        status: getApiErrorStatus(error),
        message: getApiErrorMessage(error, "Failed to delete account."),
      });
      options?.onError?.(error);
    },
  });
};

export default useConfirmDeleteAccount;
