"use client";

import { X } from "lucide-react";
import {
  formatPrice,
  extractModelNameFromId,
} from "@/lib/price";
import { useRoomStore } from "@/store/useRoomStore";
import { ProductBase } from "@/types/product";

interface ProductInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  productsFromDb: ProductBase[];
}

export const ProductInfoPanel = ({
  isOpen,
  onClose,
  productsFromDb,
}: ProductInfoPanelProps) => {
  const { present } = useRoomStore();
  const { selectedFurniture, mainModels, addOnModels } = present;

  if (!isOpen) return null;

  // Determine which model is selected
  let selectedModelName = "";

  if (selectedFurniture) {
    const mainMatch = mainModels.find(
      (id) => id === selectedFurniture || id.includes(selectedFurniture),
    );
    if (mainMatch) {
      selectedModelName = extractModelNameFromId(mainMatch);
    } else {
      const addOnMatch = addOnModels.find(
        (id) => id === selectedFurniture || id.includes(selectedFurniture),
      );
      if (addOnMatch) {
        selectedModelName = extractModelNameFromId(addOnMatch);
      }
    }
  } else if (mainModels.length > 0) {
    // If nothing is selected, default to first main model
    selectedModelName = extractModelNameFromId(mainModels[0]);
  }

  if (!selectedModelName) {
    return null;
  }

  const product = productsFromDb.find((item) => item.id === selectedModelName);
  if (!product) return null;

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
          <h2 className="text-xl font-bold">Product Details</h2>
          <button onClick={onClose} className="hover:bg-muted rounded-lg p-1">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 px-6 pb-6">
          {/* Product Image */}
          <div className="bg-muted aspect-square w-full overflow-hidden rounded-lg">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.productName}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-muted-foreground">Product Image</span>
              </div>
            )}
          </div>

          {/* Product Name */}
          <div>
            <h3 className="text-foreground text-2xl font-bold">
              {product.productName}
            </h3>
          </div>

          {/* Product Description */}
          <div>
            <h4 className="text-foreground mb-2 text-sm font-semibold">
              Description
            </h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Product Price */}
          <div className="border-border border-t pt-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Price:</span>
              <span className="text-foreground text-2xl font-bold">
                {formatPrice(product.basePrice)}
              </span>
            </div>
          </div>

          {/* Product Code */}
          <div className="bg-muted rounded-lg p-4">
            <p className="text-muted-foreground text-xs">Product Code</p>
            <p className="text-foreground mt-1 font-mono text-sm">
              {product.sku}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
