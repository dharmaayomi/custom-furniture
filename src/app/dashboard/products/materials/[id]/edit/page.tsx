import { EditMaterialProductPage } from "@/features/dashboard/products/material/edit";

const EditMaterialProduct = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  return (
    <div>
      <EditMaterialProductPage materialId={id} />
    </div>
  );
};

export default EditMaterialProduct;
