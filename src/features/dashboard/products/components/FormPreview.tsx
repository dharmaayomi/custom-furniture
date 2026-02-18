"use client";

import { Card } from "@/components/ui/card";
import { ProductFormData } from "@/types/product";
import { Check, X } from "lucide-react";

type FormPreviewProps = {
  formData: ProductFormData;
};

export function FormPreview({ formData }: FormPreviewProps) {
  const completeness = {
    productName: !!formData.productName,
    sku: !!formData.sku,
    productFile: !!formData.productFileName,
    description: !!formData.description,
    basePrice: !!formData.basePrice,
    width: !!formData.width,
    height: !!formData.height,
    depth: !!formData.depth,
    weight: !!formData.weight,
    image: formData.images.length > 0,
  };

  const completedFields = Object.values(completeness).filter(Boolean).length;
  const completionPercentage = Math.round(
    (completedFields / Object.keys(completeness).length) * 100,
  );

  return (
    <div className="sticky top-4 space-y-4">
      <div>
        <h2 className="text-foreground text-lg font-semibold">
          Preview & Progress
        </h2>
        <p className="text-muted-foreground text-sm">
          Live preview of your product
        </p>
      </div>

      <Card className="border-border bg-card border p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">
              Completion
            </span>
            <span className="text-primary text-sm font-bold">
              {completionPercentage}%
            </span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </Card>

      <Card className="border-border bg-card border p-4">
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Required Fields
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {[
              { key: "productName", label: "Product Name" },
              { key: "sku", label: "SKU" },
              { key: "productFile", label: "Product File" },
              { key: "description", label: "Description" },
              { key: "basePrice", label: "Price" },
              { key: "width", label: "Width" },
              { key: "height", label: "Height" },
              { key: "depth", label: "Depth" },
              { key: "weight", label: "Weight" },
              { key: "image", label: "Image" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                {completeness[key as keyof typeof completeness] ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="text-muted-foreground h-4 w-4" />
                )}
                <span
                  className={`text-xs ${
                    completeness[key as keyof typeof completeness]
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {completeness.productName && (
        <Card className="border-border bg-card overflow-hidden border">
          {formData.images.length > 0 && (
            <div className="bg-muted relative h-40 w-full">
              <img
                src={formData.images[0]}
                alt={formData.productName}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="space-y-3 p-4">
            <div>
              <p className="text-muted-foreground text-xs">
                SKU: {formData.sku || "-"}
              </p>
              <h3 className="text-foreground font-semibold text-balance">
                {formData.productName}
              </h3>
            </div>

            {formData.basePrice && (
              <p className="text-primary text-lg font-bold">
                Rp. {parseFloat(formData.basePrice || "0").toFixed(2)}
              </p>
            )}

            {formData.description && (
              <p className="text-muted-foreground line-clamp-2 text-xs">
                {formData.description}
              </p>
            )}

            {formData.productFileName ? (
              <div className="border-border border-t pt-3">
                <p className="text-muted-foreground text-xs">
                  Product file:{" "}
                  <span className="text-foreground">
                    {formData.productFileName}
                  </span>
                </p>
              </div>
            ) : null}

            <div className="border-border space-y-2 border-t pt-3">
              <div className="text-muted-foreground text-xs">
                <p className="text-foreground mb-1 font-medium">Dimensions</p>
                <div className="grid grid-cols-2 gap-1">
                  <p>W: {formData.width || "-"} cm</p>
                  <p>H: {formData.height || "-"} cm</p>
                  <p>D: {formData.depth || "-"} cm</p>
                  <p>Wt: {formData.weight || "-"} kg</p>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="text-foreground flex items-center gap-1 text-xs">
                  {formData.isActive ? (
                    <>
                      <Check className="h-3 w-3 text-green-600" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <X className="text-muted-foreground h-3 w-3" />
                      <span>Inactive</span>
                    </>
                  )}
                </div>
                <div className="text-foreground flex items-center gap-1 text-xs">
                  {formData.isCustomizable ? (
                    <>
                      <Check className="h-3 w-3 text-green-600" />
                      <span>Custom</span>
                    </>
                  ) : (
                    <>
                      <X className="text-muted-foreground h-3 w-3" />
                      <span>No Custom</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {formData.images.length > 1 && (
        <Card className="border-border bg-card border p-4">
          <p className="text-muted-foreground mb-2 text-xs font-semibold">
            Images ({formData.images.length})
          </p>
          <div className="grid grid-cols-3 gap-2">
            {formData.images.map((image, idx) => (
              <div
                key={idx}
                className="bg-muted relative h-16 w-full overflow-hidden rounded"
              >
                <img
                  src={image}
                  alt={`Product ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
