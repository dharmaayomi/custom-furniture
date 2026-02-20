import useAxios from "@/hooks/useAxios";
import { useMutation } from "@tanstack/react-query";
import React, { use } from "react";

const useCreateMaterial = () => {
  const axiosInstance = useAxios();
  return useMutation({
    mutationFn: async () => {},
  });
};

export default useCreateMaterial;
