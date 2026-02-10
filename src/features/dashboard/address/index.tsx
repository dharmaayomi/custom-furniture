"use client";

import { useState } from "react";
import { Plus, Grid3x3, List, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import AddressCard from "./components/AddressCard";
import { MOCK_ADDRESSES } from "./data/mockAddresses";

type ViewMode = "list" | "grid";

export default function AddressesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [addresses, setAddresses] = useState(MOCK_ADDRESSES);

  const handleDeleteAddress = (id: number) => {
    if (confirm("Are you sure you want to delete this address?")) {
      setAddresses(addresses.filter((addr) => addr.id !== id));
    }
  };

  return (
    <main className="bg-background">
      {/* Header */}
      <div className="bg-card">
        <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-3xl font-bold tracking-tight">
                My Addresses
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Manage your delivery addresses
              </p>
            </div>
            <Link href="/dashboard/address/create">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Add New Address
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* View Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {addresses.length} address{addresses.length !== 1 ? "es" : ""}
          </p>
          <div className="border-border bg-muted flex gap-2 rounded-lg border p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="gap-2"
            >
              <Grid3x3 className="h-4 w-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
        </div>

        {/* Address List/Grid */}
        {addresses.length === 0 ? (
          <div className="border-border bg-muted/30 flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
            <MapPin className="text-muted-foreground/40 mb-3 h-12 w-12" />
            <h3 className="text-foreground mb-2 text-lg font-medium">
              No addresses yet
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Create your first delivery address to get started
            </p>
            <Link href="/dashboard/address/create">
              <Button>Add First Address</Button>
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
    </main>
  );
}
