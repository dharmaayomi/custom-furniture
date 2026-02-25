"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/price";
import { ProductComponent } from "@/types/componentProduct";
import {
  Grid3x3,
  Layers,
  List,
  PackageSearch,
  Pencil,
  Trash2,
} from "lucide-react";
import { ComponentPreview } from "./ComponentPreview";
import { toCloudinaryThumbUrl } from "./component-helpers";

type ComponentListContentProps = {
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  isLoading: boolean;
  isError: boolean;
  components: ProductComponent[];
  totalItems: number;
  onEdit: (id: string) => void;
  onDelete: (component: ProductComponent) => void;
};

const ACTIVE_BADGE_CLASS =
  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300";
const INACTIVE_BADGE_CLASS =
  "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300";

function ComponentListSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  return (
    <div
      className={
        viewMode === "grid"
          ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
          : "space-y-4"
      }
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-card overflow-hidden rounded-lg border shadow-sm">
          <div className="bg-muted aspect-4/3 w-full animate-pulse" />
          <div className="space-y-2 p-3">
            <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
            <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ComponentState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-border bg-card flex w-full flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12">
      <PackageSearch className="text-muted-foreground/40 mb-3 h-12 w-12" />
      <h3 className="text-foreground mb-2 text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

export function ComponentListContent({
  viewMode,
  setViewMode,
  isLoading,
  isError,
  components,
  totalItems,
  onEdit,
  onDelete,
}: ComponentListContentProps) {
  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">{totalItems} items</p>
        <div className="border-border bg-muted flex w-full gap-2 rounded-lg border p-1 sm:w-auto">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="flex-1 gap-2 sm:flex-none"
          >
            <Grid3x3 className="h-4 w-4" />
            Grid
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="flex-1 gap-2 sm:flex-none"
          >
            <List className="h-4 w-4" />
            List
          </Button>
        </div>
      </div>

      {isLoading ? (
        <ComponentListSkeleton viewMode={viewMode} />
      ) : isError ? (
        <ComponentState
          title="Failed to load components"
          description="Please try again later."
        />
      ) : components.length === 0 ? (
        <ComponentState
          title="No components found"
          description="Create your first component to get started."
        />
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
              : "space-y-4"
          }
        >
          {components.map((item) =>
            viewMode === "grid" ? (
              <div key={item.id} className="bg-card overflow-hidden rounded-lg border shadow-sm">
                <div className="overflow-hidden">
                  <ComponentPreview
                    candidates={[
                      toCloudinaryThumbUrl(item.componentUrl),
                      item.componentImageUrls?.[0],
                    ]}
                    name={item.componentName}
                  />
                </div>
                <div className="p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Layers className="text-muted-foreground h-4 w-4" />
                    <p className="text-foreground truncate text-sm font-semibold">
                      {item.componentName}
                    </p>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Category: {item.componentCategory}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Price: {item.price != null ? formatPrice(item.price) : "-"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Weight: {item.weight} kg
                  </p>
                  <div className="mt-2">
                    <Badge
                      variant="outline"
                      className={item.isActive ? ACTIVE_BADGE_CLASS : INACTIVE_BADGE_CLASS}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="border-border mt-3 flex gap-2 border-t pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item.id)}
                      className="flex-1 bg-transparent"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(item)}
                      className="text-destructive hover:bg-destructive bg-transparent hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div key={item.id} className="bg-card rounded-lg border p-3 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <ComponentPreview
                    list
                    candidates={[
                      toCloudinaryThumbUrl(item.componentUrl),
                      item.componentImageUrls?.[0],
                    ]}
                    name={item.componentName}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Layers className="text-muted-foreground h-4 w-4" />
                      <p className="text-foreground truncate text-sm font-semibold">
                        {item.componentName}
                      </p>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Category: {item.componentCategory}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Price: {item.price != null ? formatPrice(item.price) : "-"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Weight: {item.weight} kg
                    </p>
                    <div className="mt-2">
                      <Badge
                        variant="outline"
                        className={
                          item.isActive ? ACTIVE_BADGE_CLASS : INACTIVE_BADGE_CLASS
                        }
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item.id)}
                      className="flex-1 bg-transparent sm:flex-none"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(item)}
                      className="text-destructive hover:bg-destructive bg-transparent hover:text-white sm:flex-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </>
  );
}
