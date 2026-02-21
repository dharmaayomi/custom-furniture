"use client";

import { X } from "lucide-react";
import {
  formatPrice,
  extractModelNameFromId,
} from "@/lib/price";
import { useRoomStore } from "@/store/useRoomStore";
import { ProductBase } from "@/types/product";
import { ProductComponent } from "@/types/componentProduct";
import useGetProductById from "@/hooks/api/product/useGetProductById";
import useGetComponentById from "@/hooks/api/product/useGetComponentById";

interface ProductInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  productsFromDb: ProductBase[];
  componentsFromDb: ProductComponent[];
}

export const ProductInfoPanel = ({
  isOpen,
  onClose,
  productsFromDb,
  componentsFromDb,
}: ProductInfoPanelProps) => {
  const { present } = useRoomStore();
  const { selectedFurniture, mainModels, addOnModels } = present;

  let selectedModelName = "";
  let selectedSource: "product" | "component" | null = null;

  if (selectedFurniture) {
    const mainMatch = mainModels.find(
      (id) => id === selectedFurniture || id.includes(selectedFurniture),
    );
    if (mainMatch) {
      selectedModelName = extractModelNameFromId(mainMatch);
      selectedSource = "product";
    } else {
      const addOnMatch = addOnModels.find(
        (id) => id === selectedFurniture || id.includes(selectedFurniture),
      );
      if (addOnMatch) {
        selectedModelName = extractModelNameFromId(addOnMatch);
        selectedSource = "component";
      }
    }
  } else if (mainModels.length > 0) {
    // If nothing is selected, default to first main model
    selectedModelName = extractModelNameFromId(mainModels[0]);
    selectedSource = "product";
  }

  const selectedProductId =
    selectedSource === "product" &&
    productsFromDb.some((item) => item.id === selectedModelName)
      ? selectedModelName
      : undefined;
  const selectedComponentId =
    selectedSource === "component" &&
    componentsFromDb.some((item) => item.id === selectedModelName)
      ? selectedModelName
      : undefined;

  const { data: selectedProduct } = useGetProductById(selectedProductId);
  const { data: selectedComponent } = useGetComponentById(selectedComponentId);

  const product =
    selectedProduct ||
    productsFromDb.find((item) => item.id === selectedModelName);
  const component =
    selectedComponent ||
    componentsFromDb.find((item) => item.id === selectedModelName);

  if (!isOpen) return null;
  if (!selectedModelName) return null;
  if (!product && !component) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-51 bg-black transition-opacity duration-300 ${
          isOpen ? "opacity-30" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`bg-background text-foreground border-border fixed top-0 right-0 z-52 h-full w-80 overflow-y-auto border-l shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between p-6">
          <h2 className="text-xl font-bold">
            {component ? "Component Details" : "Product Details"}
          </h2>
          <button onClick={onClose} className="hover:bg-muted rounded-lg p-1">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 px-6 pb-6">
          {/* Preview Image */}
          <div className="bg-muted aspect-square w-full overflow-hidden rounded-lg">
            {(product?.images?.[0] || component?.componentImageUrls?.[0]) ? (
              <img
                src={product?.images?.[0] || component?.componentImageUrls?.[0]}
                alt={product?.productName || component?.componentName || "Item"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-muted-foreground">Product Image</span>
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <h3 className="text-foreground text-2xl font-bold">
              {product?.productName || component?.componentName}
            </h3>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-foreground mb-2 text-sm font-semibold">
              Description
            </h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {product?.description || component?.componentDesc}
            </p>
          </div>

          {/* Price */}
          <div className="border-border border-t pt-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Price:</span>
              <span className="text-foreground text-2xl font-bold">
                {formatPrice(product?.basePrice ?? component?.price ?? 0)}
              </span>
            </div>
          </div>

          {/* Identifier */}
          <div className="bg-muted rounded-lg p-4">
            <p className="text-muted-foreground text-xs">
              {component ? "Component ID" : "Product Code"}
            </p>
            <p className="text-foreground mt-1 font-mono text-sm">
              {product?.sku || component?.id}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
