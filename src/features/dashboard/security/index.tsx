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
import { Eye, EyeOff, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const INITIAL_FORM: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export const SecurityPage = () => {
  const [form, setForm] = useState<PasswordForm>(INITIAL_FORM);
  const [resetEmail, setResetEmail] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const hasChanges = useMemo(() => {
    return (
      form.currentPassword.length > 0 ||
      form.newPassword.length > 0 ||
      form.confirmPassword.length > 0
    );
  }, [form]);

  const isConfirmMismatch = useMemo(() => {
    if (!form.confirmPassword) return false;
    return form.newPassword !== form.confirmPassword;
  }, [form.newPassword, form.confirmPassword]);

  const handleResetFields = () => {
    setForm(INITIAL_FORM);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    toast("Password fields reset");
  };

  const handleSavePassword = () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error("Please fill all password fields.");
      return;
    }
    if (isConfirmMismatch) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    // Hardcoded for now (no API call yet).
    toast.success("Password updated (mock)");
    handleResetFields();
  };

  const handleSendResetEmail = () => {
    if (!resetEmail.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    // Hardcoded for now (no API call yet).
    toast.success("Password reset link sent (mock)");
    setIsForgotPasswordOpen(false);
    setResetEmail("");
  };

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
            <div className="px-6 py-8">
              <h3 className="text-muted-foreground mb-6 text-sm font-semibold">
                Reset Password
              </h3>

              <Field className="pb-6">
                <FieldLabel>Current Password</FieldLabel>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={form.currentPassword}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCurrent((prev) => !prev)}
                    className="absolute top-1/2 right-2 h-7 w-7 -translate-y-1/2"
                  >
                    {showCurrent ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Field>

              <Field className="pb-6">
                <FieldLabel>New Password</FieldLabel>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={form.newPassword}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, newPassword: e.target.value }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNew((prev) => !prev)}
                    className="absolute top-1/2 right-2 h-7 w-7 -translate-y-1/2"
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Field>

              <Field className="pb-6">
                <FieldLabel>Confirm New Password</FieldLabel>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute top-1/2 right-2 h-7 w-7 -translate-y-1/2"
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {isConfirmMismatch ? (
                  <p className="text-destructive mt-2 text-xs">
                    Confirmation password does not match.
                  </p>
                ) : null}
              </Field>

              <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={handleResetFields}
                  disabled={!hasChanges}
                >
                  Reset Fields
                </Button>
                <Button onClick={handleSavePassword} disabled={isConfirmMismatch}>
                  Save Password
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border shadow-sm">
            <div className="px-6 py-8">
              <h3 className="mb-4 text-sm font-semibold">Forgot Password</h3>
              <p className="text-muted-foreground text-sm">
                Request a password reset email if you can&apos;t remember your
                current password.
              </p>
              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsForgotPasswordOpen(true)}
                >
                  Send Reset Password Email
                </Button>
              </div>

              <div className="my-8 border-t" />

              <h3 className="text-destructive mb-4 text-sm font-semibold">
                Delete Account
              </h3>
              <p className="text-muted-foreground text-sm">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
              <div className="mt-6">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <ShieldAlert className="h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              This is a hardcoded flow for now. Later, this will call the
              delete-account API.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast.error("Delete account (mock)");
                setIsDeleteDialogOpen(false);
              }}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              onClick={() => {
                setIsForgotPasswordOpen(false);
                setResetEmail("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSendResetEmail}>Send Reset Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
