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
import useRequestDeleteAccount from "@/hooks/api/auth/useRequestDeleteAccount";
import { getApiErrorMessage } from "@/lib/api-error";
import { ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const ReqDeleteAccountSection = () => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");

  const {
    mutateAsync: requestDeleteAccount,
    isPending: isRequestingDeleteAccount,
  } = useRequestDeleteAccount({
    onSuccess: (result) => {
      toast.success(
        result?.message ?? "Delete account link has been sent to your email",
      );
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Failed to request account deletion."),
      );
    },
  });

  const handleOpenDialog = () => {
    setDeleteEmail("");
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isRequestingDeleteAccount) return;
    setIsDeleteDialogOpen(false);
    setDeleteEmail("");
  };

  const handleRequestDeleteAccount = async () => {
    if (!deleteEmail.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    await requestDeleteAccount({ email: deleteEmail.trim() });
    setIsDeleteDialogOpen(false);
    setDeleteEmail("");
  };

  return (
    <>
      <h3 className="text-destructive mb-4 text-sm font-semibold">
        Delete Account
      </h3>
      <p className="text-muted-foreground text-sm">
        Permanently delete your account and all associated data. This action
        cannot be undone.
      </p>
      <div className="mt-6">
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleOpenDialog}
          disabled={isRequestingDeleteAccount}
        >
          <ShieldAlert className="h-4 w-4" />
          Delete Account
        </Button>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request account deletion</DialogTitle>
            <DialogDescription>
              Enter your account email to receive a delete account confirmation
              link.
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              placeholder="you@example.com"
              value={deleteEmail}
              onChange={(e) => setDeleteEmail(e.target.value)}
            />
          </Field>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isRequestingDeleteAccount}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRequestDeleteAccount}
              disabled={isRequestingDeleteAccount}
            >
              {isRequestingDeleteAccount ? "Sending..." : "Send Delete Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
