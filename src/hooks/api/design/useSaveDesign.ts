import useAxios from "@/hooks/useAxios";
import { loadDesignCodeFromStorage, saveDesignCodeToStorage } from "@/lib/designCode";
import { useRoomStore } from "@/store/useRoomStore";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import z from "zod";

export const saveDesignSchema = z.object({
  configuration: z.record(z.string(), z.any()),
  designCode: z.string().optional(),
  designName: z.string().optional(),
  fileFinalUrl: z.string().optional(),
});

export type SaveDesignInput = z.infer<typeof saveDesignSchema>;
const useSaveDesign = () => {
  const axiosInstance = useAxios();
  const storedDesignCode = useRoomStore((state) => state.designCode);
  const setDesignCode = useRoomStore((state) => state.setDesignCode);

  return useMutation({
    mutationFn: async (data: SaveDesignInput) => {
      const localDesignCode = loadDesignCodeFromStorage();
      const finalDesignCode =
        data.designCode || storedDesignCode || localDesignCode || undefined;
      const result = await axiosInstance.post("/design/save-design", {
        configuration: data.configuration,
        ...(data.designName ? { designName: data.designName } : {}),
        ...(data.fileFinalUrl ? { fileFinalUrl: data.fileFinalUrl } : {}),
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
    },
    onError: (error: AxiosError<{ message: string }>) => {},
  });
};

export default useSaveDesign;
