import useAxios from "@/hooks/useAxios";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-error";
import { User } from "@/types/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import z from "zod";

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(1, "New password is required"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

type ChangePasswordOptions = {
  onSuccess?: (result: User) => void;
  onError?: (error: unknown) => void;
};

const useChangePassword = (
  userId?: number,
  options?: ChangePasswordOptions,
) => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ChangePasswordInput) => {
      const validatedPayload = changePasswordSchema.parse(payload);
      const { data } = await axiosInstance.patch(
        "/auth/change-password",
        validatedPayload,
      );
      return data as User;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["user", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-display", userId],
      });
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      console.error("[useChangePassword] request failed", {
        status: getApiErrorStatus(error),
        message: getApiErrorMessage(error, "Failed to change password."),
      });
      options?.onError?.(error);
    },
  });
};

export default useChangePassword;
