import { EditComponentPage } from "@/features/dashboard/products/component/edit";

const EditComponent = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  return (
    <div>
      <EditComponentPage componentId={id} />
    </div>
  );
};

export default EditComponent;
