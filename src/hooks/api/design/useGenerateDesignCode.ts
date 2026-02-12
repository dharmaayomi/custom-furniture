import { axiosInstance } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import z from "zod";

export const createSharableDesignSchema = z.object({
  configuration: z.record(z.string(), z.any()),
});

export type CreateSharableDesignInput = z.infer<
  typeof createSharableDesignSchema
>;

type GenerateDesignCodeOptions = {
  onGenerated?: (payload: { designCode: string; shareableUrl: string }) => void;
};

const buildShareLink = (code: string) => {
  if (!code) return "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin || ""}/custom/${code}`;
};

const useGenerateDesignCode = (options?: GenerateDesignCodeOptions) => {
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
      const shareableUrl = buildShareLink(designCode);
      options?.onGenerated?.({ designCode, shareableUrl });
      toast.success("Shareable link generated");
    },
    onError: (error: AxiosError<{ message: string }>) => {},
  });
};

export default useGenerateDesignCode;
