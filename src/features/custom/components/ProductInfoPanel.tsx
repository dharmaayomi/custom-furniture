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
  const { selectedFurniture, mainModel, additionalModels } = present;

  if (!isOpen) return null;

  // Determine which model is selected
  let selectedModelName = "";
  let isMainModelSelected = false;

  if (selectedFurniture) {
    // First, try to extract model name from selectedFurniture (handles unique IDs)
    const extractedFromSelected = extractModelNameFromId(selectedFurniture);

    // Check if it's the main model by comparing extracted names
    if (extractedFromSelected === mainModel) {
      selectedModelName = mainModel;
      isMainModelSelected = true;
    } else {
      // Find the model from additionalModels
      const found = additionalModels.find(
        (id) => id === selectedFurniture || id.includes(selectedFurniture),
      );
      if (found) {
        selectedModelName = extractModelNameFromId(found);
      }
    }
  } else if (mainModel) {
    // If nothing is selected, default to main model
    selectedModelName = mainModel;
    isMainModelSelected = true;
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
        className={`fixed top-0 right-0 z-52 h-full w-80 overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between p-6">
          <h2 className="text-xl font-bold">Product Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 px-6 pb-6">
          {/* Product Image */}
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
            {/* Placeholder for product image */}
            <div className="flex h-full items-center justify-center">
              <span className="text-gray-400">Product Image</span>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{name}</h3>
          </div>

          {/* Product Description */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-gray-700">
              Description
            </h4>
            <p className="text-sm leading-relaxed text-gray-600">
              {description}
            </p>
          </div>

          {/* Product Price */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Price:</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(price)}
              </span>
            </div>
          </div>

          {/* Product Code */}
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Product Code</p>
            <p className="mt-1 font-mono text-sm text-gray-700">
              {selectedModelName}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
