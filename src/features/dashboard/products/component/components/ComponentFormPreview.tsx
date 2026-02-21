"use client";

import { Card } from "@/components/ui/card";
import { formatIdrAmount } from "@/lib/price";
import { Check, X } from "lucide-react";

export type ComponentPreviewFormData = {
  componentName: string;
  componentDesc: string;
  componentCategory: string;
  price: string;
  weight: string;
  isActive: boolean;
  componentFileName?: string;
  componentUrl?: string;
  componentImageUrls: string[];
};

type ComponentFormPreviewProps = {
  formData: ComponentPreviewFormData;
  isCategoryTouched?: boolean;
};

export const ComponentFormPreview = ({
  formData,
  isCategoryTouched = true,
}: ComponentFormPreviewProps) => {
  const parsedPrice = Number(formData.price);
  const formattedPrice = Number.isFinite(parsedPrice)
    ? formatIdrAmount(parsedPrice)
    : null;

  const completeness = {
    componentName: !!formData.componentName,
    componentCategory: !!formData.componentCategory && isCategoryTouched,
    componentFile: !!(formData.componentFileName || formData.componentUrl),
    componentDesc: !!formData.componentDesc,
    price: !!formData.price,
    weight: !!formData.weight,
    image: formData.componentImageUrls.length > 0,
  };

  const completedFields = Object.values(completeness).filter(Boolean).length;
  const completionPercentage = Math.round(
    (completedFields / Object.keys(completeness).length) * 100,
  );

  return (
    <div className="space-y-4 md:sticky md:top-4">
      <div>
        <h2 className="text-foreground text-lg font-semibold">
          Preview & Progress
        </h2>
        <p className="text-muted-foreground text-sm">
          Live preview of your component
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

      {completeness.componentName ? (
        <Card className="border-border bg-card overflow-hidden border">
          {formData.componentImageUrls.length > 0 ? (
            <div className="relative h-40 w-full px-4">
              <img
                src={formData.componentImageUrls[0]}
                alt={formData.componentName}
                className="h-full w-full rounded-lg object-cover"
              />
            </div>
          ) : null}

          <div className="space-y-3 p-4">
            <div>
              <p className="text-muted-foreground text-xs">
                Category: {formData.componentCategory || "-"}
              </p>
              <h3 className="text-foreground font-semibold text-balance">
                {formData.componentName}
              </h3>
            </div>

            {formData.price && formattedPrice ? (
              <p className="text-primary text-lg font-bold wrap-break-word">
                Rp {formattedPrice}
              </p>
            ) : null}

            {formData.componentDesc ? (
              <p className="text-muted-foreground line-clamp-2 text-xs">
                {formData.componentDesc}
              </p>
            ) : null}

            {formData.componentFileName || formData.componentUrl ? (
              <div className="border-border border-t pt-3">
                <p className="text-muted-foreground text-xs">
                  Component file:{" "}
                  <span className="text-foreground">
                    {formData.componentFileName || formData.componentUrl}
                  </span>
                </p>
              </div>
            ) : null}

            <div className="border-border space-y-2 border-t pt-3">
              <div className="text-muted-foreground text-xs">
                <p>Weight: {formData.weight || "-"} kg</p>
              </div>
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
            </div>
          </div>
        </Card>
      ) : null}

      {formData.componentImageUrls.length > 1 ? (
        <Card className="border-border bg-card border p-4">
          <p className="text-muted-foreground mb-2 text-xs font-semibold">
            Images ({formData.componentImageUrls.length})
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {formData.componentImageUrls.map((image, idx) => (
              <div
                key={idx}
                className="bg-muted relative h-16 w-full overflow-hidden rounded"
              >
                <img
                  src={image}
                  alt={`Component ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
};
