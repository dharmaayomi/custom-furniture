import { SetPasswordPage } from "@/features/register/set-password";
import { redirect } from "next/navigation";

type SetPasswordPageRouteProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

const SetPassword = async ({ searchParams }: SetPasswordPageRouteProps) => {
  const params = await searchParams;
  const token = params?.token;
  if (!token) redirect("/register");

  return (
    <div>
      <SetPasswordPage token={token} />
    </div>
  );
};

export default SetPassword;
