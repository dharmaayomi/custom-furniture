import useAxios from "@/hooks/useAxios";
import {
  GetSavedDesignsQuery,
  GetSavedDesignsResponse,
} from "@/types/shareableDesign";
import { useQuery } from "@tanstack/react-query";

const useGetSavedDesign = (
  userId?: number,
  params?: GetSavedDesignsQuery,
) => {
  const axiosInstance = useAxios();
  return useQuery<GetSavedDesignsResponse>({
    queryKey: ["saved-designs", userId, params],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/design/saved-designs`, {
        params,
      });
      return data;
    },
    enabled: !!userId,
  });
};

export default useGetSavedDesign;
