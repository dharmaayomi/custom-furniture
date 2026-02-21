"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useCreateComponent from "@/hooks/api/product/useCreateComponent";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "../../components/ImageUpload";
import { ComponentFormPreview } from "../components/ComponentFormPreview";
import { ComponentCategory } from "@/types/componentProduct";
import { UploadedProductImage } from "@/types/product";

type ComponentFormData = {
  componentName: string;
  componentSku: string;
  componentDesc: string;
  componentCategory: ComponentCategory | "";
  price: string;
  weight: string;
  isActive: boolean;
};

const INITIAL_FORM_DATA: ComponentFormData = {
  componentName: "",
  componentSku: "",
  componentDesc: "",
  componentCategory: "",
  price: "",
  weight: "",
  isActive: true,
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

export const CreateProductComponentPage = () => {
  const router = useRouter();
  const [formData, setFormData] =
    useState<ComponentFormData>(INITIAL_FORM_DATA);
  const [isCategoryTouched, setIsCategoryTouched] = useState(false);
  const [componentFile, setComponentFile] = useState<File | null>(null);
  const [imageItems, setImageItems] = useState<UploadedProductImage[]>([]);
  const [submitMessage, setSubmitMessage] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const { mutateAsync: createComponent, isPending } = useCreateComponent();

  useEffect(() => {
    return () => {
      imageItems.forEach((item) => {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [imageItems]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (field: "isActive") => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleImagesChange = (items: UploadedProductImage[]) => {
    setImageItems(items);
  };

  const handleComponentFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0] ?? null;
    setComponentFile(file);
  };

  const resetForm = () => {
    imageItems.forEach((item) => {
      if (item.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    setFormData(INITIAL_FORM_DATA);
    setIsCategoryTouched(false);
    setComponentFile(null);
    setImageItems([]);
    setSubmitMessage("");
    setFileInputKey((prev) => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage("");

    try {
      if (
        !formData.componentName ||
        !formData.componentSku ||
        !formData.componentDesc ||
        !formData.componentCategory ||
        !formData.price ||
        !formData.weight ||
        !componentFile ||
        imageItems.length === 0
      ) {
        setSubmitMessage("Please fill in all required fields and uploads.");
        return;
      }

      await createComponent({
        componentName: formData.componentName,
        componentSku: formData.componentSku,
        componentDesc: formData.componentDesc,
        componentCategory: formData.componentCategory as ComponentCategory,
        price: formData.price,
        weight: formData.weight,
        componentFile,
        imageFiles: imageItems.map((item) => item.file),
      });

      toast.success("Component created successfully.");
      setTimeout(() => {
        resetForm();
        router.push("/dashboard/products/components");
      }, 800);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Error creating component. Please try again.";
      setSubmitMessage(message);
      toast.error(message);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3 md:gap-8">
      <div className="md:col-span-2">
        <div className="space-y-6 md:space-y-8">
          <div>
            <h1 className="text-foreground text-2xl font-bold md:text-3xl">
              Create New Component
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Add a new customizable component with GLB file and images
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            <Card className="border-border bg-card border p-4 sm:p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">
                Component Images *
              </h2>
              <ImageUpload
                onImagesChange={handleImagesChange}
                images={imageItems}
              />
              <input
                value={imageItems.length > 0 ? "ok" : ""}
                readOnly
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                required
              />
              <p className="text-muted-foreground mt-2 text-xs">
                Upload at least one image.
              </p>
            </Card>

            <Card className="border-border bg-card border p-4 sm:p-6">
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
                      placeholder="Enter component name"
                      className="border-input bg-background mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="componentSku" className="text-foreground">
                      Component SKU *
                    </Label>
                    <Input
                      id="componentSku"
                      name="componentSku"
                      value={formData.componentSku}
                      onChange={handleInputChange}
                      placeholder="Enter component SKU"
                      className="border-input bg-background mt-1"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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
                    onChange={(e) => {
                        setIsCategoryTouched(Boolean(e.target.value));
                        setFormData((prev) => ({
                          ...prev,
                          componentCategory: e.target
                            .value as ComponentCategory | "",
                        }));
                      }}
                      className="border-input bg-background mt-1 h-9 w-full rounded-md border px-3 text-sm"
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      {COMPONENT_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="componentFile" className="text-foreground">
                    Component GLB File *
                  </Label>
                  <Input
                    key={fileInputKey}
                    id="componentFile"
                    name="componentFile"
                    type="file"
                    accept=".glb,.gltf,.obj,.fbx,.stl,model/*"
                    onChange={handleComponentFileChange}
                    className="border-input bg-background mt-1"
                    required
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
                    placeholder="Enter component description"
                    className="border-input bg-background text-foreground placeholder-muted-foreground focus:ring-primary mt-1 min-h-24 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </Card>

            <Card className="border-border bg-card border p-4 sm:p-6">
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
                    placeholder="0.00"
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
                    placeholder="0"
                    className="border-input bg-background mt-1"
                    required
                  />
                </div>
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
                  onCheckedChange={() => handleCheckboxChange("isActive")}
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
                disabled={isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
              >
                {isPending ? "Creating..." : "Create Component"}
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

            {submitMessage && (
              <div
                className={`rounded-lg p-4 text-sm ${
                  submitMessage.toLowerCase().includes("successfully")
                    ? "bg-green-50 text-green-900"
                    : "bg-red-50 text-red-900"
                }`}
              >
                {submitMessage}
              </div>
            )}
          </form>
        </div>
      </div>
      <div className="md:col-span-1">
        <ComponentFormPreview
          formData={{
            ...formData,
            componentFileName: componentFile?.name,
            componentImageUrls: imageItems.map((item) => item.previewUrl),
          }}
          isCategoryTouched={isCategoryTouched}
        />
      </div>
    </div>
  );
};
