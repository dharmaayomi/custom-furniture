"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Grid3x3,
  List,
  MapPin,
  Edit2,
  MoreHorizontal,
  Phone,
  Trash2,
  User,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "grid";

export default function AddressesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { userId } = useUser();
  const { data, isLoading, isError } = useGetUserAddresses(userId);
  const addressesPayload = (data as any)?.data ?? data;
  const addresses = Array.isArray(addressesPayload)
    ? (addressesPayload as Address[])
    : [];
  const sortedAddresses = useMemo(
    () =>
      [...addresses].sort((a, b) => {
        const defaultDiff = Number(b.isDefault) - Number(a.isDefault);
        if (defaultDiff !== 0) return defaultDiff;
        return b.id - a.id;
      }),
    [addresses],
  );
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

  const renderListSkeleton = () => (
    <div className="bg-card w-full overflow-x-auto overflow-y-visible rounded-2xl p-3 pb-6 shadow-lg/5">
      <Table className="min-w-230 border-separate border-spacing-y-3">
        <TableHeader>
          <TableRow className="border-none bg-transparent hover:bg-transparent">
            <TableHead className="text-muted-foreground px-6 text-[11px] font-bold tracking-[0.2em] uppercase">
              Label
            </TableHead>
            <TableHead className="text-muted-foreground text-[11px] font-bold tracking-[0.2em] uppercase">
              Recipient
            </TableHead>
            <TableHead className="text-muted-foreground text-[11px] font-bold tracking-[0.2em] uppercase">
              Address
            </TableHead>
            <TableHead className="text-muted-foreground text-[11px] font-bold tracking-[0.2em] uppercase">
              Postal
            </TableHead>
            <TableHead className="text-muted-foreground text-[11px] font-bold tracking-[0.2em] uppercase">
              Status
            </TableHead>
            <TableHead className="text-muted-foreground text-right text-[11px] font-bold tracking-[0.2em] uppercase">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow
              key={index}
              className="group bg-muted/20 hover:bg-muted/20 border-none transition-all duration-200"
            >
              <TableCell className="rounded-l-3xl border-y border-l px-6 py-5">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-28 rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </TableCell>
              <TableCell className="border-y">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="border-y">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-4 w-44" />
                </div>
              </TableCell>
              <TableCell className="border-y">
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="border-y">
                <Skeleton className="h-6 w-18 rounded-full" />
              </TableCell>
              <TableCell className="rounded-r-3xl border-y border-r pr-4 text-right">
                <div className="flex justify-end">
                  <Skeleton className="h-9 w-9 rounded-xl" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <section>
      <header className="bg-card border-accent relative mb-8 overflow-hidden rounded-2xl border px-6 py-10 shadow-lg/5 sm:px-10">
        <div className="from-primary/5 to-primary/20 pointer-events-none absolute -top-17 -right-20 h-72 w-72 rounded-full bg-linear-to-br md:-top-14 md:-right-24 lg:-top-16 lg:-right-8" />
        <div className="from-primary/10 to-primary/30 pointer-events-none absolute -top-13 -right-28 h-64 w-64 rounded-full bg-linear-to-br md:-top-10 md:-right-32 lg:-top-12 lg:-right-12" />
        <div className="from-primary/20 to-primary/80 pointer-events-none absolute -top-9 -right-36 h-56 w-56 rounded-full bg-linear-to-br md:-top-6 md:-right-40 lg:-top-8 lg:-right-16" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <div className="bg-primary/10 rounded-lg p-2">
                <MapPin className="text-primary h-5 w-5" />
              </div>
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                My Addresses
              </h1>
            </div>
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
      </header>

      <div>
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
              {sortedAddresses.length} address
              {sortedAddresses.length !== 1 ? "es" : ""}
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
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <AddressCardSkeleton key={index} variant="grid" />
                ))}
              </div>
            ) : (
              renderListSkeleton()
            )
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
          ) : sortedAddresses.length === 0 ? (
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
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {sortedAddresses.map((address) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      variant="grid"
                      onDelete={handleDeleteAddress}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-card w-full overflow-x-auto overflow-y-visible rounded-2xl p-3 pb-6 shadow-lg/5">
                  <Table className="min-w-230 border-separate border-spacing-y-3">
                    <TableHeader>
                      <TableRow className="border-none bg-transparent hover:bg-transparent">
                        <TableHead className="text-muted-foreground px-6 text-[11px] font-bold tracking-[0.2em] uppercase">
                          Label
                        </TableHead>
                        <TableHead className="text-muted-foreground text-[11px] font-bold tracking-[0.2em] uppercase">
                          Recipient
                        </TableHead>
                        <TableHead className="text-muted-foreground text-[11px] font-bold tracking-[0.2em] uppercase">
                          Address
                        </TableHead>
                        <TableHead className="text-muted-foreground text-[11px] font-bold tracking-[0.2em] uppercase">
                          Postal
                        </TableHead>
                        <TableHead className="text-muted-foreground text-[11px] font-bold tracking-[0.2em] uppercase">
                          Status
                        </TableHead>
                        <TableHead className="text-muted-foreground text-right text-[11px] font-bold tracking-[0.2em] uppercase">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAddresses.map((address) => (
                        <TableRow
                          key={address.id}
                          className={cn(
                            "group border-none transition-all duration-200 hover:-translate-y-0.5",
                            address.isDefault ? "bg-primary/10" : "bg-muted/20",
                          )}
                        >
                          <TableCell
                            className={cn(
                              "rounded-l-3xl border-y border-l px-6 py-5 transition-colors",
                              address.isDefault && "border-primary/20",
                            )}
                          >
                            <div className="space-y-2">
                              <span
                                className={cn(
                                  "inline-flex rounded-lg border px-2.5 py-1 text-xs font-black tracking-wide uppercase transition-colors",
                                  address.isDefault
                                    ? "bg-primary/15 border-primary/20 text-primary"
                                    : "bg-muted",
                                )}
                              >
                                {address.label}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell
                            className={cn(
                              "border-y transition-colors",
                              address.isDefault && "border-primary/20",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "text-primary flex h-10 w-10 items-center justify-center rounded-full text-[11px] font-bold ring-2 transition-colors",
                                  address.isDefault
                                    ? "bg-primary/15 ring-primary/15"
                                    : "bg-primary/10 ring-primary/5",
                                )}
                              >
                                <User className="h-4 w-4" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-bold tracking-tight">
                                  {address.recipientName}
                                </p>
                                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                  <Phone className="h-3.5 w-3.5" />
                                  {address.phoneNumber}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell
                            className={cn(
                              "border-y transition-colors",
                              address.isDefault && "border-primary/20",
                            )}
                          >
                            <div className="max-w-md space-y-1 text-xs">
                              <p className="text-foreground font-medium">
                                {address.line1}
                                {address.line2 ? `, ${address.line2}` : ""}
                              </p>
                              <p className="text-muted-foreground">
                                {address.district}, {address.city},{" "}
                                {address.province}
                              </p>
                              <p className="text-muted-foreground">
                                {address.country}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-muted-foreground border-y text-xs font-medium transition-colors",
                              address.isDefault && "border-primary/20",
                            )}
                          >
                            {address.postalCode}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "border-y transition-colors",
                              address.isDefault && "border-primary/20",
                            )}
                          >
                            {address.isDefault ? (
                              <Badge className="bg-primary/15 text-primary border-primary/20 hover:bg-primary/15 border px-2.5 py-0.5 shadow-none">
                                Default
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="px-2.5 py-0.5 shadow-none"
                              >
                                Saved
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "rounded-r-3xl border-y border-r pr-4 text-right transition-colors",
                              address.isDefault && "border-primary/20",
                            )}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-9 w-9 rounded-xl transition-colors",
                                    address.isDefault
                                      ? "bg-primary/10 hover:bg-primary/15"
                                      : "hover:bg-muted",
                                  )}
                                >
                                  <MoreHorizontal className="text-muted-foreground h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-44 rounded-2xl p-2 shadow-xl"
                              >
                                <DropdownMenuItem
                                  asChild
                                  className="cursor-pointer rounded-lg py-2.5"
                                >
                                  <Link
                                    href={`/dashboard/address/${address.id}/edit`}
                                  >
                                    <Edit2 className="mr-3 h-4 w-4 text-blue-500" />
                                    <span className="font-medium">
                                      Edit Address
                                    </span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer rounded-lg py-2.5"
                                  onClick={() =>
                                    handleDeleteAddress(address.id)
                                  }
                                >
                                  <Trash2 className="mr-3 h-4 w-4 text-red-500" />
                                  <span className="font-medium">
                                    Delete Address
                                  </span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
