import useAxios from "@/hooks/useAxios";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-error";
import { loadDesignCodeFromStorage, saveDesignCodeToStorage } from "@/lib/designCode";
import { useRoomStore } from "@/store/useRoomStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import z from "zod";

export const saveDesignSchema = z.object({
  configuration: z.record(z.string(), z.any()),
  designCode: z.string().optional(),
  designName: z.string().min(1, "Design name is required"),
  fileFinalUrl: z.string().url().optional(),
  previewUrl: z.string().url().optional(),
});

export type SaveDesignInput = z.infer<typeof saveDesignSchema>;
const useSaveDesign = () => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();
  const storedDesignCode = useRoomStore((state) => state.designCode);
  const setDesignCode = useRoomStore((state) => state.setDesignCode);

  return useMutation({
    mutationFn: async (data: SaveDesignInput) => {
      const localDesignCode = loadDesignCodeFromStorage();
      const finalDesignCode =
        data.designCode || storedDesignCode || localDesignCode || undefined;
      const result = await axiosInstance.post("/design/save-design", {
        configuration: data.configuration,
        designName: data.designName,
        ...(data.fileFinalUrl ? { fileFinalUrl: data.fileFinalUrl } : {}),
        ...(data.previewUrl ? { previewUrl: data.previewUrl } : {}),
        ...(finalDesignCode ? { designCode: finalDesignCode } : {}),
      });
      return result.data;
    },
    onSuccess: (result) => {
      const payload = (result as any)?.data ?? result;
      const designCode = payload?.designCode;
      if (designCode) {
        setDesignCode(designCode);
        saveDesignCodeToStorage(designCode);
      }
      queryClient.invalidateQueries({
        queryKey: ["saved-designs"],
      });
      queryClient.invalidateQueries({
        queryKey: ["saved-design"],
      });
    },
    onError: (error) => {
      console.error("[useSaveDesign] request failed", {
        status: getApiErrorStatus(error),
        message: getApiErrorMessage(error, "Failed to save design"),
      });
    },
  });
};

export default useSaveDesign;
