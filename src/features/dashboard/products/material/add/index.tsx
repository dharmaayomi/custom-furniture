"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useCreateMaterial from "@/hooks/api/product/useCreateMaterial";
import { MaterialCategory } from "@/types/materialProduct";
import { UploadedProductImage } from "@/types/product";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "../../components/ImageUpload";
import { MaterialFormPreview } from "../components/MaterialFormPreview";

type MaterialFormData = {
  materialName: string;
  materialSku: string;
  materialDesc: string;
  materialCategory: MaterialCategory | "";
  price: string;
};

const INITIAL_FORM_DATA: MaterialFormData = {
  materialName: "",
  materialSku: "",
  materialDesc: "",
  materialCategory: "",
  price: "",
};

const MATERIAL_CATEGORIES: MaterialCategory[] = ["FLOOR", "WALL", "FURNITURE"];

export const CreateProductMaterialPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<MaterialFormData>(INITIAL_FORM_DATA);
  const [isCategoryTouched, setIsCategoryTouched] = useState(false);
  const [imageItems, setImageItems] = useState<UploadedProductImage[]>([]);
  const [submitMessage, setSubmitMessage] = useState("");
  const { mutateAsync: createMaterial, isPending } = useCreateMaterial();

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

  const resetForm = () => {
    imageItems.forEach((item) => {
      if (item.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    setFormData(INITIAL_FORM_DATA);
    setIsCategoryTouched(false);
    setImageItems([]);
    setSubmitMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage("");

    try {
      if (
        !formData.materialName ||
        !formData.materialSku ||
        !formData.materialDesc ||
        !formData.materialCategory ||
        !formData.price ||
        imageItems.length === 0
      ) {
        setSubmitMessage("Please fill in all required fields and upload image.");
        return;
      }

      await createMaterial({
        materialName: formData.materialName,
        materialSku: formData.materialSku,
        materialDesc: formData.materialDesc,
        materialCategory: formData.materialCategory as MaterialCategory,
        price: formData.price,
        imageFiles: imageItems.map((item) => item.file),
      });

      toast.success("Material created successfully.");
      setTimeout(() => {
        resetForm();
        router.push("/dashboard/products/materials");
      }, 800);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Error creating material. Please try again.";
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
              Create New Material
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Add a new material with image upload (no GLB required)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          <Card className="border-border bg-card border p-4 sm:p-6">
            <h2 className="text-foreground mb-4 text-lg font-semibold">
              Material Image *
            </h2>
            <ImageUpload onImagesChange={setImageItems} images={imageItems} />
            <input
              value={imageItems.length > 0 ? "ok" : ""}
              readOnly
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              required
            />
            <p className="text-muted-foreground mt-2 text-xs">
              First uploaded image will be used as material URL.
            </p>
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
                    placeholder="Enter material name"
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
                    placeholder="Enter material SKU"
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
                    onChange={(e) => {
                      setIsCategoryTouched(Boolean(e.target.value));
                      setFormData((prev) => ({
                        ...prev,
                        materialCategory: e.target.value as MaterialCategory | "",
                      }));
                    }}
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
                  placeholder="Enter material description"
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
                placeholder="0.00"
                className="border-input bg-background mt-1"
                required
              />
            </div>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
            >
              {isPending ? "Creating..." : "Create Material"}
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
        <MaterialFormPreview
          formData={{
            ...formData,
            materialImageUrls: imageItems.map((item) => item.previewUrl),
          }}
          isCategoryTouched={isCategoryTouched}
        />
      </div>
    </div>
  );
};
