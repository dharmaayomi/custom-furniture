import useAxios from "@/hooks/useAxios";
import { ProductMaterial } from "@/types/materialProduct";
import { useQuery } from "@tanstack/react-query";
import React from "react";
const normalizeResponse = <T>(payload: unknown): T => {
  return ((payload as { data?: unknown })?.data ?? payload) as T;
};
const useGetMaterialById = (materialId?: string) => {
  const axiosInstance = useAxios();

  return useQuery<ProductMaterial>({
    queryKey: ["material", materialId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/product/material/${materialId}`,
      );
      return normalizeResponse<ProductMaterial>(data);
    },
    enabled: !!materialId,
  });
};

export default useGetMaterialById;
