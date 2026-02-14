"use client";

import { ChangePasswordSection } from "./components/ChangePassword";
import { ForgotPasswordSection } from "./components/ForgotPasswordPage";
import { ReqDeleteAccountSection } from "./components/ReqDeleteAccountSection";

export const SecurityPage = () => {
  return (
    <section>
      <div className="bg-muted/60 mb-8 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
          Security
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Update your password and manage sensitive account settings.
        </p>
      </div>

      <div className="from-muted/60 to-background rounded-lg bg-linear-to-b px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="bg-card rounded-lg border shadow-sm">
            <ChangePasswordSection />
          </div>

          <div className="bg-card rounded-lg border shadow-sm">
            <div className="px-6 py-8">
              <ForgotPasswordSection />
              <div className="my-8 border-t" />
              <ReqDeleteAccountSection />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
