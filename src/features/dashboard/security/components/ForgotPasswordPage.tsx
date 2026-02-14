"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import useForgotPassword from "@/hooks/api/auth/useForgotPassword";
import { getApiErrorMessage } from "@/lib/api-error";
import { useState } from "react";
import { toast } from "sonner";

export const ForgotPasswordSection = () => {
  const [resetEmail, setResetEmail] = useState("");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const { mutateAsync: forgotPassword, isPending: isSendingResetEmail } =
    useForgotPassword({
      onSuccess: (result) => {
        toast.success(
          result?.message ?? "Reset password link has been sent to your email",
        );
      },
      onError: (error) => {
        toast.error(
          getApiErrorMessage(error, "Failed to send reset password email."),
        );
      },
    });

  const handleSendResetEmail = async () => {
    if (!resetEmail.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    await forgotPassword({ email: resetEmail.trim() });
    setIsForgotPasswordOpen(false);
    setResetEmail("");
  };

  const handleCloseForgotPasswordDialog = () => {
    if (isSendingResetEmail) return;
    setIsForgotPasswordOpen(false);
    setResetEmail("");
  };

  return (
    <>
      <h3 className="mb-4 text-sm font-semibold">Forgot Password</h3>
      <p className="text-muted-foreground text-sm">
        Request a password reset email if you can&apos;t remember your current
        password.
      </p>
      <div className="mt-6">
        <Button
          variant="outline"
          className="w-full"
          disabled={isSendingResetEmail}
          onClick={() => setIsForgotPasswordOpen(true)}
        >
          Send Reset Password Email
        </Button>
      </div>

      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forgot password</DialogTitle>
            <DialogDescription>
              Enter your account email and we&apos;ll send a reset link.
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              placeholder="you@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
          </Field>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseForgotPasswordDialog}
              disabled={isSendingResetEmail}
            >
              Cancel
            </Button>
            <Button onClick={handleSendResetEmail} disabled={isSendingResetEmail}>
              {isSendingResetEmail ? "Sending..." : "Send Reset Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
