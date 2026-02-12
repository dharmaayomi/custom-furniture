import AddressEditForm from "@/features/dashboard/address/components/AddressEditForm";

const AddressEditPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const addressId = Number(id);

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <AddressEditForm addressId={addressId} />
    </div>
  );
};

export default AddressEditPage;
