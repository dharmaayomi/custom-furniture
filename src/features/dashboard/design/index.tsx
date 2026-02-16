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
import useDeleteDesign from "@/hooks/api/design/useDeleteDesign";
import useGetSavedDesign from "@/hooks/api/design/useGetSavedDesign";
import { useUser } from "@/providers/UserProvider";
import { SavedDesign } from "@/types/shareableDesign";
import { FolderOpen, Grid3x3, List, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import DesignCard from "./components/DesignCard";
import DesignCardSkeleton from "./components/DesignCardSkeleton";

export const DesignPage = () => {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [deleteTarget, setDeleteTarget] = useState<SavedDesign | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { userId } = useUser();
  const { data, isLoading, isError } = useGetSavedDesign(userId);
  const designsPayload = (data as any)?.data ?? data;
  const designs = Array.isArray(designsPayload)
    ? (designsPayload as SavedDesign[])
    : [];
  const { mutateAsync: deleteDesign, isPending: isDeleting } = useDeleteDesign(
    userId,
    deleteTarget?.designCode,
    {
      onSuccess: () => {
        toast.success("Design deleted");
      },
      onError: (error) => {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Failed to delete design.";
        toast.error(message);
      },
    },
  );

  const handleDeleteClick = (design: SavedDesign) => {
    setDeleteTarget(design);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.designCode) return;
    await deleteDesign();
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  return (
    <section>
      <div className="bg-muted/60 mb-8 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
              My Designs
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Manage and review your saved room designs.
            </p>
          </div>
          <Link href="/custom?new=1" className="w-full sm:w-auto">
            <Button className="w-full gap-2 sm:w-auto">
              <Plus className="h-4 w-4" />
              Create New Design
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-muted/50 rounded-md p-3 sm:p-4">
        <Dialog
          open={isDeleteOpen}
          onOpenChange={(open) => {
            setIsDeleteOpen(open);
            if (!open) {
              setDeleteTarget(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete design?</DialogTitle>
              <DialogDescription>
                This will remove{" "}
                <span className="text-foreground font-semibold">
                  {deleteTarget?.designName || "this design"}
                </span>{" "}
                from your saved designs.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Design"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mx-auto px-1 py-3 sm:px-4 sm:py-4 lg:px-2 lg:py-2">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              {designs.length} design{designs.length !== 1 ? "s" : ""}
            </p>
            <div className="border-border bg-muted flex w-full gap-2 rounded-lg border p-1 sm:w-auto">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="flex-1 gap-2 sm:flex-none"
              >
                <Grid3x3 className="h-4 w-4" />
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="flex-1 gap-2 sm:flex-none"
              >
                <List className="h-4 w-4" />
                List
              </Button>
            </div>
          </div>

          {isLoading || !userId ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {Array.from({ length: viewMode === "grid" ? 6 : 4 }).map(
                (_, index) => (
                  <DesignCardSkeleton key={index} variant={viewMode} />
                ),
              )}
            </div>
          ) : isError ? (
            <div className="border-border bg-muted/30 mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12">
              <FolderOpen className="text-muted-foreground/40 mb-3 h-12 w-12" />
              <h3 className="text-foreground mb-2 text-lg font-medium">
                Failed to load designs
              </h3>
              <p className="text-muted-foreground text-sm">
                Please try again later.
              </p>
            </div>
          ) : designs.length === 0 ? (
            <div className="border-border bg-card mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12 lg:max-w-full">
              <FolderOpen className="text-muted-foreground/40 mb-3 h-12 w-12" />
              <h3 className="text-foreground mb-2 text-lg font-medium">
                No designs yet
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Start creating to see your saved designs here.
              </p>
              <Link href="/custom?new=1" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">Create First Design</Button>
              </Link>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {designs.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  variant={viewMode}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
