"use client";

import { Button } from "@/components/ui/button";
import { formatPrice, getAssetPrice } from "@/lib/price";
import { Product } from "@/types/product";
import { X } from "lucide-react";

interface ListProductPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mainModel: string;
  additionalModels: string[];
  totalPrice: number;
}

const getProductName = (
  modelName: string,
): { name: string; description: string } => {
  const productNames: Record<string, { name: string; description: string }> = {
    "wine_cabinet.glb": {
      name: "Wine Cabinet",
      description: "Premium wine storage unit",
    },
    "cabinet-1.glb": {
      name: "Cabinet",
      description: "Modern storage cabinet",
    },
    "cabinet.glb": {
      name: "Storage Cabinet",
      description: "Functional storage solution",
    },
    "chair-1.glb": {
      name: "Chair",
      description: "Elegant dining chair",
    },
    "wall_cupboard.glb": {
      name: "Wall Cupboard",
      description: "Wall-mounted storage",
    },
    "man.glb": {
      name: "Decoration",
      description: "Decorative element",
    },
  };

  return productNames[modelName] || { name: "Item", description: "Product" };
};

export const ListProductPanel = ({
  isOpen,
  onClose,
  mainModel,
  additionalModels,
  totalPrice,
}: ListProductPanelProps) => {
  const products: Product[] = [];
  if (mainModel) {
    const { name, description } = getProductName(mainModel);
    products.push({
      id: mainModel,
      name,
      description,
      price: getAssetPrice(mainModel),
      quantity: 1,
    });
  }

  // Add additional models with their quantities
  const modelCounts: Record<string, number> = {};
  additionalModels.forEach((model) => {
    modelCounts[model] = (modelCounts[model] || 0) + 1;
  });

  Object.entries(modelCounts).forEach(([model, quantity]) => {
    const { name, description } = getProductName(model);
    products.push({
      id: model,
      name,
      description,
      price: getAssetPrice(model),
      quantity,
    });
  });

  const itemCount = products.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div
      className={`fixed top-0 right-0 z-51 h-full w-80 bg-white ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Your products</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-4">
          {products.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-center text-sm">
                No products added yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product, index) => (
                <div
                  key={index}
                  className="border-border border-b pb-4 last:border-b-0"
                >
                  {/* Product Image Placeholder */}
                  <div className="bg-muted mb-3 aspect-square w-full rounded-lg" />

                  {/* Product Info */}
                  <h3 className="text-sm font-semibold text-black">
                    {product.name}
                  </h3>
                  <p className="text-muted-foreground mb-2 text-xs">
                    {product.description}
                  </p>

                  {/* Price and Quantity */}
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-black">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {product.quantity}x
                    </span>
                  </div>

                  {/* Total for this product */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      Subtotal
                    </span>
                    <span className="font-semibold text-black">
                      {formatPrice(product.price * product.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="border-border space-y-3 border-t p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Total</span>
            <div className="text-right">
              <p className="font-semibold text-black">
                {formatPrice(totalPrice)}
              </p>
              <p className="text-muted-foreground text-xs">{itemCount} items</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
