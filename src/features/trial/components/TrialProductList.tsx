import Image from "next/image";
import { Package2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/useMobile";
import { formatPrice } from "@/lib/price";

import {
  getTrialProductBaseById,
  getTrialProductComponentById,
  getTrialProductMaterialById,
} from "../core/AssetCatalog";
import { LoadedModel, useTrialRoomStore } from "../store/useTrialRoomStore";

interface TrialProductListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProduct?: (instanceId: string) => void;
}

interface TrialResolvedProductListItem {
  assetId: string;
  category: LoadedModel["category"];
  code: string;
  description: string;
  image: string;
  instanceIds: string[];
  name: string;
  price: number;
  quantity: number;
}

const resolveProductListEntry = (
  category: LoadedModel["category"],
  assetId: string,
): Omit<TrialResolvedProductListItem, "instanceIds" | "quantity"> | null => {
  if (category === "frame") {
    const product = getTrialProductBaseById(assetId);
    if (!product) {
      return null;
    }

    return {
      assetId,
      category,
      code: product.sku,
      description: product.description,
      image: product.images[0] ?? "/assets/trial/frames.webp",
      name: product.productName,
      price: product.basePrice,
    };
  }

  if (category === "component") {
    const component = getTrialProductComponentById(assetId);
    if (!component) {
      return null;
    }

    return {
      assetId,
      category,
      code: component.componentSku ?? component.id,
      description: component.componentDesc,
      image: component.componentImageUrls[0] ?? "/assets/trial/component.webp",
      name: component.componentName,
      price: component.price,
    };
  }

  const material = getTrialProductMaterialById(assetId);
  if (!material) {
    return null;
  }

  return {
    assetId,
    category,
    code: material.materialSku ?? material.id,
    description: material.materialDesc,
    image: material.materialUrl,
    name: material.materialName,
    price: material.price ?? 0,
  };
};

export const TrialProductList = ({
  open,
  onOpenChange,
  onSelectProduct,
}: TrialProductListProps) => {
  const isMobile = useIsMobile();
  const loadedModels = useTrialRoomStore((state) => state.loadedModels);
  const setSelectedMesh = useTrialRoomStore((state) => state.setSelectedMesh);

  const groupedProducts = loadedModels.reduce<TrialResolvedProductListItem[]>(
    (items, model) => {
      const existing = items.find(
        (item) =>
          item.assetId === model.assetId && item.category === model.category,
      );

      if (existing) {
        existing.instanceIds.push(model.instanceId);
        existing.quantity += 1;
        return items;
      }

      const resolved = resolveProductListEntry(model.category, model.assetId);
      if (!resolved) {
        return items;
      }

      items.push({
        ...resolved,
        instanceIds: [model.instanceId],
        quantity: 1,
      });
      return items;
    },
    [],
  );

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction={isMobile ? "bottom" : "right"}
      handleOnly
    >
      <DrawerContent
        className={`border-white/60 bg-white/80 text-slate-950 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950 dark:text-slate-50 ${
          isMobile
            ? "max-h-[82vh] rounded-t-[1.75rem] border-t shadow-[0_-20px_60px_-30px_rgba(15,23,42,0.45)]"
            : "w-125! rounded-l-xl border-l shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] sm:max-w-md! md:max-w-105!"
        }`}
      >
        <div className="bg-primary/10 pointer-events-none absolute top-8 right-8 h-28 w-28 rounded-full blur-3xl" />
        <div className="bg-primary/10 pointer-events-none absolute bottom-12 left-6 h-24 w-24 rounded-full blur-3xl" />

        <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
          <DrawerHeader className="border-b border-white/60 px-4 pt-3 pb-4 md:px-7 md:pt-7 dark:border-white/10">
            <div className="flex items-start justify-between gap-3 text-left">
              <div className="space-y-2">
                <p className="text-xs font-medium tracking-[0.22em] text-slate-500 uppercase dark:text-slate-400">
                  Trial Summary
                </p>
                <DrawerTitle className="text-xl font-black">
                  Your Products
                </DrawerTitle>
              </div>

              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-2xl border-white/50 bg-white/70 shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  aria-label="Close product list"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5">
            {groupedProducts.length > 0 ? (
              <div className="space-y-4">
                {groupedProducts.map((product) => {
                  const primaryInstanceId = product.instanceIds[0];

                  return (
                    <button
                      key={`${product.category}-${product.assetId}`}
                      type="button"
                      onClick={() => {
                        if (onSelectProduct) {
                          onSelectProduct(primaryInstanceId);
                          return;
                        }

                        setSelectedMesh(primaryInstanceId);
                      }}
                      className="block w-full overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/65 p-3 text-left shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] transition hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-4xl sm:h-24 sm:w-24">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, 96px"
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="inline-flex rounded-full border border-white/60 bg-white/75 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-600 uppercase dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                                {product.category}
                              </div>
                              <p className="mt-2 truncate text-base font-black">
                                {product.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">
                                {formatPrice(product.price)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {product.quantity}x
                              </p>
                            </div>
                          </div>

                          <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600 dark:text-slate-300">
                            {product.description}
                          </p>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                              <Package2 className="h-3.5 w-3.5" />
                              {product.code}
                            </div>
                            <p className="text-sm font-black">
                              {formatPrice(product.price * product.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full min-h-56 items-center justify-center rounded-2xl border border-dashed border-white/60 bg-white/50 px-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                Add frames or component items to build your trial product list.
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
