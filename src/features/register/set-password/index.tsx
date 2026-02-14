"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import useSetPasswordAfterVerif from "@/hooks/api/auth/useSetPasswordAfterVerif";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

type SetPasswordPageProps = {
  token: string;
};

export const SetPasswordPage = ({ token }: SetPasswordPageProps) => {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutateAsync: setPassword, isPending } = useSetPasswordAfterVerif(
    token,
    {
      onSuccess: () => {
        toast.success("Password set successfully. You can now log in.");
      },
      onError: (error) => {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Failed to set password.";
        toast.error(message);
      },
    },
  );

  const isMismatch = useMemo(() => {
    if (!confirmPassword) return false;
    return newPassword !== confirmPassword;
  }, [newPassword, confirmPassword]);
  const isStrongPassword = useMemo(() => {
    return (
      newPassword.length >= 8 &&
      /[a-z]/.test(newPassword) &&
      /[A-Z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?`~]/.test(newPassword)
    );
  }, [newPassword]);

  const handleSubmit = async () => {
    if (!token) {
      toast.error("Invalid verification token.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill all fields.");
      return;
    }
    if (!isStrongPassword) {
      toast.error(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      );
      return;
    }
    if (isMismatch) {
      toast.error("Password confirmation does not match.");
      return;
    }

    await setPassword({ password: newPassword });
    router.push("/login");
  };

  return (
    <div className="bg-background relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      <div className="dot-background absolute inset-0 opacity-50 dark:opacity-55" />

      <div className="bg-background pointer-events-none absolute inset-0 flex items-center justify-center mask-[radial-gradient(ellipse_at_center,transparent_30%,black)]" />

      <div className="relative z-20 w-full max-w-xl px-4">
        <Card className="bg-card w-full rounded-lg px-8 py-10 shadow-lg">
          <div className="mb-6 flex justify-center">
            <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
              <LockKeyhole className="text-primary h-8 w-8" />
            </div>
          </div>

          <h1 className="text-foreground text-center text-2xl font-semibold">
            Email verified — one last step to activate your account
          </h1>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            Create a password to complete your account setup.
          </p>

          <Field className="mt-8">
            <FieldLabel>New Password</FieldLabel>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {!isStrongPassword && newPassword ? (
              <p className="text-destructive mt-2 text-xs">
                Use at least 8 characters with uppercase, lowercase, number,
                and special character.
              </p>
            ) : null}
          </Field>

          <Field className="mt-4">
            <FieldLabel>Confirm Password</FieldLabel>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2"
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
            onClick={handleSubmit}
            disabled={
              !newPassword ||
              !confirmPassword ||
              !isStrongPassword ||
              isMismatch ||
              isPending
            }
          >
            {isPending ? "Setting..." : "Set password"}
          </Button>
        </Card>
      </div>
    </div>
  );
};


