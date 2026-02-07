import useAxios from "@/hooks/useAxios";
import { User } from "@/types/user";
import { useQuery } from "@tanstack/react-query";

const useGetUserDisplay = (userId?: number) => {
  const axiosInstance = useAxios();
  return useQuery<User>({
    queryKey: ["user-display", userId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/user/display/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
};

export default useGetUserDisplay;
