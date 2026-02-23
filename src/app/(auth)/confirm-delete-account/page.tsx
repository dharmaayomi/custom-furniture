import { ConfirmDeleteAccountPage } from "@/features/confirm-delete-account";
import { redirect } from "next/navigation";

type ConfirmDeleteAccountRouteProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

const ConfirmDeleteAccount = async ({
  searchParams,
}: ConfirmDeleteAccountRouteProps) => {
  const params = await searchParams;
  const token = params?.token;

  if (!token) redirect("/login");

  return (
    <div>
      <ConfirmDeleteAccountPage token={token} />
    </div>
  );
};

export default ConfirmDeleteAccount;
