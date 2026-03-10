"use client";

import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";
import { useMemo, useState } from "react";

type ComponentPreviewProps = {
  candidates: (string | undefined)[];
  name: string;
  list?: boolean;
};

export function ComponentPreview({
  candidates,
  name,
  list,
}: ComponentPreviewProps) {
  const normalizedCandidates = useMemo(
    () => candidates.filter((item): item is string => !!item),
    [candidates],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isError, setIsError] = useState(false);

  const baseClass = cn(
    "relative flex items-center justify-center overflow-hidden bg-muted/50",
    list
      ? "h-16 w-20 shrink-0 rounded-lg border"
      : "aspect-[4/3] rounded-t-xl border-b",
  );

  const activeImage = normalizedCandidates[activeIndex];

  const fallback = (
    <div className="text-muted-foreground/40 flex flex-col items-center gap-1">
      <ImageOff
        className={cn(list ? "h-4 w-4" : "h-8 w-8")}
        strokeWidth={1.5}
      />
      {!list && (
        <span className="text-[9px] font-bold tracking-tighter uppercase">
          No Image
        </span>
      )}
    </div>
  );

  return (
    <div className={baseClass}>
      {activeImage && !isError ? (
        <img
          src={activeImage}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => {
            if (activeIndex < normalizedCandidates.length - 1) {
              setActiveIndex((prev) => prev + 1);
            } else {
              setIsError(true);
            }
          }}
        />
      ) : (
        fallback
      )}
    </div>
  );
}
