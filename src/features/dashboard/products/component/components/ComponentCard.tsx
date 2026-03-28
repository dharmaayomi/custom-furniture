"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/price";
import { cn } from "@/lib/utils";
import { ProductComponent } from "@/types/componentProduct";
import { Edit3, Layers, Trash2, Weight } from "lucide-react";
import { toCloudinaryThumbUrl } from "./component-helpers";
import { ComponentPreview } from "./ComponentPreview";

type ComponentCardProps = {
  item: ProductComponent;
  viewMode: "grid" | "list";
  onEdit: (id: string) => void;
  onDelete: (component: ProductComponent) => void;
};

const BADGE_BASE =
  "h-5 px-2 py-0 text-[10px] font-bold uppercase border rounded-md shadow-none";
const ACTIVE_CLASS =
  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300";
const INACTIVE_CLASS =
  "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300";
const CATEGORY_CLASS =
  "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300";

export function ComponentCard({
  item,
  viewMode,
  onEdit,
  onDelete,
}: ComponentCardProps) {
  const previewCandidates = [
    toCloudinaryThumbUrl(item.componentUrl),
    item.componentUrl,
    item.componentImageUrls?.[0],
  ];

  if (viewMode === "grid") {
    return (
      <div className="group bg-card border-border/60 hover:border-primary/40 flex flex-col rounded-xl border shadow-sm transition-all duration-200">
        <ComponentPreview
          candidates={previewCandidates}
          name={item.componentName}
        />

        <div className="flex flex-1 flex-col p-3">
          <div className="mb-2 space-y-0.5">
            <h3 className="text-foreground line-clamp-1 text-xs font-bold tracking-tight">
              {item.componentName}
            </h3>
            <div className="flex items-center justify-between gap-2">
              <div className="text-muted-foreground/60 flex items-center gap-1">
                <Layers className="h-3 w-3" />
                <span className="font-mono text-[9px] font-bold tracking-tighter uppercase">
                  {item.componentSku || "N/A"}
                </span>
              </div>
              <p className="text-foreground text-[13px] font-black tracking-tight tabular-nums">
                {item.price != null ? formatPrice(item.price) : "-"}
              </p>
            </div>
          </div>

          <div className="mb-2 flex flex-wrap gap-1">
            <Badge
              variant="outline"
              className={cn(
                BADGE_BASE,
                "h-4 px-1 text-[8px]",
                item.isActive ? ACTIVE_CLASS : INACTIVE_CLASS,
              )}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge
              variant="outline"
              className={cn(BADGE_BASE, "h-4 px-1 text-[8px]", CATEGORY_CLASS)}
            >
              {item.componentCategory}
            </Badge>
          </div>

          <div className="text-muted-foreground mb-3 flex items-center gap-1.5 text-[10px] font-medium">
            <Weight className="h-3 w-3" />
            <span>{item.weight} kg</span>
          </div>

          <div className="mt-auto flex gap-1.5 border-t pt-2.5">
            <Button
              type="button"
              onClick={() => onEdit(item.id)}
              variant="secondary"
              className="h-7 flex-1 rounded-md px-0 text-[10px] font-bold"
            >
              <Edit3 className="mr-1.5 h-3 w-3" /> Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onDelete(item)}
              className="text-destructive hover:bg-destructive/10 border-destructive/20 h-7 w-7 rounded-md p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-card border-border/60 hover:border-primary/40 flex flex-row items-center gap-4 rounded-xl border p-2 shadow-sm transition-colors">
      <ComponentPreview
        list
        candidates={previewCandidates}
        name={item.componentName}
      />

      <div className="flex min-w-0 flex-1 items-center justify-between pr-2">
        <div className="min-w-0">
          <h3 className="text-foreground truncate text-sm font-bold tracking-tight">
            {item.componentName}
          </h3>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-[10px] font-bold uppercase">
              {item.componentSku || "N/A"}
            </span>
            <span className="text-border">|</span>
            <span className="text-primary text-xs font-black">
              {item.price != null ? formatPrice(item.price) : "-"}
            </span>
            <span className="text-border">|</span>
            <span className="text-muted-foreground text-[10px] font-medium">
              {item.weight} kg
            </span>
          </div>
        </div>

        <div className="ml-4 flex items-center gap-3">
          <div className="hidden gap-1.5 md:flex">
            <Badge
              variant="outline"
              className={cn(
                BADGE_BASE,
                item.isActive ? ACTIVE_CLASS : INACTIVE_CLASS,
              )}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge
              variant="outline"
              className={cn(BADGE_BASE, CATEGORY_CLASS)}
            >
              {item.componentCategory}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 border-l pl-3">
            <Button
              type="button"
              onClick={() => onEdit(item.id)}
              variant="secondary"
              className="h-8 rounded-lg px-3 text-xs font-bold"
            >
              <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onDelete(item)}
              className="text-destructive hover:bg-destructive/10 border-destructive/20 h-8 w-8 rounded-lg"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
