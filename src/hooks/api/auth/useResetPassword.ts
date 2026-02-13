import { axiosInstance } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import z from "zod";

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(1, "New password is required"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

type ResetPasswordResponse = {
  message: string;
};

type ResetPasswordOptions = {
  onSuccess?: (result: ResetPasswordResponse) => void;
  onError?: (error: unknown) => void;
};

const useResetPassword = (token: string, options?: ResetPasswordOptions) => {
  return useMutation({
    mutationFn: async (payload: ResetPasswordInput) => {
      const validatedPayload = resetPasswordSchema.parse(payload);
      const { data } = await axiosInstance.post(
        "/auth/reset-password",
        validatedPayload,
        {
          params: {
            token,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return data as ResetPasswordResponse;
    },
    onSuccess: (result) => {
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      const err = error as {
        message?: string;
        response?: { status?: number; data?: unknown };
      };
      console.error("[useResetPassword] request failed", {
        status: err.response?.status,
        response: err.response?.data,
        message: err.message,
        hasToken: Boolean(token),
        tokenLength: token?.length ?? 0,
      });
      options?.onError?.(error);
    },
  });
};

export default useResetPassword;
