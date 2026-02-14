import useAxios from "@/hooks/useAxios";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-error";
import { useMutation } from "@tanstack/react-query";
import z from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

type ForgotPasswordResponse = {
  message: string;
};

type ForgotPasswordOptions = {
  onSuccess?: (result: ForgotPasswordResponse) => void;
  onError?: (error: unknown) => void;
};

const useForgotPassword = (options?: ForgotPasswordOptions) => {
  const axiosInstance = useAxios();

  return useMutation({
    mutationFn: async (payload: ForgotPasswordInput) => {
      const validatedPayload = forgotPasswordSchema.parse(payload);
      const { data } = await axiosInstance.post(
        "/auth/forgot-password",
        validatedPayload,
      );
      return data as ForgotPasswordResponse;
    },
    onSuccess: (result) => {
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      console.error("[useForgotPassword] request failed", {
        status: getApiErrorStatus(error),
        message: getApiErrorMessage(error, "Failed to send reset email."),
      });
      options?.onError?.(error);
    },
  });
};

export default useForgotPassword;
