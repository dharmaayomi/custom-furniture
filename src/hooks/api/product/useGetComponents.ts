import useAxios from "@/hooks/useAxios";
import {
  GetComponentsQuery,
  GetComponentsResponse,
} from "@/types/componentProduct";

import { useQuery } from "@tanstack/react-query";

const normalizePageableResponse = (payload: unknown): GetComponentsResponse => {
  const raw = payload as any;

  // Direct shape: { data: [...], meta: {...} }
  if (Array.isArray(raw?.data) && raw?.meta) {
    return raw as GetComponentsResponse;
  }

  // Nested shape: { data: { data: [...], meta: {...} } }
  if (Array.isArray(raw?.data?.data) && raw?.data?.meta) {
    return raw.data as GetComponentsResponse;
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

const useGetComponents = (query?: GetComponentsQuery, enabled = true) => {
  const axiosInstance = useAxios();

  return useQuery<GetComponentsResponse>({
    queryKey: ["components", query],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/product/component", {
        params: query,
      });
      return normalizePageableResponse(data);
    },
    enabled,
  });
};

export default useGetComponents;
