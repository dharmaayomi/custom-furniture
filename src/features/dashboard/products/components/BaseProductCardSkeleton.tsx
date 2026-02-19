type BaseProductCardSkeletonProps = {
  viewMode: "grid" | "list";
};

export const BaseProductCardSkeleton = ({
  viewMode,
}: BaseProductCardSkeletonProps) => {
  if (viewMode === "grid") {
    return (
      <div className="bg-card overflow-hidden rounded-lg border shadow-sm">
        <div className="bg-muted aspect-4/3 w-full animate-pulse" />
        <div className="space-y-2 p-3">
          <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
          <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-3 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="bg-muted h-16 w-24 animate-pulse rounded-md" />
        <div className="flex-1 space-y-2">
          <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
          <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
};
