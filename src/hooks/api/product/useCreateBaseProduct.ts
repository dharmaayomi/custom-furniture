import useAxios from "@/hooks/useAxios";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-error";
import { ProductBase } from "@/types/product";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CloudinarySignaturePayload = {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
};

export type CreateBaseProductInput = {
  productName: string;
  sku: string;
  description: string;
  basePrice: number | string;
  width: number | string;
  height: number | string;
  depth: number | string;
  weight: number | string;
  productFile: File;
  imageFiles: File[];
  isActive?: boolean;
  isCustomizable?: boolean;
};

type CreateBaseProductOptions = {
  onSuccess?: (result: ProductBase) => void;
  onError?: (error: unknown) => void;
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

const useCreateBaseProduct = (options?: CreateBaseProductOptions) => {
  const axiosInstance = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBaseProductInput) => {
      if (!input.productFile) {
        throw new Error("productFile is required");
      }
      if (!input.imageFiles?.length) {
        throw new Error("At least one image file is required");
      }

      const [glbSignatureRes, imageSignatureRes] = await Promise.all([
        axiosInstance.post("/product/upload-signature/glb"),
        axiosInstance.post("/product/upload-signature/image"),
      ]);

      const glbSignature =
        normalizeResponse<CloudinarySignaturePayload>(glbSignatureRes.data);
      const imageSignature =
        normalizeResponse<CloudinarySignaturePayload>(imageSignatureRes.data);

      const [productUrl, images] = await Promise.all([
        uploadToCloudinary(input.productFile, glbSignature, "raw"),
        Promise.all(
          input.imageFiles.map((imageFile) =>
            uploadToCloudinary(imageFile, imageSignature, "image"),
          ),
        ),
      ]);

      const payload = {
        productName: input.productName.trim(),
        sku: input.sku.trim(),
        productUrl,
        description: input.description.trim(),
        basePrice: Number(input.basePrice),
        width: Number(input.width),
        height: Number(input.height),
        depth: Number(input.depth),
        weight: Number(input.weight),
        images,
        isActive: input.isActive ?? true,
        isCustomizable: input.isCustomizable ?? true,
      };

      const { data } = await axiosInstance.post("/product", payload);
      return normalizeResponse<ProductBase>(data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      console.error("[useCreateBaseProduct] request failed", {
        status: getApiErrorStatus(error),
        message: getApiErrorMessage(error, "Failed to create product."),
      });
      options?.onError?.(error);
    },
  });
};

export default useCreateBaseProduct;
