import { ResetPasswordPage } from "@/features/reset-password";
import { redirect } from "next/navigation";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

const ResetPassword = async ({ searchParams }: ResetPasswordPageProps) => {
  const params = await searchParams;
  const token = params?.token;

  if (!token) redirect("/login");

  return <ResetPasswordPage token={token} />;
};

export default ResetPassword;
