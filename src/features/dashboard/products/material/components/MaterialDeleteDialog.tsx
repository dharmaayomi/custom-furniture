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
import { ProductMaterial } from "@/types/materialProduct";

type MaterialDeleteDialogProps = {
  open: boolean;
  material: ProductMaterial | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function MaterialDeleteDialog({
  open,
  material,
  isDeleting,
  onOpenChange,
  onConfirm,
}: MaterialDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete material?</DialogTitle>
          <DialogDescription>
            {material ? (
              <>
                You are about to delete{" "}
                <span className="text-foreground font-semibold">
                  {material.materialName}
                </span>
                . This action cannot be undone.
              </>
            ) : (
              "Confirm delete."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Material"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

