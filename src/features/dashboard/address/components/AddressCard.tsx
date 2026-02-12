"use client";

import { MapPin, Phone, User, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Address } from "@/types/address";

interface AddressCardProps {
  address: Address;
  onDelete?: (id: number) => void;
  variant?: "list" | "grid";
}

export default function AddressCard({
  address,
  onDelete,
  variant = "grid",
}: AddressCardProps) {
  const handleDelete = () => {
    if (onDelete) {
      onDelete(address.id);
    }
  };

  if (variant === "list") {
    return (
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-foreground text-lg font-semibold">
                {address.label}
              </h3>
              {address.isDefault && (
                <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
                  Default
                </span>
              )}
            </div>

            <div className="mt-3 space-y-2">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span>{address.recipientName}</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" />
                <span>{address.phoneNumber}</span>
              </div>
              <div className="text-muted-foreground flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {address.district}, {address.city}, {address.province}
                  </p>
                  <p>{address.country}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="ml-4 flex gap-2">
            <Link href={`/dashboard/address/${address.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit2 className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:bg-destructive bg-transparent hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground text-lg font-semibold">
            {address.label}
          </h3>
          {address.isDefault && (
            <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
              Default
            </span>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <User className="h-4 w-4 shrink-0" />
            <span>{address.recipientName}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 shrink-0" />
            <span>{address.phoneNumber}</span>
          </div>
          <div className="text-muted-foreground flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="line-clamp-3">
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>
                {address.district}, {address.city}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-border flex gap-2 border-t px-4 py-3">
        <Link href={`/dashboard/address/${address.id}/edit`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full bg-transparent">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          className="text-destructive hover:bg-destructive bg-transparent hover:text-white"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
