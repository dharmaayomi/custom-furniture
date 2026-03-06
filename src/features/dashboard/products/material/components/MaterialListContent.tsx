"use client";

import { Button } from "@/components/ui/button";
import { ProductMaterial } from "@/types/materialProduct";
import { Grid3x3, List, PackageSearch } from "lucide-react";
import { MaterialCard } from "./MaterialCard";

type MaterialListContentProps = {
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  isLoading: boolean;
  isError: boolean;
  materials: ProductMaterial[];
  totalItems: number;
  onEdit: (id: string) => void;
  onDelete: (material: ProductMaterial) => void;
};

function MaterialListSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  return (
    <div
      className={
        viewMode === "grid"
          ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
          : "space-y-4"
      }
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="bg-card overflow-hidden rounded-lg border shadow-sm"
        >
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

function MaterialState({
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

export function MaterialListContent({
  viewMode,
  setViewMode,
  isLoading,
  isError,
  materials,
  totalItems,
  onEdit,
  onDelete,
}: MaterialListContentProps) {
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
        <MaterialListSkeleton viewMode={viewMode} />
      ) : isError ? (
        <MaterialState
          title="Failed to load materials"
          description="Please try again later."
        />
      ) : materials.length === 0 ? (
        <MaterialState
          title="No materials found"
          description="Create your first material to get started."
        />
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
              : "space-y-4"
          }
        >
          {materials.map((item) => (
            <MaterialCard
              key={item.id}
              item={item}
              viewMode={viewMode}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </>
  );
}
