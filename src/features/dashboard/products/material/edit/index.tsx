"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useGetMaterialById from "@/hooks/api/product/useGetMaterialById";
import useUpdateMaterial from "@/hooks/api/product/useUpdateMaterial";
import { MaterialCategory, ProductMaterial } from "@/types/materialProduct";
import { UploadedProductImage } from "@/types/product";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "../../components/ImageUpload";
import { MaterialFormPreview } from "../components/MaterialFormPreview";

type EditMaterialProductPageProps = {
  materialId: string;
};

type MaterialFormData = {
  materialName: string;
  materialSku: string;
  materialDesc: string;
  materialCategory: MaterialCategory | "";
  price: string;
  isActive: boolean;
};

const MATERIAL_CATEGORIES: MaterialCategory[] = ["FLOOR", "WALL", "FURNITURE"];

export const EditMaterialProductPage = ({
  materialId,
}: EditMaterialProductPageProps) => {
  const router = useRouter();
  const { data, isLoading, isError } = useGetMaterialById(materialId);
  const { mutateAsync: updateMaterial, isPending: isSaving } = useUpdateMaterial();

  const [formData, setFormData] = useState<MaterialFormData | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [uploadedImageItems, setUploadedImageItems] = useState<
    UploadedProductImage[]
  >([]);
  const uploadedImageItemsRef = useRef<UploadedProductImage[]>([]);

  const materialPayload = (data as { data?: unknown } | undefined)?.data ?? data;
  const material = materialPayload as ProductMaterial | undefined;

  useEffect(() => {
    if (!material) return;

    setUploadedImageItems((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      return [];
    });

    setExistingImage(material.materialUrl ?? null);
    setFormData({
      materialName: material.materialName ?? "",
      materialSku: material.materialSku ?? "",
      materialDesc: material.materialDesc ?? "",
      materialCategory: material.materialCategory ?? "",
      price: String(material.price ?? ""),
      isActive: Boolean(material.isActive),
    });
  }, [material]);

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !material) return;

    const newImage = uploadedImageItems[0]?.file;
    if (!existingImage && !newImage) {
      toast.error("Material image is required.");
      return;
    }
    if (!formData.materialCategory) {
      toast.error("Please select a material category.");
      return;
    }

    try {
      await updateMaterial({
        materialId,
        payload: {
          materialName: formData.materialName,
          materialSku: formData.materialSku,
          materialDesc: formData.materialDesc,
          materialCategory: formData.materialCategory as MaterialCategory,
          price: formData.price,
          materialUrl: existingImage ?? undefined,
          isActive: formData.isActive,
        },
        imageFile: newImage,
      });

      toast.success("Material updated successfully.");
      router.push("/dashboard/products/materials");
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Failed to update material.";
      toast.error(message);
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="text-muted-foreground text-sm">Loading material...</div>
    );
  }

  if (isError || !material) {
    return (
      <div className="text-muted-foreground text-sm">
        Failed to load material.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3 md:gap-8">
      <div className="md:col-span-2">
        <div className="space-y-6 md:space-y-8">
          <div>
            <h1 className="text-foreground text-2xl font-bold md:text-3xl">
              Edit Material
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Update material details and image.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            <Card className="border-border bg-card border p-4 sm:p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">
                Material Image
              </h2>

              <div className="space-y-4">
                <ImageUpload
                  onImagesChange={setUploadedImageItems}
                  images={uploadedImageItems}
                />

                {existingImage ? (
                  <div>
                    <p className="text-foreground mb-2 text-sm font-medium">
                      Current Image
                    </p>
                    <div className="group border-border bg-muted relative aspect-square max-w-56 overflow-hidden rounded-lg border">
                      <img
                        src={existingImage}
                        alt="Existing material image"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setExistingImage(null)}
                        className="absolute top-1 right-1 rounded-md bg-red-500/90 p-1 text-white transition-all hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label="Remove existing image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>

            <Card className="border-border bg-card border p-4 sm:p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">
                Basic Information
              </h2>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="materialName" className="text-foreground">
                      Material Name *
                    </Label>
                    <Input
                      id="materialName"
                      name="materialName"
                      value={formData.materialName}
                      onChange={handleInputChange}
                      className="border-input bg-background mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="materialSku" className="text-foreground">
                      Material SKU *
                    </Label>
                    <Input
                      id="materialSku"
                      name="materialSku"
                      value={formData.materialSku}
                      onChange={handleInputChange}
                      className="border-input bg-background mt-1"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="materialCategory" className="text-foreground">
                      Category
                    </Label>
                    <select
                    id="materialCategory"
                    value={formData.materialCategory}
                    onChange={(e) =>
                      setFormData((prev) =>
                        prev
                          ? {
                                ...prev,
                                materialCategory: e.target
                                  .value as MaterialCategory | "",
                              }
                            : prev,
                        )
                      }
                      className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      {MATERIAL_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="materialDesc" className="text-foreground">
                    Description *
                  </Label>
                  <textarea
                    id="materialDesc"
                    name="materialDesc"
                    value={formData.materialDesc}
                    onChange={handleInputChange}
                    className="border-input bg-background text-foreground placeholder-muted-foreground focus:ring-primary mt-1 min-h-24 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </Card>

            <Card className="border-border bg-card border p-4 sm:p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">Pricing</h2>
              <div>
                <Label htmlFor="price" className="text-foreground">
                  Price (Rp) *
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="border-input bg-background mt-1"
                  required
                />
              </div>
            </Card>

            <Card className="border-border bg-card border p-4 sm:p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">
                Options
              </h2>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={() =>
                    setFormData((prev) =>
                      prev ? { ...prev, isActive: !prev.isActive } : prev,
                    )
                  }
                  className="border-input"
                />
                <Label htmlFor="isActive" className="text-foreground cursor-pointer">
                  Material is Active
                </Label>
              </div>
            </Card>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
              >
                {isSaving ? "Updating..." : "Update Material"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-input text-foreground w-full sm:w-auto"
                onClick={() => router.push("/dashboard/products/materials")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
      <div className="md:col-span-1">
        <MaterialFormPreview
          formData={{
            ...formData,
            materialUrl: existingImage ?? undefined,
            materialImageUrls: uploadedImageItems.map((item) => item.previewUrl),
          }}
        />
      </div>
    </div>
  );
};
