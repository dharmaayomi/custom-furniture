"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/price";
import { ProductComponent } from "@/types/componentProduct";
import { Layers, Pencil, Trash2 } from "lucide-react";
import { toCloudinaryThumbUrl } from "./component-helpers";
import { ComponentPreview } from "./ComponentPreview";

type ComponentCardProps = {
  item: ProductComponent;
  viewMode: "grid" | "list";
  onEdit: (id: string) => void;
  onDelete: (component: ProductComponent) => void;
};

const ACTIVE_BADGE_CLASS =
  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300";
const INACTIVE_BADGE_CLASS =
  "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300";

export function ComponentCard({
  item,
  viewMode,
  onEdit,
  onDelete,
}: ComponentCardProps) {
  if (viewMode === "grid") {
    return (
      <div className="bg-card group border-border/60 hover:border-border relative overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
        {/* Image */}
        <div className="relative overflow-hidden">
          <ComponentPreview
            candidates={[
              toCloudinaryThumbUrl(item.componentUrl),
              item.componentImageUrls?.[0],
            ]}
            name={item.componentName}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-black/10 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Name */}
          <div className="mb-0.5 flex items-center gap-1.5">
            <Layers className="text-muted-foreground/70 h-3.5 w-3.5 shrink-0" />
            <p className="text-foreground truncate text-sm leading-tight font-semibold">
              {item.componentName}
            </p>
          </div>

          {/* Category + Price */}
          <div className="mt-1 flex items-center justify-between">
            <p className="text-muted-foreground/70 text-[11px]">
              {item.componentCategory}
            </p>
            <p className="text-foreground text-sm font-semibold tabular-nums">
              {item.price != null ? formatPrice(item.price) : "-"}
            </p>
          </div>

          {/* Weight */}
          <p className="text-muted-foreground/70 mt-0.5 text-[11px]">
            {item.weight} kg
          </p>

          {/* Badge */}
          <div className="mt-2">
            <Badge
              variant="outline"
              className={`h-5 px-2 py-0 text-[10px] font-medium ${item.isActive ? ACTIVE_BADGE_CLASS : INACTIVE_BADGE_CLASS}`}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Actions */}
          <div className="border-border/60 mt-3 flex gap-2 border-t pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(item.id)}
              className="hover:bg-accent h-8 flex-1 gap-1.5 bg-transparent text-xs font-medium transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDelete(item)}
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
          <ComponentPreview
            list
            candidates={[
              toCloudinaryThumbUrl(item.componentUrl),
              item.componentImageUrls?.[0],
            ]}
            name={item.componentName}
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-1.5">
            <Layers className="text-muted-foreground/70 h-3.5 w-3.5 shrink-0" />
            <p className="text-foreground truncate text-sm font-semibold">
              {item.componentName}
            </p>
          </div>
          <div className="mb-1 flex items-center gap-3">
            <p className="text-muted-foreground/70 text-[11px]">
              {item.componentCategory}
            </p>
            <span className="text-border">·</span>
            <p className="text-foreground/80 text-[11px] font-semibold tabular-nums">
              {item.price != null ? formatPrice(item.price) : "-"}
            </p>
            <span className="text-border">·</span>
            <p className="text-muted-foreground/70 text-[11px]">
              {item.weight} kg
            </p>
          </div>
          <Badge
            variant="outline"
            className={`h-5 px-2 py-0 text-[10px] font-medium ${item.isActive ? ACTIVE_BADGE_CLASS : INACTIVE_BADGE_CLASS}`}
          >
            {item.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(item.id)}
            className="hover:bg-accent h-8 flex-1 gap-1.5 bg-transparent text-xs font-medium transition-colors sm:flex-none sm:px-3"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDelete(item)}
            className="text-destructive hover:bg-destructive hover:border-destructive h-8 w-8 bg-transparent p-0 transition-colors hover:text-white sm:flex-none"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
