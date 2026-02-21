import useAxios from "@/hooks/useAxios";
import { CreateMaterialInput, ProductMaterial } from "@/types/materialProduct";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CloudinarySignaturePayload = {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
};

type CreateMaterialMutationInput = Omit<CreateMaterialInput, "materialUrl"> & {
  materialUrl?: string;
  imageFiles?: File[];
};

type CreateMaterialOptions = {
  onSuccess?: (result: ProductMaterial) => void;
  onError?: (error: unknown) => void;
};

const normalizeResponse = <T,>(payload: unknown): T => {
  return ((payload as { data?: unknown })?.data ?? payload) as T;
};

const uploadToCloudinary = async (
  file: File,
  signaturePayload: CloudinarySignaturePayload,
  resourceType: "image" | "raw" | "auto",
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
      `Failed to upload ${resourceType} to Cloudinary (${response.status}): ${details || "Unknown error"}`,
    );
  }

  const result = await response.json();
  const secureUrl = result?.secure_url;

  if (typeof secureUrl !== "string" || !secureUrl.trim()) {
    throw new Error(`Cloudinary ${resourceType} upload returned empty URL`);
  }

  return secureUrl;
};

const useCreateMaterial = (options?: CreateMaterialOptions) => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateMaterialMutationInput) => {
      const uploadedImageUrl = payload.imageFiles?.length
        ? await (async () => {
            const imageSignatureRes = await axiosInstance.post(
              "/product/upload-signature/image",
            );
            const imageSignature =
              normalizeResponse<CloudinarySignaturePayload>(
                imageSignatureRes.data,
              );
            return uploadToCloudinary(payload.imageFiles![0], imageSignature, "image");
          })()
        : undefined;

      const materialUrl = (uploadedImageUrl ?? payload.materialUrl)?.trim();
      if (!materialUrl) {
        throw new Error("materialUrl is required");
      }

      const requestPayload: CreateMaterialInput = {
        materialName: payload.materialName.trim(),
        materialUrl,
        materialSku: payload.materialSku.trim(),
        materialDesc: payload.materialDesc.trim(),
        materialCategory: payload.materialCategory,
        price: Number(payload.price),
      };

      const { data } = await axiosInstance.post("/product/material", requestPayload);
      return normalizeResponse<ProductMaterial>(data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export default useCreateMaterial;
