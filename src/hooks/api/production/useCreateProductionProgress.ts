import useAxios from "@/hooks/useAxios";
import {
  CreateProductionProgressResponse,
  ProductionProgress,
} from "@/types/production";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import z from "zod";

type CloudinarySignaturePayload = {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
};

const createProductionProgressSchema = z.object({
  orderId: z.string().trim().min(1, "orderId is required"),
  percentage: z.number().int().min(0).max(100),
  photoUrls: z.array(z.string().trim().url()).min(1),
  description: z.string().trim().optional(),
});

export type CreateProductionProgressInput = z.infer<
  typeof createProductionProgressSchema
>;

export type CreateProductionProgressMutationInput = Omit<
  CreateProductionProgressInput,
  "photoUrls"
> & {
  photoUrls?: string[];
  imageFiles?: File[];
};

type CreateProductionProgressPayload = {
  progress: ProductionProgress;
  paymentCreated: CreateProductionProgressResponse["paymentCreated"];
  billing: CreateProductionProgressResponse["billing"];
};

const normalizeResponse = <T>(payload: unknown): T => {
  return ((payload as { data?: unknown })?.data ?? payload) as T;
};

const uploadToCloudinary = async (
  file: File,
  signaturePayload: CloudinarySignaturePayload,
  resourceType: "image" | "raw" | "auto" = "image",
) => {
  const { apiKey, cloudName, folder, signature, timestamp } = signaturePayload;
  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", String(apiKey));
  formData.append("timestamp", String(timestamp));
  formData.append("signature", String(signature));
  formData.append("folder", String(folder));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    let details = "";
    try {
      const errorPayload = await response.json();
      details =
        errorPayload?.error?.message ??
        errorPayload?.message ??
        JSON.stringify(errorPayload);
    } catch {
      details = await response.text();
    }
    throw new Error(
      `Failed to upload image to Cloudinary (${response.status}): ${details || "Unknown error"}`,
    );
  }

  const result = await response.json();
  const secureUrl = result?.secure_url;

  if (typeof secureUrl !== "string" || !secureUrl.trim()) {
    throw new Error("Cloudinary upload returned empty URL");
  }

  return secureUrl;
};

const normalizeCreateProductionProgressResponse = (
  payload: unknown,
): CreateProductionProgressResponse => {
  const raw = payload as { data?: unknown };
  const data = (raw?.data ?? raw) as CreateProductionProgressPayload;

  return {
    progress: data.progress,
    paymentCreated: data.paymentCreated ?? null,
    billing: data.billing,
  };
};

const useCreateProductionProgress = () => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation<
    CreateProductionProgressResponse,
    Error,
    CreateProductionProgressMutationInput
  >({
    mutationFn: async (payload: CreateProductionProgressMutationInput) => {
      const uploadedUrls = payload.imageFiles?.length
        ? await (async () => {
            const signatureRes = await axiosInstance.post(
              "/product/upload-signature/image",
            );
            const signature = normalizeResponse<CloudinarySignaturePayload>(
              signatureRes.data,
            );
            return Promise.all(
              payload.imageFiles!.map((file) =>
                uploadToCloudinary(file, signature, "image"),
              ),
            );
          })()
        : [];

      const photoUrls = [...(payload.photoUrls ?? []), ...uploadedUrls]
        .map((url) => url.trim())
        .filter(Boolean);

      const validated = createProductionProgressSchema.parse({
        ...payload,
        photoUrls,
      });
      const { data } = await axiosInstance.post("/production", validated);
      return normalizeCreateProductionProgressResponse(data);
    },
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["production-progress", variables.orderId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["order", variables.orderId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin-order", variables.orderId],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["user-payments"] });
    },
  });
};

export default useCreateProductionProgress;
