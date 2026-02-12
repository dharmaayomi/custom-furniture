import useAxios from "@/hooks/useAxios";
import { Address } from "@/types/address";
import { useQuery } from "@tanstack/react-query";

const useGetUserAddresses = (userId: number) => {
  const axiosInstance = useAxios();
  return useQuery<Address[]>({
    queryKey: ["user-addresses", userId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/user/${userId}/address`);
      return data;
    },
    enabled: !!userId,
  });
};

export default useGetUserAddresses;
