import useAxios from "@/hooks/useAxios";
import { UpdateProductInput } from "@/types/product";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateProductParams = {
  productId: string;
  payload: UpdateProductInput;
  productFile?: File;
  imageFiles?: File[];
};

type CloudinarySignaturePayload = {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
};

const normalizeResponse = <T,>(payload: unknown): T => {
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

const useEditProduct = () => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      payload,
      productFile,
      imageFiles = [],
    }: UpdateProductParams) => {
      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
      ) as UpdateProductInput;

      if (productFile) {
        const glbSignatureRes = await axiosInstance.post(
          "/product/upload-signature/glb",
        );
        const glbSignature =
          normalizeResponse<CloudinarySignaturePayload>(glbSignatureRes.data);
        const productUrl = await uploadToCloudinary(productFile, glbSignature, "raw");
        cleanedPayload.productUrl = productUrl;
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

        const existingImageUrls = Array.isArray(cleanedPayload.images)
          ? cleanedPayload.images.filter((url) => !url.startsWith("blob:"))
          : [];

        cleanedPayload.images = [...existingImageUrls, ...uploadedImageUrls];
      }

      const { data } = await axiosInstance.patch(
        `/product/${productId}`,
        cleanedPayload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export default useEditProduct;
