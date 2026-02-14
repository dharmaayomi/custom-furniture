import useAxios from "@/hooks/useAxios";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-error";
import { useMutation } from "@tanstack/react-query";
import z from "zod";

export const RequestAccountDeletionSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type RequestDeleteAccountInput = z.infer<
  typeof RequestAccountDeletionSchema
>;

type RequestDeleteAccountResponse = {
  message: string;
};

type RequestDeleteAccountOptions = {
  onSuccess?: (result: RequestDeleteAccountResponse) => void;
  onError?: (error: unknown) => void;
};

const useRequestDeleteAccount = (options?: RequestDeleteAccountOptions) => {
  const axiosInstance = useAxios();

  return useMutation({
    mutationFn: async (payload: RequestDeleteAccountInput) => {
      const validatedPayload = RequestAccountDeletionSchema.parse(payload);
      const { data } = await axiosInstance.post(
        "/auth/request-delete-account",
        validatedPayload,
      );
      return data as RequestDeleteAccountResponse;
    },
    onSuccess: (result) => {
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      console.error("[useRequestDeleteAccount] request failed", {
        status: getApiErrorStatus(error),
        message: getApiErrorMessage(
          error,
          "Failed to request account deletion.",
        ),
      });
      options?.onError?.(error);
    },
  });
};

export default useRequestDeleteAccount;
