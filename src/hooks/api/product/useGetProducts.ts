import useAxios from "@/hooks/useAxios";
import { GetProductsQuery, GetProductsResponse } from "@/types/product";
import { useQuery } from "@tanstack/react-query";

const useGetProducts = (userId?: number, query?: GetProductsQuery) => {
  const axiosInstance = useAxios();

  return useQuery<GetProductsResponse>({
    queryKey: ["products", query, userId],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/product", {
        params: query,
      });
      return data;
    },
    enabled: !!userId,
  });
};

export default useGetProducts;
