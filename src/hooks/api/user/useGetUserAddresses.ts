import useAxios from "@/hooks/useAxios";
import { Address } from "@/types/address";
import { useQuery } from "@tanstack/react-query";

const useGetUserAddresses = (userId?: number) => {
  const axiosInstance = useAxios();
  return useQuery<Address[]>({
    queryKey: ["user-addresses", userId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/user/${userId}/address`);
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: !!userId,
  });
};

export default useGetUserAddresses;
