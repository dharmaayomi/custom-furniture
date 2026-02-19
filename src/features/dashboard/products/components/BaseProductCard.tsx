"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/price";
import { ProductBase } from "@/types/product";
import { Box, Edit2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type BaseProductCardProps = {
  item: ProductBase;
  viewMode: "grid" | "list";
  onEdit: () => void;
  onDelete: () => void;
};

const ProductPreview = ({ src, alt, list }: { src?: string; alt: string; list?: boolean }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const baseClass = list
    ? "bg-muted text-muted-foreground flex h-20 w-full shrink-0 items-center justify-center overflow-hidden rounded-md text-xs sm:h-16 sm:w-24"
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
  onEdit,
  onDelete,
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
          <div className="border-border mt-4 flex gap-2 border-t pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1 bg-transparent"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:bg-destructive bg-transparent hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-4 shadow-sm">
      <div className="flex flex-col items-start gap-3 sm:flex-row">
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
          <div className="mt-3 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="bg-transparent sm:w-auto"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:bg-destructive bg-transparent hover:text-white sm:w-auto"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
