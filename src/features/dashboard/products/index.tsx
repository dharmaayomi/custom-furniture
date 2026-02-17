"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Box,
  Grid3x3,
  Layers,
  List,
  PackageSearch,
  Palette,
  Plus,
} from "lucide-react";
import { useState } from "react";

type ProductBaseItem = {
  id: number;
  productName: string;
  sku: string;
  basePrice: string;
  isActive: boolean;
  isCustomizable: boolean;
};

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

const BASE_PRODUCTS: ProductBaseItem[] = [
  {
    id: 1,
    productName: "Wardrobe 2-Door",
    sku: "PRD-WDR-2001",
    basePrice: "Rp 3.200.000",
    isActive: true,
    isCustomizable: true,
  },
  {
    id: 2,
    productName: "Kitchen Cabinet L-Set",
    sku: "PRD-KTC-1204",
    basePrice: "Rp 5.900.000",
    isActive: true,
    isCustomizable: true,
  },
  {
    id: 3,
    productName: "TV Console",
    sku: "PRD-LVG-3321",
    basePrice: "Rp 2.400.000",
    isActive: false,
    isCustomizable: false,
  },
];

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

const Preview = ({ list }: { list?: boolean }) => {
  return (
    <div
      className={
        list
          ? "bg-muted text-muted-foreground flex h-16 w-24 shrink-0 items-center justify-center rounded-md text-xs"
          : "bg-muted text-muted-foreground flex aspect-4/3 items-center justify-center text-xs"
      }
    >
      Preview
    </div>
  );
};

export const ProductsPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
          <Button className="w-full gap-2 sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="bg-muted/50 min-h-screen rounded-md p-3 sm:p-4">
        <div className="mx-auto px-1 py-3 sm:px-4 sm:py-4 lg:px-2 lg:py-2">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              {BASE_PRODUCTS.length + COMPONENTS.length + MATERIALS.length} items
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
                Base ({BASE_PRODUCTS.length})
              </TabsTrigger>
              <TabsTrigger value="components">
                Components ({COMPONENTS.length})
              </TabsTrigger>
              <TabsTrigger value="materials">
                Materials ({MATERIALS.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="base-products">
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                    : "space-y-4"
                }
              >
                {BASE_PRODUCTS.length === 0 ? (
                  <div className="border-border bg-card mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12 lg:max-w-full">
                    <PackageSearch className="text-muted-foreground/40 mb-3 h-12 w-12" />
                    <h3 className="text-foreground mb-2 text-lg font-medium">
                      No base products
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Add your first base product to get started.
                    </p>
                  </div>
                ) : (
                  BASE_PRODUCTS.map((item) =>
                    viewMode === "grid" ? (
                      <div
                        key={item.id}
                        className="bg-card overflow-hidden rounded-lg border shadow-sm"
                      >
                        <Preview />
                        <div className="p-4">
                          <div className="mb-1 flex items-center gap-2">
                            <Box className="text-muted-foreground h-4 w-4" />
                            <p className="text-foreground truncate text-sm font-semibold sm:text-base">
                              {item.productName}
                            </p>
                          </div>
                          <p className="text-muted-foreground text-xs sm:text-sm">
                            SKU: {item.sku}
                          </p>
                          <p className="text-muted-foreground text-xs sm:text-sm">
                            Base Price: {item.basePrice}
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <Badge
                              variant={item.isActive ? "default" : "secondary"}
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">
                              {item.isCustomizable ? "Customizable" : "Fixed"}
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
                          <Preview
                            list
                          />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <Box className="text-muted-foreground h-4 w-4" />
                              <p className="text-foreground truncate text-sm font-semibold sm:text-base">
                                {item.productName}
                              </p>
                            </div>
                            <p className="text-muted-foreground text-xs sm:text-sm">
                              SKU: {item.sku}
                            </p>
                            <p className="text-muted-foreground text-xs sm:text-sm">
                              Base Price: {item.basePrice}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={item.isActive ? "default" : "secondary"}
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">
                              {item.isCustomizable ? "Customizable" : "Fixed"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            </TabsContent>

            <TabsContent value="components">
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
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
                          <Badge variant={item.isActive ? "default" : "secondary"}>
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
                        <Preview
                          list
                        />
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
                        <Badge variant={item.isActive ? "default" : "secondary"}>
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
                    ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
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
                          <Badge variant={item.isActive ? "default" : "secondary"}>
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
                        <Preview
                          list
                        />
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
                        <Badge variant={item.isActive ? "default" : "secondary"}>
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
    </section>
  );
};
