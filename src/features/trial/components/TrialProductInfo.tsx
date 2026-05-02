import Image from "next/image";
import { Box, Package2, Ruler, Weight, X } from "lucide-react";

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
} from "../core/trialAssetCatalog";
import { LoadedModel } from "../store/useTrialRoomStore";

interface TrialProductInfoProps {
  open: boolean;
  selectedModel: LoadedModel | null;
  onOpenChange: (open: boolean) => void;
}

const resolveTrialProductInfo = (selectedModel: LoadedModel | null) => {
  if (!selectedModel) {
    return null;
  }

  if (selectedModel.category === "frame") {
    const product = getTrialProductBaseById(selectedModel.assetId);
    if (!product) {
      return null;
    }

    return {
      badge: "Frame Lemari",
      code: product.sku,
      description: product.description,
      dimensions: `${product.width} x ${product.depth} x ${product.height} cm`,
      image: product.images[0] ?? "/assets/trial/frames.webp",
      name: product.productName,
      price: product.basePrice,
      weight: `${product.weight} kg`,
    };
  }

  if (selectedModel.category === "interior") {
    const component = getTrialProductComponentById(selectedModel.assetId);
    if (!component) {
      return null;
    }

    return {
      badge: component.componentCategory ?? "Interior",
      code: component.componentSku ?? component.id,
      description: component.componentDesc,
      dimensions: component.componentCategory ?? "Interior module",
      image: component.componentImageUrls[0] ?? "/assets/trial/interior.webp",
      name: component.componentName,
      price: component.price,
      weight: `${component.weight} kg`,
    };
  }

  const material = getTrialProductMaterialById(selectedModel.assetId);
  if (!material) {
    return null;
  }

  return {
    badge: "Material",
    code: material.materialSku ?? material.id,
    description: material.materialDesc,
    dimensions: material.materialCategories.join(", "),
    image: material.materialUrl,
    name: material.materialName,
    price: material.price ?? 0,
    weight: "N/A",
  };
};

export const TrialProductInfo = ({
  open,
  selectedModel,
  onOpenChange,
}: TrialProductInfoProps) => {
  const isMobile = useIsMobile();
  const productInfo = resolveTrialProductInfo(selectedModel);

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
                  Selected Product
                </p>
                <DrawerTitle className="text-xl font-black">
                  {productInfo?.name ?? "No product selected"}
                </DrawerTitle>
              </div>

              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-2xl border-white/50 bg-white/70 shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  aria-label="Close product info"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5">
            {productInfo ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/65 p-3 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-white/5">
                  <div className="relative aspect-4/3 overflow-hidden rounded-4xl">
                    <Image
                      src={productInfo.image}
                      alt={productInfo.name}
                      fill
                      sizes="(max-width: 768px) 88vw, 380px"
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/60 bg-white/65 p-4 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] md:p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-3 inline-flex rounded-full border border-white/60 bg-white/75 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-slate-600 uppercase dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                    {productInfo.badge}
                  </div>
                  <p className="text-2xl font-black">{productInfo.name}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {productInfo.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-[1.5rem] border border-white/60 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                      <Package2 className="h-4 w-4" />
                      Product Code
                    </div>
                    <p className="font-mono text-sm">{productInfo.code}</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/60 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                      <Ruler className="h-4 w-4" />
                      Size / Type
                    </div>
                    <p className="text-sm">{productInfo.dimensions}</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/60 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                      <Weight className="h-4 w-4" />
                      Weight
                    </div>
                    <p className="text-sm">{productInfo.weight}</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/60 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
                      <Box className="h-4 w-4" />
                      Price
                    </div>
                    <p className="text-2xl font-black">
                      {formatPrice(productInfo.price)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-56 items-center justify-center rounded-2xl border border-dashed border-white/60 bg-white/50 px-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                Select a frame or interior item to inspect its details.
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
