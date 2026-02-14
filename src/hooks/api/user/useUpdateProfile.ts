import useAxios from "@/hooks/useAxios";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-error";
import { User } from "@/types/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import z from "zod";

export const updateProfileSchema = z.object({
  userName: z.string().optional(),
  phoneNumber: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

type UpdateProfileOptions = {
  onSuccess?: (result: User) => void;
  onError?: (error: unknown) => void;
};

const useUpdateProfile = (userId?: number, options?: UpdateProfileOptions) => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateProfileInput) => {
      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
      );
      const endpoint = "/user/profile";
      const { data } = await axiosInstance.patch(endpoint, cleanedPayload);
      return data as User;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["user", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-display", userId],
      });
      queryClient.setQueryData(["user", userId], result);
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      console.error("[useUpdateProfile] request failed", {
        status: getApiErrorStatus(error),
        message: getApiErrorMessage(error, "Failed to update profile."),
      });
      options?.onError?.(error);
    },
  });
};

export default useUpdateProfile;
