"use client";

import { useMemo, useState } from "react";

type MaterialPreviewProps = {
  candidates: (string | undefined)[];
  name: string;
  list?: boolean;
};

export function MaterialPreview({ candidates, name, list }: MaterialPreviewProps) {
  const normalizedCandidates = useMemo(
    () => candidates.filter((item): item is string => !!item),
    [candidates],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const baseClass = list
    ? "bg-muted text-muted-foreground flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md text-xs"
    : "bg-muted text-muted-foreground flex aspect-4/3 items-center justify-center overflow-hidden text-xs";

  const activeImage = normalizedCandidates[activeIndex];

  if (!activeImage) return <div className={baseClass}>Preview</div>;

  return (
    <div className={baseClass}>
      <img
        src={activeImage}
        alt={name}
        className="h-full w-full transform-gpu object-cover transition-all duration-300 ease-in-out hover:scale-107"
        onError={() => {
          if (activeIndex < normalizedCandidates.length - 1) {
            setActiveIndex((prev) => prev + 1);
          }
        }}
      />
    </div>
  );
}

