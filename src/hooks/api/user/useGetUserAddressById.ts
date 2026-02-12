import useAxios from "@/hooks/useAxios";
import { Address } from "@/types/address";
import { useQuery } from "@tanstack/react-query";
import React from "react";

const useGetUserAddressById = (userId?: number, addressId?: number) => {
  const axiosInstance = useAxios();
  return useQuery<Address>({
    queryKey: ["user-address", userId, addressId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/user/${userId}/address/${addressId}`,
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: !!userId && !!addressId,
  });
};

export default useGetUserAddressById;
