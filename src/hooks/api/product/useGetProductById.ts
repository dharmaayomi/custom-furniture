import useAxios from "@/hooks/useAxios";
import { ProductBase } from "@/types/product";
import { useQuery } from "@tanstack/react-query";

const useGetProductById = (productId?: string) => {
  const axiosInstance = useAxios();

  return useQuery<ProductBase>({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/product/${productId}`);
      return data;
    },
    enabled: !!productId,
  });
};

export default useGetProductById;
