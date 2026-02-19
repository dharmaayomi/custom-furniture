"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useDeleteProduct from "@/hooks/api/product/useDeleteProduct";
import useGetProducts from "@/hooks/api/product/useGetProducts";
import { BaseProductCard } from "./components/BaseProductCard";
import { BaseProductCardSkeleton } from "./components/BaseProductCardSkeleton";
import { ProductBase, ProductOrderBy, ProductSortBy } from "@/types/product";
import {
  CalendarDays,
  Filter,
  Grid3x3,
  Layers,
  List,
  PackageSearch,
  Palette,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { parseAsInteger, useQueryState } from "nuqs";
import { useDebounceValue } from "usehooks-ts";

type ComponentItem = {
  id: number;
  componentName: string;
  category: string;
  price: string;
  isActive: boolean;
};

type MaterialItem = {
  id: number;
  materialName: string;
  finish: string;
  isActive: boolean;
};

const COMPONENTS: ComponentItem[] = [
  {
    id: 1,
    componentName: "Soft-Close Drawer",
    category: "DRAWER",
    price: "Rp 350.000",
    isActive: true,
  },
  {
    id: 2,
    componentName: "Sliding Door Rail",
    category: "RAIL",
    price: "Rp 475.000",
    isActive: true,
  },
  {
    id: 3,
    componentName: "Handle Set",
    category: "ACCESSORY",
    price: "Rp 120.000",
    isActive: false,
  },
];

const MATERIALS: MaterialItem[] = [
  {
    id: 1,
    materialName: "Oak Veneer",
    finish: "Matte",
    isActive: true,
  },
  {
    id: 2,
    materialName: "Walnut Laminate",
    finish: "Satin",
    isActive: true,
  },
  {
    id: 3,
    materialName: "White Duco",
    finish: "Glossy",
    isActive: false,
  },
];

const Preview = ({
  list,
  src,
  alt,
}: {
  list?: boolean;
  src?: string;
  alt?: string;
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const baseClass = list
    ? "bg-muted text-muted-foreground flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md text-xs"
    : "bg-muted text-muted-foreground flex aspect-4/3 items-center justify-center overflow-hidden text-xs";

  if (src && !hasError) {
    return (
      <div className={baseClass}>
        <img
          src={src}
          alt={alt ?? "Product preview"}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return <div className={baseClass}>Preview</div>;
};

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
  const perPage = 6;
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

  const { data, isLoading, isError, isFetching } = useGetProducts(userId, {
    page,
    perPage,
    sortBy: resolvedSortBy,
    orderBy: resolvedOrderBy,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    minPrice: minPrice ?? undefined,
    maxPrice: maxPrice ?? undefined,
    search: debouncedSearch || undefined,
  });

  const baseProducts: ProductBase[] = data?.data ?? [];
  const { mutateAsync: deleteProduct, isPending: isDeleting } = useDeleteProduct();
  const baseMeta = data?.meta;
  const baseTotal = baseMeta?.total ?? baseProducts.length;
  const totalItems = baseTotal + COMPONENTS.length + MATERIALS.length;

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

  return (
    <section>
      <div className="bg-muted/60 mb-8 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
              Products
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Manage product catalog, components, and materials.
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
      </div>

      <div className="bg-muted/50 min-h-screen rounded-md p-3 sm:p-4">
        <div className="mx-auto px-1 py-3 sm:px-4 sm:py-4 lg:px-2 lg:py-2">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <aside className="bg-card border-border h-fit rounded-lg border p-4 lg:sticky lg:top-4 lg:col-start-2">
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
                  <select
                    id="sort-by"
                    value={resolvedSortBy}
                    className="border-input bg-muted/40 h-9 w-full rounded-md border px-3 text-sm outline-none"
                    onChange={(event) => {
                      void setSortBy(event.target.value);
                      void setPage(1);
                    }}
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="updatedAt">Updated Date</option>
                    <option value="productName">Product Name</option>
                    <option value="sku">SKU</option>
                    <option value="basePrice">Base Price</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sort-order">Sort order</Label>
                  <select
                    id="sort-order"
                    value={resolvedOrderBy}
                    className="border-input bg-muted/40 h-9 w-full rounded-md border px-3 text-sm outline-none"
                    onChange={(event) => {
                      void setOrderBy(event.target.value);
                      void setPage(1);
                    }}
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="text-muted-foreground h-4 w-4" />
                    <p className="text-sm font-medium">Date range</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="date-from">From</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={dateFrom}
                      onChange={(event) => {
                        void setDateFrom(event.target.value);
                        void setPage(1);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="date-to">To</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={dateTo}
                      onChange={(event) => {
                        void setDateTo(event.target.value);
                        void setPage(1);
                      }}
                    />
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
                <p className="text-muted-foreground text-sm">
                  {totalItems} items
                </p>
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

              <Tabs defaultValue="base-products" className="w-full">
                <TabsList className="mb-4 grid w-full grid-cols-3 sm:mb-6">
                  <TabsTrigger value="base-products">
                    Base ({baseTotal})
                  </TabsTrigger>
                  <TabsTrigger value="components">
                    Components ({COMPONENTS.length})
                  </TabsTrigger>
                  <TabsTrigger value="materials">
                    Materials ({MATERIALS.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="base-products">
                  {isLoading ? (
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                          : "space-y-4"
                      }
                    >
                      {Array.from({ length: perPage }).map((_, index) => (
                        <BaseProductCardSkeleton
                          key={index}
                          viewMode={viewMode}
                        />
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
                          ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
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
                        {Math.max(
                          1,
                          Math.ceil(baseMeta.total / baseMeta.perPage),
                        )}
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
                </TabsContent>

                <TabsContent value="components">
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                        : "space-y-4"
                    }
                  >
                    {COMPONENTS.map((item) =>
                      viewMode === "grid" ? (
                        <div
                          key={item.id}
                          className="bg-card overflow-hidden rounded-lg border shadow-sm"
                        >
                          <Preview />
                          <div className="p-4">
                            <div className="mb-1 flex items-center gap-2">
                              <Layers className="text-muted-foreground h-4 w-4" />
                              <p className="text-foreground truncate text-sm font-semibold sm:text-base">
                                {item.componentName}
                              </p>
                            </div>
                            <p className="text-muted-foreground text-xs sm:text-sm">
                              Category: {item.category}
                            </p>
                            <p className="text-muted-foreground text-xs sm:text-sm">
                              Price: {item.price}
                            </p>
                            <div className="mt-3">
                              <Badge
                                variant={
                                  item.isActive ? "default" : "secondary"
                                }
                              >
                                {item.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={item.id}
                          className="bg-card rounded-lg border p-4 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <Preview list />
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <Layers className="text-muted-foreground h-4 w-4" />
                                <p className="text-foreground truncate text-sm font-semibold sm:text-base">
                                  {item.componentName}
                                </p>
                              </div>
                              <p className="text-muted-foreground text-xs sm:text-sm">
                                Category: {item.category}
                              </p>
                              <p className="text-muted-foreground text-xs sm:text-sm">
                                Price: {item.price}
                              </p>
                            </div>
                            <Badge
                              variant={item.isActive ? "default" : "secondary"}
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="materials">
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                        : "space-y-4"
                    }
                  >
                    {MATERIALS.map((item) =>
                      viewMode === "grid" ? (
                        <div
                          key={item.id}
                          className="bg-card overflow-hidden rounded-lg border shadow-sm"
                        >
                          <Preview />
                          <div className="p-4">
                            <div className="mb-1 flex items-center gap-2">
                              <Palette className="text-muted-foreground h-4 w-4" />
                              <p className="text-foreground truncate text-sm font-semibold sm:text-base">
                                {item.materialName}
                              </p>
                            </div>
                            <p className="text-muted-foreground text-xs sm:text-sm">
                              Finish: {item.finish}
                            </p>
                            <div className="mt-3">
                              <Badge
                                variant={
                                  item.isActive ? "default" : "secondary"
                                }
                              >
                                {item.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={item.id}
                          className="bg-card rounded-lg border p-4 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <Preview list />
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <Palette className="text-muted-foreground h-4 w-4" />
                                <p className="text-foreground truncate text-sm font-semibold sm:text-base">
                                  {item.materialName}
                                </p>
                              </div>
                              <p className="text-muted-foreground text-xs sm:text-sm">
                                Finish: {item.finish}
                              </p>
                            </div>
                            <Badge
                              variant={item.isActive ? "default" : "secondary"}
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </TabsContent>
              </Tabs>
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
