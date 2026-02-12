import { axiosInstance } from "@/lib/axios";
import { ShareableDesign } from "@/types/shareableDesign";
import { useQuery } from "@tanstack/react-query";

const useGetSharedDesignByCode = (designCode: string) => {
  return useQuery<ShareableDesign>({
    queryKey: ["shareable-design", designCode],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/design/shareable-design/${designCode}`,
      );
      return data;
    },
    enabled: !!designCode,
  });
};
export default useGetSharedDesignByCode;
