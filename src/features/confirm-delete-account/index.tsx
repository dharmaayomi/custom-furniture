"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import useConfirmDeleteAccount from "@/hooks/api/auth/useConfirmDeleteAccount";
import { getApiErrorMessage } from "@/lib/api-error";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type ConfirmDeleteAccountPageProps = {
  token: string;
};

export const ConfirmDeleteAccountPage = ({
  token,
}: ConfirmDeleteAccountPageProps) => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { mutateAsync: confirmDeleteAccount, isPending } =
    useConfirmDeleteAccount(token, {
      onSuccess: (result) => {
        toast.success(result?.message ?? "Account deleted successfully.");
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Failed to delete account."));
      },
    });

  const handleCancel = () => {
    router.push("/dashboard/security");
  };

  const handleConfirmDelete = async () => {
    if (!token) {
      toast.error("Invalid delete account token.");
      return;
    }
    if (!password.trim()) {
      toast.error("Please enter your password to confirm deletion.");
      return;
    }

    await confirmDeleteAccount({ password: password.trim() });
    router.push("/login");
  };

  return (
    <div className="bg-background relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      <div className="dot-background absolute inset-0 opacity-50 dark:opacity-55" />

      <div className="bg-background pointer-events-none absolute inset-0 flex items-center justify-center mask-[radial-gradient(ellipse_at_center,transparent_30%,black)]" />

      <div className="relative z-20 w-full max-w-xl px-4">
        <Card className="bg-card w-full rounded-lg px-8 py-10 shadow-lg">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="text-destructive h-8 w-8" />
            </div>
          </div>

          <h1 className="text-foreground text-center text-2xl font-semibold">
            Confirm account deletion
          </h1>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            You are about to permanently delete your account and all associated
            data. This action cannot be undone.
          </p>

          <Field className="mt-8">
            <FieldLabel>Enter Password to Confirm</FieldLabel>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Field>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={!password.trim() || isPending}
            >
              {isPending ? "Deleting..." : "Confirm Delete Account"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
