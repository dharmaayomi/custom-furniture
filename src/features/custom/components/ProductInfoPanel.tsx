"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  formatPrice,
  getAssetPrice,
  extractModelNameFromId,
} from "@/lib/price";
import { useRoomStore } from "@/store/useRoomStore";

interface ProductInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const getProductName = (
  modelName: string,
): { name: string; description: string } => {
  const productNames: Record<string, { name: string; description: string }> = {
    "wine_cabinet.glb": {
      name: "Wine Cabinet",
      description:
        "Premium wine storage unit with elegant design and multiple shelves for wine bottles and glasses",
    },
    "BoomBox.glb": {
      name: "BoomBox",
      description: "Music player with built-in speakers and USB port",
    },
    "wooden_cupboard.glb": {
      name: "Wooden Cupboard",
      description:
        "Classic wooden storage unit perfect for any room with spacious compartments",
    },

    "lemaritest.glb": {
      name: "TEST BENER",
      description: "Test cabinet item",
    },

    "cabinet-2.glb": {
      name: "Clean Cabinet",
      description: "Minimalist modern storage cabinet with refined details",
    },

    "cabinet.glb": {
      name: "Storage Cabinet",
      description: "Functional storage solution for any space",
    },

    "wall_cupboard.glb": {
      name: "Wall Cupboard",
      description: "Wall-mounted storage unit perfect for saving floor space",
    },
  };

  return productNames[modelName] || { name: "Item", description: "Product" };
};

export const ProductInfoPanel = ({
  isOpen,
  onClose,
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

  const { name, description } = getProductName(selectedModelName);
  const price = getAssetPrice(selectedModelName);

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
            {/* Placeholder for product image */}
            <div className="flex h-full items-center justify-center">
              <span className="text-muted-foreground">Product Image</span>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <h3 className="text-foreground text-2xl font-bold">{name}</h3>
          </div>

          {/* Product Description */}
          <div>
            <h4 className="text-foreground mb-2 text-sm font-semibold">
              Description
            </h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {/* Product Price */}
          <div className="border-border border-t pt-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Price:</span>
              <span className="text-foreground text-2xl font-bold">
                {formatPrice(price)}
              </span>
            </div>
          </div>

          {/* Product Code */}
          <div className="bg-muted rounded-lg p-4">
            <p className="text-muted-foreground text-xs">Product Code</p>
            <p className="text-foreground mt-1 font-mono text-sm">
              {selectedModelName}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
