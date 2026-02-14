import { EmailVerificationPage } from "@/features/register/email-verification";
type EmailVerificationPageRouteProps = {
  searchParams?: Promise<{
    email?: string;
  }>;
};

const EmailVerification = async ({
  searchParams,
}: EmailVerificationPageRouteProps) => {
  const params = await searchParams;
  const email = params?.email;

  return (
    <div>
      <EmailVerificationPage email={email} />
    </div>
  );
};

export default EmailVerification;
