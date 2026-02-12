import useAxios from "@/hooks/useAxios";
import { SavedDesign } from "@/types/shareableDesign";
import { useQuery } from "@tanstack/react-query";

const useGetSavedDesign = (userId?: number) => {
  const axiosInstance = useAxios();
  return useQuery<SavedDesign[]>({
    queryKey: ["saved-designs", userId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/design/saved-designs`);
      return data;
    },
    enabled: !!userId,
  });
};

export default useGetSavedDesign;
