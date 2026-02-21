import useAxios from "@/hooks/useAxios";
import {
  GetMaterialsQuery,
  GetMaterialsResponse,
} from "@/types/materialProduct";
import { useQuery } from "@tanstack/react-query";
import React from "react";

const normalizePageableResponse = (payload: unknown): GetMaterialsResponse => {
  const raw = payload as any;

  if (Array.isArray(raw?.data) && raw?.meta) {
    return raw as GetMaterialsResponse;
  }

  if (Array.isArray(raw?.data?.data) && raw?.data?.meta) {
    return raw.data as GetMaterialsResponse;
  }

  return {
    data: [],
    meta: {
      hasNext: false,
      hasPrevious: false,
      page: 1,
      perPage: 0,
      total: 0,
    },
  };
};

const useGetMaterials = (query?: GetMaterialsQuery, enabled = true) => {
  const axiosInstance = useAxios();

  return useQuery<GetMaterialsResponse>({
    queryKey: ["materials", query],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/product/material", {
        params: query,
      });
      return normalizePageableResponse(data);
    },
    enabled,
  });
};

export default useGetMaterials;
