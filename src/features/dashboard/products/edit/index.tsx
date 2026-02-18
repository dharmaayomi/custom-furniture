"use client";

import { ProductEditForm } from "../components/ProductEditForm";

type EditProductPageProps = {
  productId: string;
};

export const EditProductPage = ({ productId }: EditProductPageProps) => {
  return (
    <div className="container mx-auto px-3 py-6 sm:px-4 md:py-5">
      <ProductEditForm productId={productId} />
    </div>
  );
};
