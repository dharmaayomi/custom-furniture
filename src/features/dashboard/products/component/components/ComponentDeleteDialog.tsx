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
import { ProductComponent } from "@/types/componentProduct";

type ComponentDeleteDialogProps = {
  open: boolean;
  component: ProductComponent | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function ComponentDeleteDialog({
  open,
  component,
  isDeleting,
  onOpenChange,
  onConfirm,
}: ComponentDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete component?</DialogTitle>
          <DialogDescription>
            {component ? (
              <>
                You are about to delete{" "}
                <span className="text-foreground font-semibold">
                  {component.componentName}
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
            {isDeleting ? "Deleting..." : "Delete Component"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

