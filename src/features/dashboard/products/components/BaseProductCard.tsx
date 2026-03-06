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

const ACTIVE_BADGE_CLASS =
  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300";
const INACTIVE_BADGE_CLASS =
  "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300";
const CUSTOMIZABLE_BADGE_CLASS =
  "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300";
const FIXED_BADGE_CLASS =
  "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300";

const toCloudinaryThumbUrl = (url?: string) => {
  if (!url) return undefined;
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return undefined;
  }

  return url.replace("/upload/", "/upload/w_320,h_240,c_fill,q_auto,f_auto/");
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
    ? "bg-muted text-muted-foreground flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs"
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
          className="h-full w-full transform-gpu object-cover transition-all duration-500 ease-in-out hover:scale-105"
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

  return (
    <div className={baseClass}>
      <div className="flex flex-col items-center gap-1 opacity-40">
        <Box className="h-6 w-6" />
        <span className="text-[10px] font-medium tracking-wide uppercase">
          No Preview
        </span>
      </div>
    </div>
  );
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
      <div className="bg-card group border-border/60 hover:border-border relative overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
        {/* Image */}
        <div className="relative overflow-hidden">
          <ProductPreview
            candidates={previewCandidates}
            alt={item.productName}
          />
          {/* Subtle gradient overlay at bottom of image */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-black/10 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Name + SKU */}
          <div className="mb-3">
            <div className="mb-0.5 flex items-center gap-1.5">
              <Box className="text-muted-foreground/70 h-3.5 w-3.5 shrink-0" />
              <p className="text-foreground truncate text-sm leading-tight font-semibold">
                {item.productName}
              </p>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-muted-foreground/70 font-mono text-[11px]">
                {item.sku}
              </p>
              <p className="text-foreground text-sm font-semibold tabular-nums">
                {formatPrice(item.basePrice)}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={`h-5 px-2 py-0 text-[10px] font-medium ${item.isActive ? ACTIVE_BADGE_CLASS : INACTIVE_BADGE_CLASS}`}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge
              variant="outline"
              className={`h-5 px-2 py-0 text-[10px] font-medium ${item.isCustomizable ? CUSTOMIZABLE_BADGE_CLASS : FIXED_BADGE_CLASS}`}
            >
              {item.isCustomizable ? "Customizable" : "Fixed"}
            </Badge>
          </div>

          {/* Actions */}
          <div className="border-border/60 mt-3 flex gap-2 border-t pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="hover:bg-accent h-8 flex-1 gap-1.5 bg-transparent text-xs font-medium transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:bg-destructive hover:border-destructive h-8 w-8 bg-transparent p-0 transition-colors hover:text-white"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border-border/60 hover:border-border rounded-xl border p-3 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Thumbnail */}
        <div className="ring-border/40 overflow-hidden rounded-lg ring-1">
          <ProductPreview
            list
            candidates={previewCandidates}
            alt={item.productName}
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-1.5">
            <Box className="text-muted-foreground/70 h-3.5 w-3.5 shrink-0" />
            <p className="text-foreground truncate text-sm font-semibold">
              {item.productName}
            </p>
          </div>
          <div className="mb-2 flex items-center gap-3">
            <p className="text-muted-foreground/70 font-mono text-[11px]">
              {item.sku}
            </p>
            <span className="text-border">·</span>
            <p className="text-foreground/80 text-[11px] font-semibold tabular-nums">
              {formatPrice(item.basePrice)}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={`h-5 px-2 py-0 text-[10px] font-medium ${item.isActive ? ACTIVE_BADGE_CLASS : INACTIVE_BADGE_CLASS}`}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge
              variant="outline"
              className={`h-5 px-2 py-0 text-[10px] font-medium ${item.isCustomizable ? CUSTOMIZABLE_BADGE_CLASS : FIXED_BADGE_CLASS}`}
            >
              {item.isCustomizable ? "Customizable" : "Fixed"}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="hover:bg-accent h-8 flex-1 gap-1.5 bg-transparent text-xs font-medium transition-colors sm:flex-none sm:px-3"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:bg-destructive hover:border-destructive h-8 w-8 bg-transparent p-0 transition-colors hover:text-white sm:flex-none"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
