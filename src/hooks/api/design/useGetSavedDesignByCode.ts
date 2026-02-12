import useAxios from "@/hooks/useAxios";
import { SavedDesign } from "@/types/shareableDesign";
import { useQuery } from "@tanstack/react-query";

const useGetSavedDesignByCode = (userId: number, designCode: string) => {
  const axiosInstance = useAxios();
  return useQuery<SavedDesign>({
    queryKey: ["saved-design", userId, designCode],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/design/saved-design/${designCode}`,
      );
      return data;
    },
    enabled: !!userId && !!designCode,
  });
};

export default useGetSavedDesignByCode;
