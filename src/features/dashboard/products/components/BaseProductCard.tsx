"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/price";
import { ProductBase } from "@/types/product";
import { Box, Edit2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type BaseProductCardProps = {
  item: ProductBase;
  viewMode: "grid" | "list";
  onEdit: () => void;
  onDelete: () => void;
};

const toCloudinaryThumbUrl = (url?: string) => {
  if (!url) return undefined;
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return undefined;
  }

  return url.replace(
    "/upload/",
    "/upload/w_320,h_240,c_fill,q_auto,f_auto/",
  );
};

const ProductPreview = ({
  candidates,
  alt,
  list,
}: {
  candidates: (string | undefined)[];
  alt: string;
  list?: boolean;
}) => {
  const normalizedCandidates = useMemo(
    () => candidates.filter((item): item is string => !!item),
    [candidates],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const baseClass = list
    ? "bg-muted text-muted-foreground flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md text-xs"
    : "bg-muted text-muted-foreground flex aspect-4/3 items-center justify-center overflow-hidden text-xs";

  const activeImage = normalizedCandidates[activeIndex];

  if (process.env.NODE_ENV !== "production") {
    console.debug("[BaseProductCard] preview state", {
      alt,
      activeIndex,
      activeImage,
      candidates: normalizedCandidates,
    });
  }

  if (activeImage) {
    return (
      <div className={baseClass}>
        <img
          src={activeImage}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => {
            if (process.env.NODE_ENV !== "production") {
              console.warn("[BaseProductCard] preview image failed", {
                alt,
                failedImage: activeImage,
                activeIndex,
                nextIndex:
                  activeIndex < normalizedCandidates.length - 1
                    ? activeIndex + 1
                    : null,
              });
            }
            if (activeIndex < normalizedCandidates.length - 1) {
              setActiveIndex((prev) => prev + 1);
            }
          }}
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
  const previewCandidates = useMemo(() => {
    const original = item.productUrl;
    const cloudinaryThumb = toCloudinaryThumbUrl(original);
    const imageFallback = item.images?.[0];
    const resolved = [cloudinaryThumb, original, imageFallback];

    if (process.env.NODE_ENV !== "production") {
      console.debug("[BaseProductCard] preview candidates", {
        productName: item.productName,
        original,
        cloudinaryThumb,
        imageFallback,
        resolved,
      });
    }

    return resolved;
  }, [item.images, item.productName, item.productUrl]);

  if (viewMode === "grid") {
    return (
      <div className="bg-card overflow-hidden rounded-lg border shadow-sm">
        <ProductPreview candidates={previewCandidates} alt={item.productName} />
        <div className="p-3">
          <div className="mb-1 flex items-center gap-2">
            <Box className="text-muted-foreground h-4 w-4" />
            <p className="text-foreground truncate text-sm font-semibold">
              {item.productName}
            </p>
          </div>
          <p className="text-muted-foreground text-xs">SKU: {item.sku}</p>
          <p className="text-muted-foreground text-xs">
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
          <div className="border-border mt-3 flex gap-2 border-t pt-2">
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
    <div className="bg-card rounded-lg border p-3 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <ProductPreview
          list
          candidates={previewCandidates}
          alt={item.productName}
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Box className="text-muted-foreground h-4 w-4" />
            <p className="text-foreground truncate text-sm font-semibold">
              {item.productName}
            </p>
          </div>
          <p className="text-muted-foreground text-xs">SKU: {item.sku}</p>
          <p className="text-muted-foreground text-xs">
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
        </div>
        <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1 bg-transparent sm:flex-none"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:bg-destructive bg-transparent hover:text-white sm:flex-none"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
