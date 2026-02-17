"use client";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatPrice } from "@/lib/price";
import { ProductBase } from "@/types/product";
import { Box } from "lucide-react";
import { useEffect, useState } from "react";

type BaseProductCardProps = {
  item: ProductBase;
  viewMode: "grid" | "list";
  isUpdatingProduct: boolean;
  onToggle: (
    field: "isActive" | "isCustomizable",
    nextValue: boolean,
  ) => void;
};

const ProductPreview = ({ src, alt, list }: { src?: string; alt: string; list?: boolean }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const baseClass = list
    ? "bg-muted text-muted-foreground flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md text-xs"
    : "bg-muted text-muted-foreground flex aspect-4/3 items-center justify-center overflow-hidden text-xs";

  if (src && !hasError) {
    return (
      <div className={baseClass}>
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return <div className={baseClass}>Preview</div>;
};

export const BaseProductCard = ({
  item,
  viewMode,
  isUpdatingProduct,
  onToggle,
}: BaseProductCardProps) => {
  if (viewMode === "grid") {
    return (
      <div className="bg-card overflow-hidden rounded-lg border shadow-sm">
        <ProductPreview src={item.images?.[0]} alt={item.productName} />
        <div className="p-4">
          <div className="mb-1 flex items-center gap-2">
            <Box className="text-muted-foreground h-4 w-4" />
            <p className="text-foreground truncate text-sm font-semibold sm:text-base">
              {item.productName}
            </p>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">SKU: {item.sku}</p>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Base Price: {formatPrice(item.basePrice)}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant={item.isActive ? "default" : "secondary"}>
              {item.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">
              {item.isCustomizable ? "Customizable" : "Fixed"}
            </Badge>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Active</span>
              <Switch
                checked={item.isActive}
                disabled={isUpdatingProduct}
                onCheckedChange={(checked) => onToggle("isActive", checked)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Customizable</span>
              <Switch
                checked={item.isCustomizable}
                disabled={isUpdatingProduct}
                onCheckedChange={(checked) => onToggle("isCustomizable", checked)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <ProductPreview list src={item.images?.[0]} alt={item.productName} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Box className="text-muted-foreground h-4 w-4" />
            <p className="text-foreground truncate text-sm font-semibold sm:text-base">
              {item.productName}
            </p>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">SKU: {item.sku}</p>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Base Price: {formatPrice(item.basePrice)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={item.isActive ? "default" : "secondary"}>
              {item.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">
              {item.isCustomizable ? "Customizable" : "Fixed"}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Active</span>
              <Switch
                checked={item.isActive}
                disabled={isUpdatingProduct}
                onCheckedChange={(checked) => onToggle("isActive", checked)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Customizable</span>
              <Switch
                checked={item.isCustomizable}
                disabled={isUpdatingProduct}
                onCheckedChange={(checked) => onToggle("isCustomizable", checked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
