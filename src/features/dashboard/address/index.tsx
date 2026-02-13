"use client";

import { useState } from "react";
import { Plus, Grid3x3, List, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import AddressCard from "./components/AddressCard";
import AddressCardSkeleton from "./components/AddressCardSkeleton";
import useGetUserAddresses from "@/hooks/api/user/useGetUserAddresses";
import { useUser } from "@/providers/UserProvider";
import { Address } from "@/types/address";
import useDeleteAddress from "@/hooks/api/user/useDeleteAddress";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ViewMode = "list" | "grid";

export default function AddressesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { userId } = useUser();
  const { data, isLoading, isError } = useGetUserAddresses(userId);
  const addressesPayload = (data as any)?.data ?? data;
  const addresses = Array.isArray(addressesPayload)
    ? (addressesPayload as Address[])
    : [];
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { mutateAsync: deleteAddress, isPending: isDeleting } =
    useDeleteAddress(userId, deleteTargetId ?? undefined, {
      onError: (error) => {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Failed to delete address.";
        toast.error(message);
      },
    });

  const handleDeleteAddress = (id: number) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    await deleteAddress();
    setIsDeleteOpen(false);
    setDeleteTargetId(null);
    const deletedLabel =
      addresses.find((addr) => addr.id === deleteTargetId)?.label || "Address";
    toast("Address deleted", {
      description: `${deletedLabel} was removed successfully.`,
    });
  };

  return (
    <section>
      {/* Header */}
      <div className="bg-muted/60 mb-8 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-foreground text-lg font-bold tracking-tight md:text-3xl">
              My Addresses
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Manage your delivery addresses
            </p>
          </div>
          <Link href="/dashboard/address/create" className="w-full sm:w-auto">
            <Button className="w-full gap-2 sm:w-auto">
              <Plus className="h-3 w-3 md:h-5 md:w-5" />
              <span className="lg:text-md text-xs">Add New Address</span>
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
              setDeleteTargetId(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete address?</DialogTitle>
              <DialogDescription>
                You won&apos;t be able to use{" "}
                <span className="text-foreground font-semibold">
                  {addresses.find((addr) => addr.id === deleteTargetId)
                    ?.label || "this address"}
                </span>{" "}
                for future orders.
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
                {isDeleting ? "Deleting..." : "Delete Address"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Content */}
        <div className="mx-auto px-1 py-3 sm:px-4 sm:py-4 lg:px-2 lg:py-2">
          {/* View Toggle */}
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              {addresses.length} address{addresses.length !== 1 ? "es" : ""}
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

          {/* Address List/Grid */}
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
                  <AddressCardSkeleton key={index} variant={viewMode} />
                ),
              )}
            </div>
          ) : isError ? (
            <div className="border-border bg-muted/30 mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12">
              <MapPin className="text-muted-foreground/40 mb-3 h-12 w-12" />
              <h3 className="text-foreground mb-2 text-lg font-medium">
                Failed to load addresses
              </h3>
              <p className="text-muted-foreground text-sm">
                Please try again later.
              </p>
            </div>
          ) : addresses.length === 0 ? (
            <div className="border-border bg-card mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12 lg:max-w-full">
              <MapPin className="text-muted-foreground/40 mb-3 h-12 w-12" />
              <h3 className="text-foreground mb-2 text-lg font-medium">
                No addresses yet
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Create your first delivery address to get started
              </p>
              <Link
                href="/dashboard/address/create"
                className="w-full sm:w-auto"
              >
                <Button className="w-full sm:w-auto">Add First Address</Button>
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
              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  variant={viewMode}
                  onDelete={handleDeleteAddress}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
