"use client";

import { Card } from "@/components/ui/card";
import { formatIdrAmount } from "@/lib/price";

export type MaterialPreviewFormData = {
  materialName: string;
  materialSku?: string;
  materialDesc: string;
  materialCategory: string;
  price: string;
  materialUrl?: string;
  materialImageUrls: string[];
};

type MaterialFormPreviewProps = {
  formData: MaterialPreviewFormData;
  isCategoryTouched?: boolean;
};

export const MaterialFormPreview = ({
  formData,
  isCategoryTouched = true,
}: MaterialFormPreviewProps) => {
  const parsedPrice = Number(formData.price);
  const formattedPrice = Number.isFinite(parsedPrice)
    ? formatIdrAmount(parsedPrice)
    : null;

  const completeness = {
    materialName: !!formData.materialName,
    materialSku: !!formData.materialSku,
    materialCategory: !!formData.materialCategory && isCategoryTouched,
    materialDesc: !!formData.materialDesc,
    price: !!formData.price,
    image: formData.materialImageUrls.length > 0 || !!formData.materialUrl,
  };

  const completedFields = Object.values(completeness).filter(Boolean).length;
  const completionPercentage = Math.round(
    (completedFields / Object.keys(completeness).length) * 100,
  );

  const previewImage = formData.materialImageUrls[0] || formData.materialUrl;

  return (
    <div className="space-y-4 md:sticky md:top-4">
      <div>
        <h2 className="text-foreground text-lg font-semibold">
          Preview & Progress
        </h2>
        <p className="text-muted-foreground text-sm">Live preview of your material</p>
      </div>

      <Card className="border-border bg-card border p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">Completion</span>
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

      {completeness.materialName ? (
        <Card className="border-border bg-card overflow-hidden border">
          {previewImage ? (
            <div className="relative h-40 w-full px-4">
              <img
                src={previewImage}
                alt={formData.materialName}
                className="h-full w-full rounded-lg object-cover"
              />
            </div>
          ) : null}

          <div className="space-y-3 p-4">
            <div>
              <p className="text-muted-foreground text-xs">
                Category: {formData.materialCategory || "-"}
              </p>
              <p className="text-muted-foreground text-xs">
                SKU: {formData.materialSku || "-"}
              </p>
              <h3 className="text-foreground font-semibold text-balance">
                {formData.materialName}
              </h3>
            </div>

            {formData.price && formattedPrice ? (
              <p className="text-primary text-lg font-bold">Rp {formattedPrice}</p>
            ) : null}

            {formData.materialDesc ? (
              <p className="text-muted-foreground line-clamp-2 text-xs">
                {formData.materialDesc}
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
};
