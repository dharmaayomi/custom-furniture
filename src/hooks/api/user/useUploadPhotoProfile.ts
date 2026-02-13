import useAxios from "@/hooks/useAxios";
import { User } from "@/types/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UploadAvatarOptions = {
  onSuccess?: (result: User) => void;
  onError?: (error: unknown) => void;
};

const useUploadAvatarProfile = (
  userId?: number,
  options?: UploadAvatarOptions,
) => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!userId) {
        throw new Error("Missing userId");
      }

      const formData = new FormData();
      formData.append("avatarUrl", file);

      const { data } = await axiosInstance.post(
        `/user/avatar/${userId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      return data as User;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["user", userId], result);
      queryClient.setQueryData(["user-display", userId], result);
      queryClient.refetchQueries({
        queryKey: ["user", userId],
        exact: true,
      });
      queryClient.refetchQueries({
        queryKey: ["user-display", userId],
        exact: true,
      });
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export default useUploadAvatarProfile;
