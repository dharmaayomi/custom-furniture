"use client";

import { Button } from "@/components/ui/button";
import {
  formatPrice,
  extractModelNameFromId,
} from "@/lib/price";
import { Product, ProductBase, ProductComponent } from "@/types/product";
import { X } from "lucide-react";

interface ListProductPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mainModels: string[];
  addOnModels: string[];
  productsFromDb: ProductBase[];
  componentsFromDb: ProductComponent[];
}

export const ListProductPanel = ({
  isOpen,
  onClose,
  mainModels,
  addOnModels,
  productsFromDb,
  componentsFromDb,
}: ListProductPanelProps) => {
  const products: (Product & { image?: string })[] = [];

  const allModels = [...mainModels, ...addOnModels];
  const productMap = new Map(productsFromDb.map((product) => [product.id, product]));
  const componentMap = new Map(
    componentsFromDb.map((component) => [component.id, component]),
  );

  // Count models with their quantities
  const modelCounts: Record<string, number> = {};
  allModels.forEach((model) => {
    const modelName = extractModelNameFromId(model);
    modelCounts[modelName] = (modelCounts[modelName] || 0) + 1;
  });

  Object.entries(modelCounts).forEach(([modelId, quantity]) => {
    const dbProduct = productMap.get(modelId);
    if (dbProduct) {
      products.push({
        id: dbProduct.id,
        name: dbProduct.productName,
        description: dbProduct.description,
        price: dbProduct.basePrice,
        quantity,
        image: dbProduct.images?.[0],
      });
      return;
    }

    const dbComponent = componentMap.get(modelId);
    if (dbComponent) {
      products.push({
        id: dbComponent.id,
        name: dbComponent.componentName,
        description: dbComponent.componentDesc,
        price: dbComponent.price,
        quantity,
        image: dbComponent.componentImageUrls?.[0],
      });
    }
  });

  const itemCount = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalPrice = products.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0,
  );

  return (
    <div
      className={`bg-background text-foreground fixed top-0 right-0 z-60 h-full w-[85vw] max-w-88 shadow-md sm:w-80 sm:max-w-none ${
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
                  <div className="bg-muted mb-3 aspect-square w-full overflow-hidden rounded-lg">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>

                  {/* Product Info */}
                  <h3 className="text-foreground text-sm font-semibold">
                    {product.name}
                  </h3>
                  <p className="text-muted-foreground mb-2 text-xs">
                    {product.description}
                  </p>

                  {/* Price and Quantity */}
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-foreground text-sm font-semibold">
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
                    <span className="text-foreground font-semibold">
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
              <p className="text-foreground font-semibold">
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
