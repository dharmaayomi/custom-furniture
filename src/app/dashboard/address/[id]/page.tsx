import { redirect } from "next/navigation";

const AddressEditPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  redirect(`/dashboard/address/${id}/edit`);
};

export default AddressEditPage;
