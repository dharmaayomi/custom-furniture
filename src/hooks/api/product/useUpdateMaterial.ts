import useAxios from "@/hooks/useAxios";
import { ProductMaterial, UpdateMaterialInput } from "@/types/materialProduct";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CloudinarySignaturePayload = {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
};

type UpdateMaterialParams = {
  materialId: string;
  payload: UpdateMaterialInput;
  imageFile?: File;
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

const useUpdateMaterial = () => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ materialId, payload, imageFile }: UpdateMaterialParams) => {
      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
      ) as UpdateMaterialInput;

      if (imageFile) {
        const imageSignatureRes = await axiosInstance.post(
          "/product/upload-signature/image",
        );
        const imageSignature =
          normalizeResponse<CloudinarySignaturePayload>(imageSignatureRes.data);
        const materialUrl = await uploadToCloudinary(
          imageFile,
          imageSignature,
          "image",
        );
        cleanedPayload.materialUrl = materialUrl;
      }

      if (typeof cleanedPayload.materialName === "string") {
        cleanedPayload.materialName = cleanedPayload.materialName.trim();
      }
      if (typeof cleanedPayload.materialSku === "string") {
        cleanedPayload.materialSku = cleanedPayload.materialSku.trim();
      }
      if (typeof cleanedPayload.materialUrl === "string") {
        cleanedPayload.materialUrl = cleanedPayload.materialUrl.trim();
      }
      if (typeof cleanedPayload.materialDesc === "string") {
        cleanedPayload.materialDesc = cleanedPayload.materialDesc.trim();
      }
      if (typeof cleanedPayload.price !== "undefined") {
        cleanedPayload.price = Number(cleanedPayload.price);
      }

      const { data } = await axiosInstance.patch(
        `/product/material/${materialId}/edit`,
        cleanedPayload,
      );
      return normalizeResponse<ProductMaterial>(data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["material", result.id] });
    },
  });
};

export default useUpdateMaterial;
