import { axiosInstance } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import z from "zod";

export const setPasswordAfterVerifSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?`~]/,
      "Password must contain at least one special character",
    ),
});

export type SetPasswordAfterVerifInput = z.infer<
  typeof setPasswordAfterVerifSchema
>;

type SetPasswordAfterVerifOptions = {
  onSuccess?: (result: unknown) => void;
  onError?: (error: unknown) => void;
};

const useSetPasswordAfterVerif = (
  token: string,
  options?: SetPasswordAfterVerifOptions,
) => {
  return useMutation({
    mutationFn: async (payload: SetPasswordAfterVerifInput) => {
      const validatedPayload = setPasswordAfterVerifSchema.parse(payload);

      const { data } = await axiosInstance.post(
        "/auth/verify-set-password",
        validatedPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return data;
    },
    onSuccess: (result) => {
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export default useSetPasswordAfterVerif;
