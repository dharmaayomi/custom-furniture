import useAxios from "@/hooks/useAxios";
import { useMutation } from "@tanstack/react-query";

export type DesignPreviewUploadSignature = {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
};

const useGetDesignPreviewUploadSignature = () => {
  const axiosInstance = useAxios();

  return useMutation({
    mutationFn: async () => {
      const { data } = await axiosInstance.post(
        "/design/preview-upload-signature",
      );
      return ((data as any)?.data ?? data) as DesignPreviewUploadSignature;
    },
  });
};

export default useGetDesignPreviewUploadSignature;
