"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useCreateBaseProduct from "@/hooks/api/product/useCreateBaseProduct";
import { UploadedProductImage } from "@/types/product";
import { useEffect, useState } from "react";
import { FormPreview } from "./FormPreview";
import { ImageUpload } from "./ImageUpload";

interface ProductFormData {
  productName: string;
  sku: string;
  productUrl: string;
  productFileName: string;
  description: string;
  basePrice: string;
  width: string;
  height: string;
  depth: string;
  weight: string;
  images: string[];
  isActive: boolean;
  isCustomizable: boolean;
}

const INITIAL_FORM_DATA: ProductFormData = {
  productName: "",
  sku: "",
  productUrl: "",
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

export function CreateProductForm() {
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [imageItems, setImageItems] = useState<UploadedProductImage[]>([]);
  const [submitMessage, setSubmitMessage] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const { mutateAsync: createBaseProduct, isPending } = useCreateBaseProduct();

  useEffect(() => {
    return () => {
      if (formData.productUrl.startsWith("blob:")) {
        URL.revokeObjectURL(formData.productUrl);
      }
      imageItems.forEach((item) => {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [formData.productUrl, imageItems]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

  const handleImagesChange = (items: UploadedProductImage[]) => {
    setImageItems(items);
    setFormData((prev) => ({
      ...prev,
      images: items.map((item) => item.previewUrl),
    }));
  };

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProductFile(file);
    setFormData((prev) => {
      if (prev.productUrl.startsWith("blob:")) {
        URL.revokeObjectURL(prev.productUrl);
      }

      return {
        ...prev,
        productUrl: URL.createObjectURL(file),
        productFileName: file.name,
      };
    });
  };

  const resetForm = () => {
    setFormData((prev) => {
      if (prev.productUrl.startsWith("blob:")) {
        URL.revokeObjectURL(prev.productUrl);
      }
      return INITIAL_FORM_DATA;
    });

    imageItems.forEach((item) => {
      if (item.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    setProductFile(null);
    setImageItems([]);
    setSubmitMessage("");
    setFileInputKey((prev) => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage("");

    try {
      if (
        !formData.productName ||
        !formData.sku ||
        !formData.productUrl ||
        !formData.description ||
        !formData.basePrice ||
        !formData.width ||
        !formData.height ||
        !formData.depth ||
        !formData.weight ||
        !productFile ||
        imageItems.length === 0
      ) {
        setSubmitMessage("Please fill in all required fields and uploads.");
        return;
      }

      await createBaseProduct({
        productName: formData.productName,
        sku: formData.sku,
        description: formData.description,
        basePrice: formData.basePrice,
        width: formData.width,
        height: formData.height,
        depth: formData.depth,
        weight: formData.weight,
        productFile,
        imageFiles: imageItems.map((item) => item.file),
        isActive: formData.isActive,
        isCustomizable: formData.isCustomizable,
      });

      setSubmitMessage("Product created successfully!");
      setTimeout(() => {
        resetForm();
      }, 1200);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Error creating product. Please try again.";
      setSubmitMessage(message);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-2">
        <div className="space-y-8">
          <div>
            <h1 className="text-foreground text-3xl font-bold">
              Create New Product
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Add a new product to your catalog with detailed information and
              images
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="border-border bg-card border p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">
                Product Images *
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

            <Card className="border-border bg-card border p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">
                Basic Information
              </h2>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
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
                  <Label htmlFor="productUrl" className="text-foreground">
                    Product File *
                  </Label>
                  <Input
                    key={fileInputKey}
                    id="productUrl"
                    name="productUrl"
                    onChange={handleProductFileChange}
                    className="border-input bg-background mt-1"
                    type="file"
                    accept=".glb,.gltf,.obj,.fbx,.stl,model/*"
                    required
                  />
                  {formData.productFileName ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Selected: {formData.productFileName}
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

            <Card className="border-border bg-card border p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">
                Pricing
              </h2>
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

            <Card className="border-border bg-card border p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">
                Dimensions & Weight
              </h2>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
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

            <Card className="border-border bg-card border p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">
                Options
              </h2>
              <div className="space-y-4">
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
                    Product is Active
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isCustomizable"
                    checked={formData.isCustomizable}
                    onCheckedChange={() =>
                      handleCheckboxChange("isCustomizable")
                    }
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

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isPending ? "Creating..." : "Create Product"}
              </Button>
              <Button
                type="reset"
                variant="outline"
                className="border-input text-foreground"
                onClick={resetForm}
              >
                Reset
              </Button>
            </div>

            {submitMessage && (
              <div
                className={`rounded-lg p-4 text-sm ${
                  submitMessage.includes("successfully")
                    ? "bg-green-50 text-green-900"
                    : submitMessage.includes("Error")
                      ? "bg-red-50 text-red-900"
                      : "bg-yellow-50 text-yellow-900"
                }`}
              >
                {submitMessage}
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="md:col-span-1">
        <FormPreview formData={formData} />
      </div>
    </div>
  );
}
