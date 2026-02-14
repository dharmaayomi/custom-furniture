import { MailCheck } from "lucide-react";

type EmailVerificationPageProps = {
  email?: string;
};

export const EmailVerificationPage = ({ email }: EmailVerificationPageProps) => {
  return (
    <div className="bg-background relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      <div className="dot-background absolute inset-0 opacity-50 dark:opacity-55" />

      <div className="bg-background pointer-events-none absolute inset-0 flex items-center justify-center mask-[radial-gradient(ellipse_at_center,transparent_30%,black)]" />

      <div className="relative z-20 flex flex-col items-center justify-center px-4">
        <div className="bg-card w-full max-w-xl rounded-lg px-8 py-14 shadow-lg">
          <div className="mb-6 flex justify-center">
            <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
              <MailCheck />
            </div>
          </div>

          <h1 className="text-foreground mb-3 text-center text-2xl font-bold">
            We've sent your secure verification link
          </h1>

          <p className="text-muted-foreground mb-2 text-center">
            Check your inbox and click the link to continue. If you don't see
            it, check your spam folder.
          </p>

          <p className="text-primary mb-6 text-center font-medium">
            {email ?? "your email address"}
          </p>

          <div className="flex justify-center gap-4">
            <button className="border-border hover:bg-secondary flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors">
              <span className="text-foreground text-sm font-medium">
                Resend verification email
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
