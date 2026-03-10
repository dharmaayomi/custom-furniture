"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useDeleteComponent from "@/hooks/api/product/useDeleteComponent";
import useGetComponents from "@/hooks/api/product/useGetComponents";
import { ComponentCategory, ProductComponent } from "@/types/componentProduct";
import { Boxes, Filter, Plus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseAsInteger, useQueryState } from "nuqs";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import { ComponentDeleteDialog } from "./components/ComponentDeleteDialog";
import { ComponentListContent } from "./components/ComponentListContent";
import { COMPONENT_CATEGORIES } from "./components/component-helpers";

export const ProductComponentPage = () => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
    defaultValue: "componentName",
  });
  const [orderBy, setOrderBy] = useQueryState("orderBy", {
    defaultValue: "asc",
  });
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const perPage = 12;
  const [debouncedSearch] = useDebounceValue(search, 500);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] =
    useState<ProductComponent | null>(null);

  const resolvedCategory =
    categoryFilter === "ALL"
      ? undefined
      : (categoryFilter as ComponentCategory);
  const resolvedIsActive =
    statusFilter === "ACTIVE"
      ? true
      : statusFilter === "INACTIVE"
        ? false
        : undefined;
  const resolvedSortBy =
    sortBy === "price" ||
    sortBy === "componentCategory" ||
    sortBy === "createdAt" ||
    sortBy === "updatedAt"
      ? sortBy
      : "componentName";
  const resolvedOrderBy = orderBy === "desc" ? "desc" : "asc";

  const { data, isLoading, isError } = useGetComponents(
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

  const components = data?.data ?? [];
  const meta = data?.meta;
  const { mutateAsync: deleteComponent, isPending: isDeleting } =
    useDeleteComponent();
  const totalItems = meta?.total ?? components.length;

  const handleResetFilters = () => {
    void setSearch("");
    void setCategoryFilter("ALL");
    void setStatusFilter("ALL");
    void setMinPrice(null);
    void setMaxPrice(null);
    void setSortBy("componentName");
    void setOrderBy("asc");
    void setPage(1);
  };

  const openDeleteDialog = (component: ProductComponent) => {
    setSelectedComponent(component);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedComponent) return;
    try {
      await deleteComponent(selectedComponent.id);
      toast.success("Component deleted successfully.");
      setIsDeleteOpen(false);
      setSelectedComponent(null);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Failed to delete component.";
      toast.error(message);
    }
  };

  return (
    <section>
      <header className="bg-card border-accent relative mb-8 overflow-hidden rounded-2xl border px-6 py-10 shadow-lg/5 sm:px-10">
        <div className="from-primary/5 to-primary/20 pointer-events-none absolute -top-17 -right-20 h-72 w-72 rounded-full bg-linear-to-br md:-top-14 md:-right-24 lg:-top-16 lg:-right-8" />
        <div className="from-primary/10 to-primary/30 pointer-events-none absolute -top-13 -right-28 h-64 w-64 rounded-full bg-linear-to-br md:-top-10 md:-right-32 lg:-top-12 lg:-right-12" />
        <div className="from-primary/20 to-primary/80 pointer-events-none absolute -top-9 -right-36 h-56 w-56 rounded-full bg-linear-to-br md:-top-6 md:-right-40 lg:-top-8 lg:-right-16" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <div className="bg-primary/10 rounded-lg p-2">
                <Boxes className="text-primary h-5 w-5" />
              </div>
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                Components
              </h1>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              Manage customization components.
            </p>
          </div>
          <Button
            className="w-full gap-2 sm:w-auto"
            onClick={() => router.push("/dashboard/products/components/add")}
          >
            <Plus className="h-4 w-4" />
            Add Component
          </Button>
        </div>
      </header>

      <div className="bg-muted/50 rounded-md p-3 sm:p-4">
        <div className="mx-auto px-1 py-3 sm:px-4 sm:py-4 lg:px-2 lg:py-2">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <aside className="bg-card h-fit rounded-xl border p-4 shadow-lg/5 lg:sticky lg:top-4 lg:col-start-2">
              <div className="mb-4 flex items-center gap-2">
                <Filter className="text-muted-foreground h-4 w-4" />
                <h2 className="text-sm font-semibold">Filters</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="component-search">Search</Label>
                  <Input
                    id="component-search"
                    placeholder="Name or category"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      void setPage(1);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="component-category">Category</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={(value) => {
                      void setCategoryFilter(
                        value as "ALL" | ComponentCategory,
                      );
                      void setPage(1);
                    }}
                  >
                    <SelectTrigger id="component-category" className="w-full">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Categories</SelectItem>
                      {COMPONENT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="component-status">Status</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      void setStatusFilter(
                        value as "ALL" | "ACTIVE" | "INACTIVE",
                      );
                      void setPage(1);
                    }}
                  >
                    <SelectTrigger id="component-status" className="w-full">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Price range</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="component-min-price">Min price</Label>
                    <Input
                      id="component-min-price"
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
                    <Label htmlFor="component-max-price">Max price</Label>
                    <Input
                      id="component-max-price"
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
                  <Label htmlFor="component-sort-by">Sort by</Label>
                  <Select
                    value={sortBy}
                    onValueChange={(value) => {
                      void setSortBy(
                        value as
                          | "componentName"
                          | "componentCategory"
                          | "price"
                          | "createdAt"
                          | "updatedAt",
                      );
                      void setPage(1);
                    }}
                  >
                    <SelectTrigger id="component-sort-by" className="w-full">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="componentName">
                        Component Name
                      </SelectItem>
                      <SelectItem value="componentCategory">
                        Category
                      </SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="component-sort-order">Sort order</Label>
                  <Select
                    value={orderBy}
                    onValueChange={(value) => {
                      void setOrderBy(value as "asc" | "desc");
                      void setPage(1);
                    }}
                  >
                    <SelectTrigger id="component-sort-order" className="w-full">
                      <SelectValue placeholder="Sort order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
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
              <ComponentListContent
                viewMode={viewMode}
                setViewMode={setViewMode}
                isLoading={isLoading}
                isError={isError}
                components={components}
                totalItems={totalItems}
                onEdit={(id) =>
                  router.push(`/dashboard/products/components/${id}/edit`)
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

      <ComponentDeleteDialog
        open={isDeleteOpen}
        component={selectedComponent}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) setSelectedComponent(null);
        }}
        onConfirm={handleDelete}
      />
    </section>
  );
};
