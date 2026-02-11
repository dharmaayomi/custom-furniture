import { axiosInstance } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { use } from "react";
import { toast } from "sonner";
import z from "zod";

export const createSharableDesignSchema = z.object({
  configuration: z.record(z.string(), z.any()),
});

export type CreateSharableDesignInput = z.infer<
  typeof createSharableDesignSchema
>;

const useGenerateDesignCode = () => {
  return useMutation({
    mutationFn: async (data: CreateSharableDesignInput) => {
      const result = await axiosInstance.post("/design/create-shareable-code", {
        configuration: data.configuration,
      });
      return result.data;
    },
    onSuccess: (result) => {
      const payload = (result as any)?.data ?? result;
      const designCode = payload?.designCode;
      if (!designCode) {
        toast.error("Failed to create shareable design");
        return;
      }
      toast.success("Shareable link generated");
    },
    onError: (error: AxiosError<{ message: string }>) => {},
  });
};

export default useGenerateDesignCode;
