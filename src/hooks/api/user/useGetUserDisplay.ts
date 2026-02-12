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
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: !!userId,
  });
};

export default useGetUserDisplay;
