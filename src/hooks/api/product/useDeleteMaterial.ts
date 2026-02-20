import useAxios from "@/hooks/useAxios";
import { useMutation } from "@tanstack/react-query";

const useDeleteMaterial = () => {
  const axiosInstance = useAxios();
  return useMutation({
    mutationFn: async () => {},
  });
};

export default useDeleteMaterial;
