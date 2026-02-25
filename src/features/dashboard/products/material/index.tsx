"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useDeleteMaterial from "@/hooks/api/product/useDeleteMaterial";
import useGetMaterials from "@/hooks/api/product/useGetMaterials";
import { MaterialCategory, ProductMaterial } from "@/types/materialProduct";
import { Filter, Plus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseAsInteger, useQueryState } from "nuqs";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import { MaterialDeleteDialog } from "./components/MaterialDeleteDialog";
import { MaterialListContent } from "./components/MaterialListContent";
import { MATERIAL_CATEGORIES } from "./components/materialHelpers";

export const ProductMaterialPage = () => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] =
    useState<ProductMaterial | null>(null);
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [categoryFilter, setCategoryFilter] = useQueryState("category", {
    defaultValue: "ALL",
  });
  const [statusFilter, setStatusFilter] = useQueryState("status", {
    defaultValue: "ALL",
  });
  const [minPrice, setMinPrice] = useQueryState("minPrice", parseAsInteger);
  const [maxPrice, setMaxPrice] = useQueryState("maxPrice", parseAsInteger);
  const [sortBy, setSortBy] = useQueryState("sortBy", {
    defaultValue: "materialName",
  });
  const [orderBy, setOrderBy] = useQueryState("orderBy", {
    defaultValue: "asc",
  });
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const perPage = 9;
  const [debouncedSearch] = useDebounceValue(search, 500);

  const resolvedCategory =
    categoryFilter === "ALL" ? undefined : (categoryFilter as MaterialCategory);
  const resolvedIsActive =
    statusFilter === "ACTIVE"
      ? true
      : statusFilter === "INACTIVE"
        ? false
        : undefined;
  const resolvedSortBy =
    sortBy === "price" ||
    sortBy === "materialCategory" ||
    sortBy === "createdAt" ||
    sortBy === "updatedAt"
      ? sortBy
      : "materialName";
  const resolvedOrderBy = orderBy === "desc" ? "desc" : "asc";

  const { data, isLoading, isError } = useGetMaterials(
    {
      page,
      perPage,
      sortBy: resolvedSortBy,
      orderBy: resolvedOrderBy,
      minPrice: minPrice ?? undefined,
      maxPrice: maxPrice ?? undefined,
      isActive: resolvedIsActive,
      category: resolvedCategory,
      search: debouncedSearch || undefined,
    },
    true,
  );

  const materials: ProductMaterial[] = data?.data ?? [];
  const meta = data?.meta;
  const totalItems = meta?.total ?? materials.length;
  const { mutateAsync: deleteMaterial, isPending: isDeleting } =
    useDeleteMaterial();

  const handleResetFilters = () => {
    void setSearch("");
    void setCategoryFilter("ALL");
    void setStatusFilter("ALL");
    void setMinPrice(null);
    void setMaxPrice(null);
    void setSortBy("materialName");
    void setOrderBy("asc");
    void setPage(1);
  };

  const openDeleteDialog = (material: ProductMaterial) => {
    setSelectedMaterial(material);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedMaterial) return;
    try {
      await deleteMaterial(selectedMaterial.id);
      toast.success("Material deleted successfully.");
      setIsDeleteOpen(false);
      setSelectedMaterial(null);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Failed to delete material.";
      toast.error(message);
    }
  };

  return (
    <section>
      <div className="bg-muted/60 mb-8 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
              Materials
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Manage product material catalog.
            </p>
          </div>
          <Button
            className="w-full gap-2 sm:w-auto"
            onClick={() => router.push("/dashboard/products/materials/add")}
          >
            <Plus className="h-4 w-4" />
            Add Material
          </Button>
        </div>
      </div>

      <div className="bg-muted/50 rounded-md p-3 sm:p-4">
        <div className="mx-auto px-1 py-3 sm:px-4 sm:py-4 lg:px-2 lg:py-2">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <aside className="bg-card border-border h-fit rounded-lg border p-4 lg:sticky lg:top-4 lg:col-start-2">
              <div className="mb-4 flex items-center gap-2">
                <Filter className="text-muted-foreground h-4 w-4" />
                <h2 className="text-sm font-semibold">Filters</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="material-search">Search</Label>
                  <Input
                    id="material-search"
                    placeholder="Name or category"
                    value={search}
                    onChange={(event) => {
                      void setSearch(event.target.value);
                      void setPage(1);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="material-category">Category</Label>
                  <select
                    id="material-category"
                    value={categoryFilter}
                    className="border-input bg-muted/40 h-9 w-full rounded-md border px-3 text-sm outline-none"
                    onChange={(event) => {
                      void setCategoryFilter(
                        event.target.value as "ALL" | MaterialCategory,
                      );
                      void setPage(1);
                    }}
                  >
                    <option value="ALL">All Categories</option>
                    {MATERIAL_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="material-status">Status</Label>
                  <select
                    id="material-status"
                    value={statusFilter}
                    className="border-input bg-muted/40 h-9 w-full rounded-md border px-3 text-sm outline-none"
                    onChange={(event) => {
                      void setStatusFilter(
                        event.target.value as "ALL" | "ACTIVE" | "INACTIVE",
                      );
                      void setPage(1);
                    }}
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Price range</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="material-min-price">Min price</Label>
                    <Input
                      id="material-min-price"
                      type="number"
                      min={0}
                      value={minPrice ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        void setMinPrice(value ? Number(value) : null);
                        void setPage(1);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="material-max-price">Max price</Label>
                    <Input
                      id="material-max-price"
                      type="number"
                      min={0}
                      value={maxPrice ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        void setMaxPrice(value ? Number(value) : null);
                        void setPage(1);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="material-sort-by">Sort by</Label>
                  <select
                    id="material-sort-by"
                    value={sortBy}
                    className="border-input bg-muted/40 h-9 w-full rounded-md border px-3 text-sm outline-none"
                    onChange={(event) => {
                      void setSortBy(
                        event.target.value as "materialName" | "price",
                      );
                      void setPage(1);
                    }}
                  >
                    <option value="materialName">Material Name</option>
                    <option value="materialCategory">Category</option>
                    <option value="price">Price</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="material-sort-order">Sort order</Label>
                  <select
                    id="material-sort-order"
                    value={orderBy}
                    className="border-input bg-muted/40 h-9 w-full rounded-md border px-3 text-sm outline-none"
                    onChange={(event) => {
                      void setOrderBy(event.target.value as "asc" | "desc");
                      void setPage(1);
                    }}
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResetFilters}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Filters
                </Button>
              </div>
            </aside>

            <div className="lg:col-start-1 lg:row-start-1">
              <MaterialListContent
                viewMode={viewMode}
                setViewMode={setViewMode}
                isLoading={isLoading}
                isError={isError}
                materials={materials}
                totalItems={totalItems}
                onEdit={(id) =>
                  router.push(`/dashboard/products/materials/${id}/edit`)
                }
                onDelete={openDeleteDialog}
              />

              {!isLoading && !isError && totalItems > 0 ? (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-muted-foreground text-xs">
                    Page {meta?.page ?? page} of{" "}
                    {meta
                      ? Math.max(1, Math.ceil(meta.total / meta.perPage))
                      : 1}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void setPage(Math.max(1, (meta?.page ?? page) - 1))
                      }
                      disabled={!meta?.hasPrevious}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void setPage((meta?.page ?? page) + 1)}
                      disabled={!meta?.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <MaterialDeleteDialog
        open={isDeleteOpen}
        material={selectedMaterial}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) setSelectedMaterial(null);
        }}
        onConfirm={handleDelete}
      />
    </section>
  );
};
