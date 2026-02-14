"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import useChangePassword from "@/hooks/api/auth/useChangePassword";
import { getApiErrorMessage } from "@/lib/api-error";
import { useUser } from "@/providers/UserProvider";
import { Eye, EyeOff } from "lucide-react";
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

export const ChangePasswordSection = () => {
  const { userId } = useUser();
  const [form, setForm] = useState<PasswordForm>(INITIAL_FORM);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { mutateAsync: changePassword, isPending: isChangingPassword } =
    useChangePassword(userId, {
      onSuccess: () => {
        toast.success("Password updated");
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Failed to update password."));
      },
    });

  const isConfirmMismatch = useMemo(() => {
    if (!form.confirmPassword) return false;
    return form.newPassword !== form.confirmPassword;
  }, [form.newPassword, form.confirmPassword]);

  const handleResetFields = (silent = false) => {
    const isAlreadyReset =
      !form.currentPassword && !form.newPassword && !form.confirmPassword;

    setForm(INITIAL_FORM);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    if (!silent) {
      toast(
        isAlreadyReset ? "Fields are already reset" : "Password fields reset",
      );
    }
  };

  const handleSavePassword = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error("Please fill all password fields.");
      return;
    }
    if (isConfirmMismatch) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    if (!userId) {
      toast.error("Missing user session.");
      return;
    }

    await changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
    handleResetFields(true);
  };

  return (
    <div className="px-6 py-8">
      <h3 className="text-muted-foreground mb-6 text-sm font-semibold">
        Change Password
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
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              setForm((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowNew((prev) => !prev)}
            className="absolute top-1/2 right-2 h-7 w-7 -translate-y-1/2"
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
          onClick={() => handleResetFields()}
          disabled={isChangingPassword}
        >
          Reset Form
        </Button>
        <Button
          onClick={handleSavePassword}
          disabled={isConfirmMismatch || isChangingPassword}
        >
          {isChangingPassword ? "Saving..." : "Change Password"}
        </Button>
      </div>
    </div>
  );
};
