"use client";

import { cn } from "@/lib/utils";

interface PuffLoaderProps {
  size?: number;
  color?: string;
  speed?: number;
  className?: string;
}

export function PuffLoader({
  size = 60,
  color = "#000",
  speed = 2,
  className,
}: PuffLoaderProps) {
  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      <span
        className="animate-puff absolute rounded-full border-8"
        style={{
          width: size,
          height: size,
          borderColor: color,
          animationDuration: `${speed}s`,
        }}
      />
      <span
        className="animate-puff absolute rounded-full border-8"
        style={{
          width: size,
          height: size,
          borderColor: color,
          animationDuration: `${speed}s`,
          animationDelay: `-${speed / 2}s`,
        }}
      />
    </div>
  );
}
