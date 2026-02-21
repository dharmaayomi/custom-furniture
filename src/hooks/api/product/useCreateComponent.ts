import useAxios from "@/hooks/useAxios";
import {
  CreateComponentInput,
  ProductComponent,
} from "@/types/componentProduct";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type CloudinarySignaturePayload = {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
};

type CreateComponentMutationInput = Omit<
  CreateComponentInput,
  "componentUrl" | "componentImageUrls"
> & {
  componentUrl?: string;
  componentImageUrls?: string[];
  componentFile?: File;
  imageFiles?: File[];
};

type CreateComponentOptions = {
  onSuccess?: (result: ProductComponent) => void;
  onError?: (error: unknown) => void;
};

const normalizeResponse = <T>(payload: unknown): T => {
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

const useCreateComponent = (options?: CreateComponentOptions) => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateComponentMutationInput) => {
      const [componentUrl, componentImageUrls] = await Promise.all([
        payload.componentFile
          ? (async () => {
              const componentFile = payload.componentFile as File;
              const glbSignatureRes = await axiosInstance.post(
                "/product/upload-signature/glb",
              );
              const glbSignature =
                normalizeResponse<CloudinarySignaturePayload>(
                  glbSignatureRes.data,
                );
              return uploadToCloudinary(componentFile, glbSignature, "image");
            })()
          : payload.componentUrl?.trim(),
        payload.imageFiles?.length
          ? (async () => {
              const imageFiles = payload.imageFiles as File[];
              const imageSignatureRes = await axiosInstance.post(
                "/product/upload-signature/image",
              );
              const imageSignature =
                normalizeResponse<CloudinarySignaturePayload>(
                  imageSignatureRes.data,
                );
              return Promise.all(
                imageFiles.map((imageFile) =>
                  uploadToCloudinary(imageFile, imageSignature, "image"),
                ),
              );
            })()
          : (payload.componentImageUrls ?? []),
      ]);

      if (!componentUrl) {
        throw new Error("Component file is required");
      }

      if (!componentImageUrls.length) {
        throw new Error("At least one component image is required");
      }

      const requestPayload: CreateComponentInput = {
        componentName: payload.componentName.trim(),
        componentUrl,
        componentSku: payload.componentSku.trim(),
        componentDesc: payload.componentDesc.trim(),
        componentCategory: payload.componentCategory,
        price: Number(payload.price),
        weight: Number(payload.weight),
        componentImageUrls: componentImageUrls
          .map((imageUrl) => imageUrl.trim())
          .filter(Boolean),
      };

      const { data } = await axiosInstance.post(
        "/product/component",
        requestPayload,
      );
      return normalizeResponse<ProductComponent>(data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export default useCreateComponent;
