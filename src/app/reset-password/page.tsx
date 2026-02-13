"use client";

import { ResetPasswordPage } from "@/features/reset-password";
import { useRouter, useSearchParams } from "next/navigation";
import React, { use } from "react";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token: string;
  }>;
};

const ResetPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  if (!token || token === null) router.push("/login");
  return <ResetPasswordPage token={token as string} />;
};

export default ResetPassword;
