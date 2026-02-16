"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DesignCardSkeletonProps {
  variant?: "list" | "grid";
}

export default function DesignCardSkeleton({
  variant = "grid",
}: DesignCardSkeletonProps) {
  if (variant === "list") {
    return (
      <Card className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <Skeleton className="aspect-4/3 w-full" />
      <div className="flex-1 p-4">
        <Skeleton className="h-5 w-40" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="border-border border-t px-4 py-3">
        <Skeleton className="h-9 w-full" />
      </div>
    </Card>
  );
}

