"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useGetComponentById from "@/hooks/api/product/useGetComponentById";
import useUpdateComponent from "@/hooks/api/product/useUpdateComponent";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "../../components/ImageUpload";
import { ComponentFormPreview } from "../components/ComponentFormPreview";
import { ComponentCategory, ProductComponent } from "@/types/componentProduct";
import { UploadedProductImage } from "@/types/product";

type EditComponentPageProps = {
  componentId: string;
};

type ComponentFormData = {
  componentName: string;
  componentDesc: string;
  componentCategory: ComponentCategory;
  price: string;
  weight: string;
  isActive: boolean;
};

const COMPONENT_CATEGORIES: ComponentCategory[] = [
  "SHELF",
  "DRAWER",
  "HANGER",
  "DOOR",
  "RAIL",
  "ACCESSORY",
  "HARDWARE",
];

export const EditComponentPage = ({ componentId }: EditComponentPageProps) => {
  const router = useRouter();
  const { data, isLoading, isError } = useGetComponentById(componentId);
  const { mutateAsync: updateComponent, isPending: isSaving } =
    useUpdateComponent();

  const [formData, setFormData] = useState<ComponentFormData | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [componentFile, setComponentFile] = useState<File | null>(null);
  const [uploadedImageItems, setUploadedImageItems] = useState<
    UploadedProductImage[]
  >([]);
  const uploadedImageItemsRef = useRef<UploadedProductImage[]>([]);

  const componentPayload =
    (data as { data?: unknown } | undefined)?.data ?? data;
  const component = componentPayload as ProductComponent | undefined;

  useEffect(() => {
    if (!component) return;
    setUploadedImageItems((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      return [];
    });

    setExistingImages(component.componentImageUrls ?? []);
    setFormData({
      componentName: component.componentName,
      componentDesc: component.componentDesc,
      componentCategory: component.componentCategory,
      price: String(component.price),
      weight: String(component.weight),
      isActive: component.isActive,
    });
  }, [component]);

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

  const handleComponentFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0] ?? null;
    setComponentFile(file);
  };

  const handleRemoveExistingImage = (imageUrl: string) => {
    setExistingImages((prev) => prev.filter((url) => url !== imageUrl));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !component) return;

    if (existingImages.length === 0 && uploadedImageItems.length === 0) {
      toast.error("At least one image is required.");
      return;
    }

    try {
      await updateComponent({
        componentId,
        payload: {
          componentName: formData.componentName,
          componentDesc: formData.componentDesc,
          componentCategory: formData.componentCategory,
          price: formData.price,
          weight: formData.weight,
          isActive: formData.isActive,
          componentImageUrls: existingImages,
        },
        componentFile: componentFile ?? undefined,
        imageFiles: uploadedImageItems.map((item) => item.file),
      });

      toast.success("Component updated successfully.");
      router.push("/dashboard/products/components");
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Failed to update component.";
      toast.error(message);
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="text-muted-foreground text-sm">Loading component...</div>
    );
  }

  if (isError || !component) {
    return (
      <div className="text-muted-foreground text-sm">
        Failed to load component.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3 md:gap-8">
      <div className="md:col-span-2">
        <div className="space-y-6 md:space-y-8">
          <div>
            <h1 className="text-foreground text-2xl font-bold md:text-3xl">
              Edit Component
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Update component details and uploaded assets.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            <Card className="border-border bg-card min-w-0 border p-4 sm:p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">
                Component Images
              </h2>

              <div className="space-y-4">
                <ImageUpload
                  onImagesChange={setUploadedImageItems}
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
                            alt={`Existing component image ${index + 1}`}
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
              </div>
            </Card>

            <Card className="border-border bg-card min-w-0 border p-4 sm:p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">
                Basic Information
              </h2>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="componentName" className="text-foreground">
                      Component Name *
                    </Label>
                    <Input
                      id="componentName"
                      name="componentName"
                      value={formData.componentName}
                      onChange={handleInputChange}
                      className="border-input bg-background mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="componentCategory"
                      className="text-foreground"
                    >
                      Category *
                    </Label>
                    <select
                      id="componentCategory"
                      value={formData.componentCategory}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev
                            ? {
                                ...prev,
                                componentCategory: e.target
                                  .value as ComponentCategory,
                              }
                            : prev,
                        )
                      }
                      className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
                    >
                      {COMPONENT_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="componentUrlCurrent"
                    className="text-foreground"
                  >
                    Current Component File URL
                  </Label>
                  <div className="border-input bg-background text-muted-foreground mt-1 rounded-md border px-3 py-2 text-xs break-all">
                    {component.componentUrl || "-"}
                  </div>
                </div>

                <div>
                  <Label htmlFor="componentFile" className="text-foreground">
                    Replace Component GLB File
                  </Label>
                  <Input
                    id="componentFile"
                    type="file"
                    accept=".glb,.gltf,.obj,.fbx,.stl,model/*"
                    onChange={handleComponentFileChange}
                    className="border-input bg-background mt-1"
                  />
                  {componentFile ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Selected: {componentFile.name}
                    </p>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="componentDesc" className="text-foreground">
                    Description *
                  </Label>
                  <textarea
                    id="componentDesc"
                    name="componentDesc"
                    value={formData.componentDesc}
                    onChange={handleInputChange}
                    className="border-input bg-background text-foreground placeholder-muted-foreground focus:ring-primary mt-1 min-h-24 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </Card>

            <Card className="border-border bg-card min-w-0 border p-4 sm:p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">
                Pricing & Weight
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
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
                <div>
                  <Label htmlFor="weight" className="text-foreground">
                    Weight (kg) *
                  </Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="border-input bg-background mt-1"
                    required
                  />
                </div>
              </div>
            </Card>

            <Card className="border-border bg-card min-w-0 border p-4 sm:p-6">
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
                <Label
                  htmlFor="isActive"
                  className="text-foreground cursor-pointer"
                >
                  Component is Active
                </Label>
              </div>
            </Card>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
              >
                {isSaving ? "Updating..." : "Update Component"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-input text-foreground w-full sm:w-auto"
                onClick={() => router.push("/dashboard/products/components")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
      <div className="md:col-span-1">
        <ComponentFormPreview
          formData={{
            ...formData,
            componentFileName: componentFile?.name,
            componentUrl: component.componentUrl,
            componentImageUrls: [
              ...existingImages,
              ...uploadedImageItems.map((item) => item.previewUrl),
            ],
          }}
        />
      </div>
    </div>
  );
};
