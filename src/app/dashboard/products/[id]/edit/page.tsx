import { EditProductPage } from "@/features/dashboard/products/edit";

const EditProduct = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  return (
    <div>
      <EditProductPage productId={id} />
    </div>
  );
};

export default EditProduct;
