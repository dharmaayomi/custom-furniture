"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useDeleteProduct from "@/hooks/api/product/useDeleteProduct";
import useGetProducts from "@/hooks/api/product/useGetProducts";
import { BaseProductCard } from "./components/BaseProductCard";
import { BaseProductCardSkeleton } from "./components/BaseProductCardSkeleton";
import { ProductBase, ProductOrderBy, ProductSortBy } from "@/types/product";
import {
  CalendarDays,
  Filter,
  Grid3x3,
  List,
  PackageSearch,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { parseAsInteger, useQueryState } from "nuqs";
import { useDebounceValue } from "usehooks-ts";
import { format } from "date-fns";

export const ProductsPage = () => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [dateFrom, setDateFrom] = useQueryState("dateFrom", {
    defaultValue: "",
  });
  const [dateTo, setDateTo] = useQueryState("dateTo", {
    defaultValue: "",
  });
  const [minPrice, setMinPrice] = useQueryState("minPrice", parseAsInteger);
  const [maxPrice, setMaxPrice] = useQueryState("maxPrice", parseAsInteger);
  const [sortBy, setSortBy] = useQueryState("sortBy", {
    defaultValue: "createdAt",
  });
  const [orderBy, setOrderBy] = useQueryState("orderBy", {
    defaultValue: "desc",
  });
  const [debouncedSearch] = useDebounceValue(search, 700);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    productName: string;
  } | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const perPage = 12;
  const { userId } = useUser();
  const SORT_BY_OPTIONS: ProductSortBy[] = [
    "createdAt",
    "updatedAt",
    "productName",
    "sku",
    "basePrice",
  ];
  const resolvedSortBy: ProductSortBy = SORT_BY_OPTIONS.includes(
    sortBy as ProductSortBy,
  )
    ? (sortBy as ProductSortBy)
    : "createdAt";
  const resolvedOrderBy: ProductOrderBy =
    orderBy === "asc" || orderBy === "desc" ? orderBy : "desc";

  const { data, isLoading, isError, isFetching } = useGetProducts(
    {
      page,
      perPage,
      sortBy: resolvedSortBy,
      orderBy: resolvedOrderBy,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      minPrice: minPrice ?? undefined,
      maxPrice: maxPrice ?? undefined,
      search: debouncedSearch || undefined,
    },
    !!userId,
  );

  const baseProducts: ProductBase[] = data?.data ?? [];
  const { mutateAsync: deleteProduct, isPending: isDeleting } =
    useDeleteProduct();
  const baseMeta = data?.meta;
  const baseTotal = baseMeta?.total ?? baseProducts.length;

  const handleDeleteClick = (product: ProductBase) => {
    setDeleteTarget({ id: product.id, productName: product.productName });
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      toast.success("Product deleted successfully.");
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete product.";
      toast.error(message);
    }
  };

  const handleResetFilters = () => {
    void setSearch("");
    void setDateFrom("");
    void setDateTo("");
    void setMinPrice(null);
    void setMaxPrice(null);
    void setSortBy("createdAt");
    void setOrderBy("desc");
    void setPage(1);
  };

  const dateFromValue = dateFrom ? new Date(dateFrom) : undefined;
  const dateToValue = dateTo ? new Date(dateTo) : undefined;

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
                <PackageSearch className="text-primary h-5 w-5" />
              </div>
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                Products
              </h1>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              Manage the base product catalog.
            </p>
          </div>
          <Button
            className="w-full gap-2 sm:w-auto"
            onClick={() => router.push("/dashboard/products/add")}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </header>

      <div className="min-h-screen rounded-md">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <aside className="bg-card h-fit rounded-xl border p-4 shadow-lg/5 lg:sticky lg:top-4 lg:col-start-2">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="text-muted-foreground h-4 w-4" />
              <h2 className="text-sm font-semibold">Filters</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="product-search">Search product</Label>
                <Input
                  id="product-search"
                  placeholder="Name or SKU"
                  value={search}
                  onChange={(event) => {
                    void setSearch(event.target.value);
                    void setPage(1);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sort-by">Sort by</Label>
                <Select
                  value={resolvedSortBy}
                  onValueChange={(value) => {
                    void setSortBy(value);
                    void setPage(1);
                  }}
                >
                  <SelectTrigger id="sort-by" className="w-full">
                    <SelectValue placeholder="Select sort field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="updatedAt">Updated Date</SelectItem>
                    <SelectItem value="productName">Product Name</SelectItem>
                    <SelectItem value="sku">SKU</SelectItem>
                    <SelectItem value="basePrice">Base Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sort-order">Sort order</Label>
                <Select
                  value={resolvedOrderBy}
                  onValueChange={(value) => {
                    void setOrderBy(value);
                    void setPage(1);
                  }}
                >
                  <SelectTrigger id="sort-order" className="w-full">
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="text-muted-foreground h-4 w-4" />
                  <p className="text-sm font-medium">Date range</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date-from">From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date-from"
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        {dateFromValue ? (
                          format(dateFromValue, "LLL dd, y")
                        ) : (
                          <span className="text-muted-foreground">
                            Pick start date
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFromValue}
                        onSelect={(selectedDate) => {
                          if (!selectedDate) {
                            void setDateFrom("");
                            void setPage(1);
                            return;
                          }

                          const nextFrom = format(selectedDate, "yyyy-MM-dd");
                          void setDateFrom(nextFrom);
                          if (dateTo) {
                            const toDate = new Date(dateTo);
                            if (selectedDate.getTime() > toDate.getTime()) {
                              void setDateTo("");
                            }
                          }
                          void setPage(1);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date-to">To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date-to"
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        {dateToValue ? (
                          format(dateToValue, "LLL dd, y")
                        ) : (
                          <span className="text-muted-foreground">
                            Pick end date
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateToValue}
                        disabled={(date) =>
                          dateFromValue ? date < dateFromValue : false
                        }
                        onSelect={(selectedDate) => {
                          if (!selectedDate) {
                            void setDateTo("");
                            void setPage(1);
                            return;
                          }
                          void setDateTo(format(selectedDate, "yyyy-MM-dd"));
                          void setPage(1);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Price range</p>
                <div className="space-y-1.5">
                  <Label htmlFor="price-min">Min price</Label>
                  <Input
                    id="price-min"
                    type="number"
                    placeholder="0"
                    value={minPrice ?? ""}
                    min={0}
                    onChange={(event) => {
                      const value = event.target.value;
                      void setMinPrice(value ? Number(value) : null);
                      void setPage(1);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="price-max">Max price</Label>
                  <Input
                    id="price-max"
                    type="number"
                    placeholder="100000000"
                    value={maxPrice ?? ""}
                    min={0}
                    onChange={(event) => {
                      const value = event.target.value;
                      void setMaxPrice(value ? Number(value) : null);
                      void setPage(1);
                    }}
                  />
                </div>
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
            <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">{baseTotal} items</p>
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

            <div className="w-full">
              {isLoading ? (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                      : "space-y-4"
                  }
                >
                  {Array.from({ length: perPage }).map((_, index) => (
                    <BaseProductCardSkeleton key={index} viewMode={viewMode} />
                  ))}
                </div>
              ) : isError ? (
                <div className="border-border bg-card flex w-full flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12">
                  <PackageSearch className="text-muted-foreground/40 mb-3 h-12 w-12" />
                  <h3 className="text-foreground mb-2 text-lg font-medium">
                    Failed to load products
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Please try again later.
                  </p>
                </div>
              ) : baseProducts.length === 0 ? (
                <div className="border-border bg-card flex w-full flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12">
                  <PackageSearch className="text-muted-foreground/40 mb-3 h-12 w-12" />
                  <h3 className="text-foreground mb-2 text-lg font-medium">
                    No base products
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Add your first base product to get started.
                  </p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4"
                      : "space-y-4"
                  }
                >
                  {baseProducts.map((item) => (
                    <BaseProductCard
                      key={item.id}
                      item={item}
                      viewMode={viewMode}
                      onEdit={() =>
                        router.push(`/dashboard/products/${item.id}/edit`)
                      }
                      onDelete={() => handleDeleteClick(item)}
                    />
                  ))}
                </div>
              )}
              {baseMeta ? (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-muted-foreground text-xs">
                    Page {baseMeta.page} of{" "}
                    {Math.max(1, Math.ceil(baseMeta.total / baseMeta.perPage))}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={!baseMeta.hasPrevious || isFetching}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={!baseMeta.hasNext || isFetching}
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

      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete product?</DialogTitle>
            <DialogDescription>
              {deleteTarget ? (
                <>
                  You are about to delete{" "}
                  <span className="text-foreground font-semibold">
                    {deleteTarget.productName}
                  </span>
                  . This action cannot be undone.
                </>
              ) : (
                "Confirm delete."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
