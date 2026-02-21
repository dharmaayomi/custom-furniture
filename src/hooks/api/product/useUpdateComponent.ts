import useAxios from "@/hooks/useAxios";
import {
  ProductComponent,
  UpdateComponentInput,
} from "@/types/componentProduct";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CloudinarySignaturePayload = {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
};

type UpdateComponentParams = {
  componentId: string;
  payload: UpdateComponentInput;
  componentFile?: File;
  imageFiles?: File[];
};

const normalizeResponse = <T>(payload: unknown): T => {
  return ((payload as { data?: unknown })?.data ?? payload) as T;
};

const uploadToCloudinary = async (
  file: File,
  signaturePayload: CloudinarySignaturePayload,
  resourceType: "image" | "raw",
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
    throw new Error(`Failed to upload ${resourceType} to Cloudinary`);
  }

  const result = await response.json();
  const secureUrl = result?.secure_url;

  if (typeof secureUrl !== "string" || !secureUrl.trim()) {
    throw new Error(`Cloudinary ${resourceType} upload returned empty URL`);
  }

  return secureUrl;
};

const useUpdateComponent = () => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      componentId,
      payload,
      componentFile,
      imageFiles = [],
    }: UpdateComponentParams) => {
      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
      ) as UpdateComponentInput;

      if (componentFile) {
        const glbSignatureRes = await axiosInstance.post(
          "/product/upload-signature/glb",
        );
        const glbSignature =
          normalizeResponse<CloudinarySignaturePayload>(glbSignatureRes.data);
        const componentUrl = await uploadToCloudinary(
          componentFile,
          glbSignature,
          "raw",
        );
        cleanedPayload.componentUrl = componentUrl;
      }

      if (imageFiles.length > 0) {
        const imageSignatureRes = await axiosInstance.post(
          "/product/upload-signature/image",
        );
        const imageSignature =
          normalizeResponse<CloudinarySignaturePayload>(imageSignatureRes.data);

        const uploadedImageUrls = await Promise.all(
          imageFiles.map((imageFile) =>
            uploadToCloudinary(imageFile, imageSignature, "image"),
          ),
        );

        const existingImageUrls = Array.isArray(cleanedPayload.componentImageUrls)
          ? cleanedPayload.componentImageUrls.filter(
              (url) => typeof url === "string" && !url.startsWith("blob:"),
            )
          : [];

        cleanedPayload.componentImageUrls = [
          ...existingImageUrls,
          ...uploadedImageUrls,
        ];
      }

      if (typeof cleanedPayload.componentName === "string") {
        cleanedPayload.componentName = cleanedPayload.componentName.trim();
      }
      if (typeof cleanedPayload.componentUrl === "string") {
        cleanedPayload.componentUrl = cleanedPayload.componentUrl.trim();
      }
      if (typeof cleanedPayload.componentDesc === "string") {
        cleanedPayload.componentDesc = cleanedPayload.componentDesc.trim();
      }
      if (typeof cleanedPayload.price !== "undefined") {
        cleanedPayload.price = Number(cleanedPayload.price);
      }
      if (typeof cleanedPayload.weight !== "undefined") {
        cleanedPayload.weight = Number(cleanedPayload.weight);
      }
      if (Array.isArray(cleanedPayload.componentImageUrls)) {
        cleanedPayload.componentImageUrls = cleanedPayload.componentImageUrls
          .map((imageUrl) => imageUrl.trim())
          .filter(Boolean);
      }

      const { data } = await axiosInstance.patch(
        `/product/component/${componentId}/edit`,
        cleanedPayload,
      );

      return normalizeResponse<ProductComponent>(data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
      queryClient.invalidateQueries({ queryKey: ["component", result.id] });
    },
  });
};

export default useUpdateComponent;
