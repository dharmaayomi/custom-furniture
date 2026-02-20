import useAxios from "@/hooks/useAxios";
import { GetComponentsQuery, GetComponentsResponse } from "@/types/product";
import { useQuery } from "@tanstack/react-query";

const useGetComponents = (query?: GetComponentsQuery, enabled = true) => {
  const axiosInstance = useAxios();

  return useQuery<GetComponentsResponse>({
    queryKey: ["components", query],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/product/component", {
        params: query,
      });
      return data;
    },
    enabled,
  });
};

export default useGetComponents;
