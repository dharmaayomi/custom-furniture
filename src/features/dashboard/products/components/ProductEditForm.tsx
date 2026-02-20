"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useGetProductById from "@/hooks/api/product/useGetProductById";
import useEditProduct from "@/hooks/api/product/useUpdateProduct";
import { ProductBase, ProductFormData, UploadedProductImage } from "@/types/product";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { FormPreview } from "./FormPreview";
import { ImageUpload } from "./ImageUpload";

type ProductEditFormProps = {
  productId: string;
};

const INITIAL_FORM_DATA: ProductFormData = {
  productName: "",
  sku: "",
  productFileName: "",
  description: "",
  basePrice: "",
  width: "",
  height: "",
  depth: "",
  weight: "",
  images: [],
  isActive: true,
  isCustomizable: true,
};

export function ProductEditForm({ productId }: ProductEditFormProps) {
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [uploadedImageItems, setUploadedImageItems] = useState<UploadedProductImage[]>([]);
  const uploadedImageItemsRef = useRef<UploadedProductImage[]>([]);
  const { data, isLoading, isError } = useGetProductById(productId);
  const { mutateAsync: editProduct, isPending: isSaving } = useEditProduct();

  const productPayload = (data as { data?: unknown } | undefined)?.data ?? data;
  const product = productPayload as ProductBase | undefined;

  const originalData = useMemo<ProductFormData | null>(() => {
    if (!product) return null;

    return {
      productName: product.productName,
      sku: product.sku,
      productFileName: product.productUrl,
      description: product.description,
      basePrice: String(product.basePrice),
      width: String(product.width),
      height: String(product.height),
      depth: String(product.depth),
      weight: String(product.weight),
      images: product.images ?? [],
      isActive: product.isActive,
      isCustomizable: product.isCustomizable,
    };
  }, [product]);

  useEffect(() => {
    if (originalData) {
      setUploadedImageItems((prev) => {
        prev.forEach((item) => {
          if (item.previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(item.previewUrl);
          }
        });
        return [];
      });
      setExistingImages(originalData.images);
      setFormData(originalData);
    }
  }, [originalData]);

  useEffect(() => {
    uploadedImageItemsRef.current = uploadedImageItems;
  }, [uploadedImageItems]);

  useEffect(() => {
    return () => {
      uploadedImageItemsRef.current.forEach((item) => {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (field: "isActive" | "isCustomizable") => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleUploadedImagesChange = (items: UploadedProductImage[]) => {
    setUploadedImageItems(items);
  };

  const handleProductFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setProductFile(file);
  };

  const handleRemoveExistingImage = (imageUrl: string) => {
    setExistingImages((prev) => prev.filter((url) => url !== imageUrl));
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      images: [...existingImages, ...uploadedImageItems.map((item) => item.previewUrl)],
    }));
  }, [existingImages, uploadedImageItems]);

  const buildUpdatePayload = (current: ProductFormData, original: ProductBase) => {
    const payload: Partial<{
      productName: string;
      sku: string;
      productUrl: string;
      description: string;
      basePrice: number;
      width: number;
      height: number;
      depth: number;
      weight: number;
      images: string[];
      isActive: boolean;
      isCustomizable: boolean;
    }> = {};

    if (current.productName.trim() !== original.productName) {
      payload.productName = current.productName.trim();
    }
    if (current.sku.trim() !== original.sku) {
      payload.sku = current.sku.trim();
    }
    if (current.description.trim() !== original.description) {
      payload.description = current.description.trim();
    }

    const nextBasePrice = Number(current.basePrice);
    if (!Number.isNaN(nextBasePrice) && nextBasePrice !== original.basePrice) {
      payload.basePrice = nextBasePrice;
    }

    const nextWidth = Number(current.width);
    if (!Number.isNaN(nextWidth) && nextWidth !== original.width) {
      payload.width = nextWidth;
    }

    const nextHeight = Number(current.height);
    if (!Number.isNaN(nextHeight) && nextHeight !== original.height) {
      payload.height = nextHeight;
    }

    const nextDepth = Number(current.depth);
    if (!Number.isNaN(nextDepth) && nextDepth !== original.depth) {
      payload.depth = nextDepth;
    }

    const nextWeight = Number(current.weight);
    if (!Number.isNaN(nextWeight) && nextWeight !== original.weight) {
      payload.weight = nextWeight;
    }

    if (current.isActive !== original.isActive) {
      payload.isActive = current.isActive;
    }

    if (current.isCustomizable !== original.isCustomizable) {
      payload.isCustomizable = current.isCustomizable;
    }

    const originalImages = original.images ?? [];
    if (JSON.stringify(current.images) !== JSON.stringify(originalImages)) {
      payload.images = current.images;
    }

    return payload;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!product) return;

    const payload = buildUpdatePayload(formData, product);
    if (productFile) {
      payload.productUrl = product.productUrl;
    }
    if (
      Array.isArray(payload.images) &&
      JSON.stringify(payload.images) === JSON.stringify(product.images ?? [])
    ) {
      delete payload.images;
    }

    if (existingImages.length === 0 && uploadedImageItems.length === 0) {
      toast.error("At least one image is required.");
      return;
    }

    if (Object.keys(payload).length === 0 && uploadedImageItems.length === 0 && !productFile) {
      toast("No changes", { description: "Nothing to update." });
      return;
    }

    try {
      await editProduct({
        productId,
        payload,
        productFile: productFile ?? undefined,
        imageFiles: uploadedImageItems.map((item) => item.file),
      });
      toast.success("Product updated.");
      setProductFile(null);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Failed to update product.";
      toast.error(message);
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Loading product...</div>;
  }

  if (isError || !product) {
    return (
      <div className="text-muted-foreground text-sm">Failed to load product.</div>
    );
  }

  return (
    <div className="grid min-w-0 gap-6 md:grid-cols-3 md:gap-8">
      <div className="min-w-0 md:col-span-2">
        <div className="space-y-6 md:space-y-8">
          <div>
            <h1 className="text-foreground text-2xl font-bold md:text-3xl">
              Edit Product
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Update your product details.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            <Card className="border-border bg-card min-w-0 border p-4 sm:p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">
                Product Images
              </h2>

              <div className="space-y-4">
                <ImageUpload
                  onImagesChange={handleUploadedImagesChange}
                  images={uploadedImageItems}
                />

                {existingImages.length > 0 ? (
                  <div>
                    <p className="text-foreground mb-2 text-sm font-medium">
                      Existing Images ({existingImages.length})
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {existingImages.map((image, index) => (
                        <div
                          key={`${image}-${index}`}
                          className="group border-border bg-muted relative aspect-square overflow-hidden rounded-lg border"
                        >
                          <img
                            src={image}
                            alt={`Existing product image ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(image)}
                            className="absolute top-1 right-1 rounded-md bg-red-500/90 p-1 text-white transition-all hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                            aria-label="Remove existing image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {existingImages.length === 0 && uploadedImageItems.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No images selected.
                  </p>
                ) : null}
              </div>
            </Card>

            <Card className="border-border bg-card min-w-0 border p-4 sm:p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">
                Basic Information
              </h2>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="productName" className="text-foreground">
                      Product Name *
                    </Label>
                    <Input
                      id="productName"
                      name="productName"
                      value={formData.productName}
                      onChange={handleInputChange}
                      placeholder="Enter product name"
                      className="border-input bg-background mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sku" className="text-foreground">
                      SKU *
                    </Label>
                    <Input
                      id="sku"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      placeholder="e.g., PROD-001"
                      className="border-input bg-background mt-1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="productFileName" className="text-foreground">
                    Product File URL
                  </Label>
                  <div className="border-input bg-background text-muted-foreground mt-1 rounded-md border px-3 py-2 text-xs break-all">
                    {formData.productFileName || "-"}
                  </div>
                </div>

                <div>
                  <Label htmlFor="productFile" className="text-foreground">
                    Replace Product File
                  </Label>
                  <Input
                    id="productFile"
                    type="file"
                    accept=".glb,.gltf,.obj,.fbx,.stl,model/*"
                    onChange={handleProductFileChange}
                    className="border-input bg-background mt-1"
                  />
                  {productFile ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Selected: {productFile.name}
                    </p>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="description" className="text-foreground">
                    Description *
                  </Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter detailed product description"
                    className="border-input bg-background text-foreground placeholder-muted-foreground focus:ring-primary mt-1 min-h-24 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </Card>

            <Card className="border-border bg-card min-w-0 border p-4 sm:p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">Pricing</h2>
              <div>
                <Label htmlFor="basePrice" className="text-foreground">
                  Base Price (Rp) *
                </Label>
                <Input
                  id="basePrice"
                  name="basePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.basePrice}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="border-input bg-background mt-1"
                  required
                />
              </div>
            </Card>

            <Card className="border-border bg-card min-w-0 border p-4 sm:p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">
                Dimensions & Weight
              </h2>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label htmlFor="width" className="text-foreground">
                      Width (cm) *
                    </Label>
                    <Input
                      id="width"
                      name="width"
                      type="number"
                      min="0"
                      value={formData.width}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="border-input bg-background mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="height" className="text-foreground">
                      Height (cm) *
                    </Label>
                    <Input
                      id="height"
                      name="height"
                      type="number"
                      min="0"
                      value={formData.height}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="border-input bg-background mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="depth" className="text-foreground">
                      Depth (cm) *
                    </Label>
                    <Input
                      id="depth"
                      name="depth"
                      type="number"
                      min="0"
                      value={formData.depth}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="border-input bg-background mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight" className="text-foreground">
                      Weight (kg) *
                    </Label>
                    <Input
                      id="weight"
                      name="weight"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="border-input bg-background mt-1"
                      required
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-border bg-card min-w-0 border p-4 sm:p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">Options</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={() => handleCheckboxChange("isActive")}
                    className="border-input"
                  />
                  <Label htmlFor="isActive" className="text-foreground cursor-pointer">
                    Product is Active
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isCustomizable"
                    checked={formData.isCustomizable}
                    onCheckedChange={() => handleCheckboxChange("isCustomizable")}
                    className="border-input"
                  />
                  <Label
                    htmlFor="isCustomizable"
                    className="text-foreground cursor-pointer"
                  >
                    Product is Customizable
                  </Label>
                </div>
              </div>
            </Card>

            <Button
              type="submit"
              disabled={isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
            >
              {isSaving ? "Updating..." : "Update Product"}
            </Button>
          </form>
        </div>
      </div>

      <div className="min-w-0 md:col-span-1">
        <FormPreview formData={formData} />
      </div>
    </div>
  );
}
