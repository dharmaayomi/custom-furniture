"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import useResetPassword from "@/hooks/api/auth/useResetPassword";
import { getApiErrorMessage } from "@/lib/api-error";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ResetPasswordPageProps = {
  token: string;
};

export const ResetPasswordPage = ({ token }: ResetPasswordPageProps) => {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutateAsync: resetPassword, isPending: isResettingPassword } =
    useResetPassword(token, {
      onSuccess: (result) => {
        toast.success(result?.message ?? "Password reset successfully");
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Failed to reset password."));
      },
    });

  const isMismatch = useMemo(() => {
    if (!confirmPassword) return false;
    return newPassword !== confirmPassword;
  }, [newPassword, confirmPassword]);

  const handleSubmit = async () => {
    if (!token) {
      toast.error("Invalid reset password token.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill all fields.");
      return;
    }
    if (isMismatch) {
      toast.error("Password confirmation does not match.");
      return;
    }

    await resetPassword({ newPassword });
    router.push("/login");
  };

  return (
    <section className="bg-background relative min-h-screen w-full overflow-hidden">
      <div className="dot-background absolute inset-0 opacity-50 dark:opacity-55" />
      <div className="bg-background pointer-events-none absolute inset-0 flex items-center justify-center mask-[radial-gradient(ellipse_at_center,transparent_30%,black)]" />

      <div className="relative z-20 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xl">
          <Card className="bg-card p-6 shadow-lg">
            <h1 className="text-xl font-semibold">Reset Password</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Enter your new password and confirm it.
            </p>

            <Field className="mt-6">
              <FieldLabel>New Password</FieldLabel>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute top-1/2 right-2 h-7 w-7 -translate-y-1/2"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Field>

            <Field className="mt-4">
              <FieldLabel>Confirm Password</FieldLabel>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute top-1/2 right-2 h-7 w-7 -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {isMismatch ? (
                <p className="text-destructive mt-2 text-xs">
                  Password confirmation does not match.
                </p>
              ) : null}
            </Field>

            <Button
              className="mt-6 w-full"
              disabled={
                !newPassword ||
                !confirmPassword ||
                isMismatch ||
                isResettingPassword
              }
              onClick={handleSubmit}
            >
              {isResettingPassword ? "Updating..." : "Update Password"}
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
};
