// "use client";

// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { formatPrice } from "@/lib/price";
// import { ProductBase } from "@/types/product";
// import { Box, Edit2, Trash2 } from "lucide-react";
// import { useMemo, useState } from "react";

// type BaseProductCardProps = {
//   item: ProductBase;
//   viewMode: "grid" | "list";
//   onEdit: () => void;
//   onDelete: () => void;
// };

// const ACTIVE_BADGE_CLASS =
//   "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300";
// const INACTIVE_BADGE_CLASS =
//   "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300";
// const CUSTOMIZABLE_BADGE_CLASS =
//   "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300";
// const FIXED_BADGE_CLASS =
//   "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300";

// const toCloudinaryThumbUrl = (url?: string) => {
//   if (!url) return undefined;
//   if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
//     return undefined;
//   }

//   return url.replace("/upload/", "/upload/w_320,h_240,c_fill,q_auto,f_auto/");
// };

// const ProductPreview = ({
//   candidates,
//   alt,
//   list,
// }: {
//   candidates: (string | undefined)[];
//   alt: string;
//   list?: boolean;
// }) => {
//   const normalizedCandidates = useMemo(
//     () => candidates.filter((item): item is string => !!item),
//     [candidates],
//   );
//   const [activeIndex, setActiveIndex] = useState(0);

//   const baseClass = list
//     ? "bg-muted text-muted-foreground flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs"
//     : "bg-muted text-muted-foreground flex aspect-4/3 items-center justify-center overflow-hidden text-xs";

//   const activeImage = normalizedCandidates[activeIndex];

//   if (process.env.NODE_ENV !== "production") {
//     console.debug("[BaseProductCard] preview state", {
//       alt,
//       activeIndex,
//       activeImage,
//       candidates: normalizedCandidates,
//     });
//   }

//   if (activeImage) {
//     return (
//       <div className={baseClass}>
//         <img
//           src={activeImage}
//           alt={alt}
//           className="h-full w-full transform-gpu object-cover transition-all duration-500 ease-in-out hover:scale-105"
//           onError={() => {
//             if (process.env.NODE_ENV !== "production") {
//               console.warn("[BaseProductCard] preview image failed", {
//                 alt,
//                 failedImage: activeImage,
//                 activeIndex,
//                 nextIndex:
//                   activeIndex < normalizedCandidates.length - 1
//                     ? activeIndex + 1
//                     : null,
//               });
//             }
//             if (activeIndex < normalizedCandidates.length - 1) {
//               setActiveIndex((prev) => prev + 1);
//             }
//           }}
//           loading="lazy"
//         />
//       </div>
//     );
//   }

//   return (
//     <div className={baseClass}>
//       <div className="flex flex-col items-center gap-1 opacity-40">
//         <Box className="h-6 w-6" />
//         <span className="text-[10px] font-medium tracking-wide uppercase">
//           No Preview
//         </span>
//       </div>
//     </div>
//   );
// };

// export const BaseProductCard = ({
//   item,
//   viewMode,
//   onEdit,
//   onDelete,
// }: BaseProductCardProps) => {
//   const previewCandidates = useMemo(() => {
//     const original = item.productUrl;
//     const cloudinaryThumb = toCloudinaryThumbUrl(original);
//     const imageFallback = item.images?.[0];
//     const resolved = [cloudinaryThumb, original, imageFallback];

//     if (process.env.NODE_ENV !== "production") {
//       console.debug("[BaseProductCard] preview candidates", {
//         productName: item.productName,
//         original,
//         cloudinaryThumb,
//         imageFallback,
//         resolved,
//       });
//     }

//     return resolved;
//   }, [item.images, item.productName, item.productUrl]);

//   if (viewMode === "grid") {
//     return (
//       <div className="bg-card group border-border/60 hover:border-border relative overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
//         {/* Image */}
//         <div className="relative overflow-hidden">
//           <ProductPreview
//             candidates={previewCandidates}
//             alt={item.productName}
//           />
//           {/* Subtle gradient overlay at bottom of image */}
//           <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-black/10 to-transparent" />
//         </div>

//         {/* Content */}
//         <div className="p-4">
//           {/* Name + SKU */}
//           <div className="mb-3">
//             <div className="mb-0.5 flex items-center gap-1.5">
//               <Box className="text-muted-foreground/70 h-3.5 w-3.5 shrink-0" />
//               <p className="text-foreground truncate text-sm leading-tight font-semibold">
//                 {item.productName}
//               </p>
//             </div>
//             <div className="mt-1 flex items-center justify-between">
//               <p className="text-muted-foreground/70 font-mono text-[11px]">
//                 {item.sku}
//               </p>
//               <p className="text-foreground text-sm font-semibold tabular-nums">
//                 {formatPrice(item.basePrice)}
//               </p>
//             </div>
//           </div>

//           {/* Badges */}
//           <div className="flex items-center gap-1.5">
//             <Badge
//               variant="outline"
//               className={`h-5 px-2 py-0 text-[10px] font-medium ${item.isActive ? ACTIVE_BADGE_CLASS : INACTIVE_BADGE_CLASS}`}
//             >
//               {item.isActive ? "Active" : "Inactive"}
//             </Badge>
//             <Badge
//               variant="outline"
//               className={`h-5 px-2 py-0 text-[10px] font-medium ${item.isCustomizable ? CUSTOMIZABLE_BADGE_CLASS : FIXED_BADGE_CLASS}`}
//             >
//               {item.isCustomizable ? "Customizable" : "Fixed"}
//             </Badge>
//           </div>

//           {/* Actions */}
//           <div className="border-border/60 mt-3 flex gap-2 border-t pt-3">
//             <Button
//               type="button"
//               variant="outline"
//               size="sm"
//               onClick={onEdit}
//               className="hover:bg-accent h-8 flex-1 gap-1.5 bg-transparent text-xs font-medium transition-colors"
//             >
//               <Edit2 className="h-3.5 w-3.5" />
//               Edit
//             </Button>
//             <Button
//               type="button"
//               variant="outline"
//               size="sm"
//               onClick={onDelete}
//               className="text-destructive hover:bg-destructive hover:border-destructive h-8 w-8 bg-transparent p-0 transition-colors hover:text-white"
//             >
//               <Trash2 className="h-3.5 w-3.5" />
//             </Button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-card border-border/60 hover:border-border rounded-xl border p-3 shadow-sm transition-all duration-200 hover:shadow-md">
//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
//         {/* Thumbnail */}
//         <div className="ring-border/40 overflow-hidden rounded-lg ring-1">
//           <ProductPreview
//             list
//             candidates={previewCandidates}
//             alt={item.productName}
//           />
//         </div>

//         {/* Info */}
//         <div className="min-w-0 flex-1">
//           <div className="mb-0.5 flex items-center gap-1.5">
//             <Box className="text-muted-foreground/70 h-3.5 w-3.5 shrink-0" />
//             <p className="text-foreground truncate text-sm font-semibold">
//               {item.productName}
//             </p>
//           </div>
//           <div className="mb-2 flex items-center gap-3">
//             <p className="text-muted-foreground/70 font-mono text-[11px]">
//               {item.sku}
//             </p>
//             <span className="text-border">·</span>
//             <p className="text-foreground/80 text-[11px] font-semibold tabular-nums">
//               {formatPrice(item.basePrice)}
//             </p>
//           </div>
//           <div className="flex items-center gap-1.5">
//             <Badge
//               variant="outline"
//               className={`h-5 px-2 py-0 text-[10px] font-medium ${item.isActive ? ACTIVE_BADGE_CLASS : INACTIVE_BADGE_CLASS}`}
//             >
//               {item.isActive ? "Active" : "Inactive"}
//             </Badge>
//             <Badge
//               variant="outline"
//               className={`h-5 px-2 py-0 text-[10px] font-medium ${item.isCustomizable ? CUSTOMIZABLE_BADGE_CLASS : FIXED_BADGE_CLASS}`}
//             >
//               {item.isCustomizable ? "Customizable" : "Fixed"}
//             </Badge>
//           </div>
//         </div>

//         {/* Actions */}
//         <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
//           <Button
//             type="button"
//             variant="outline"
//             size="sm"
//             onClick={onEdit}
//             className="hover:bg-accent h-8 flex-1 gap-1.5 bg-transparent text-xs font-medium transition-colors sm:flex-none sm:px-3"
//           >
//             <Edit2 className="h-3.5 w-3.5" />
//             Edit
//           </Button>
//           <Button
//             type="button"
//             variant="outline"
//             size="sm"
//             onClick={onDelete}
//             className="text-destructive hover:bg-destructive hover:border-destructive h-8 w-8 bg-transparent p-0 transition-colors hover:text-white sm:flex-none"
//           >
//             <Trash2 className="h-3.5 w-3.5" />
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/price";
import { cn } from "@/lib/utils";
import { ProductBase } from "@/types/product";
import { Box, Edit3, Trash2, Layers, ImageOff } from "lucide-react";
import { useMemo, useState } from "react";

type BaseProductCardProps = {
  item: ProductBase;
  viewMode: "grid" | "list";
  onEdit: () => void;
  onDelete: () => void;
};

// --- Badge Styles (Dashboard Style) ---
const BADGE_BASE =
  "h-5 px-2 py-0 text-[10px] font-bold uppercase border rounded-md shadow-none";
const ACTIVE_CLASS =
  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300";
const INACTIVE_CLASS =
  "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300";
const CUSTOM_CLASS =
  "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300";
const FIXED_CLASS =
  "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300";

const toCloudinaryThumbUrl = (url?: string) => {
  if (!url?.includes("res.cloudinary.com")) return url;
  return url.replace(
    "/upload/",
    "/upload/w_500,h_375,c_fill,g_auto,q_auto,f_auto/",
  );
};

const ProductPreview = ({
  candidates,
  alt,
  list,
}: {
  candidates: (string | undefined)[];
  alt: string;
  list?: boolean;
}) => {
  const normalizedCandidates = useMemo(
    () => candidates.filter((item): item is string => !!item),
    [candidates],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isError, setIsError] = useState(false);

  const baseClass = cn(
    "relative flex items-center justify-center bg-muted/50 border-b",
    list
      ? "h-16 w-20 shrink-0 rounded-lg border-b-0 border-r"
      : "aspect-[4/3] rounded-t-xl",
  );

  const activeImage = normalizedCandidates[activeIndex];

  // Fallback Component
  const FallbackUI = (
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
          alt={alt}
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
        FallbackUI
      )}
    </div>
  );
};

export const BaseProductCard = ({
  item,
  viewMode,
  onEdit,
  onDelete,
}: BaseProductCardProps) => {
  const previewCandidates = useMemo(
    () => [
      toCloudinaryThumbUrl(item.productUrl),
      item.productUrl,
      item.images?.[0],
    ],
    [item.images, item.productUrl],
  );

  if (viewMode === "grid") {
    return (
      <div className="group bg-card border-border/60 hover:border-primary/40 flex flex-col rounded-xl border shadow-sm transition-all duration-200">
        <ProductPreview candidates={previewCandidates} alt={item.productName} />

        <div className="flex flex-1 flex-col p-3">
          {" "}
          {/* Padding dikurangi dari 4 ke 3 */}
          <div className="mb-2 space-y-0.5">
            <h3 className="text-foreground line-clamp-1 text-xs font-bold tracking-tight">
              {item.productName}
            </h3>
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground/60 flex items-center gap-1">
                <Layers className="h-3 w-3" />
                <span className="font-mono text-[9px] font-bold tracking-tighter uppercase">
                  {item.sku || "N/A"}
                </span>
              </div>
              <p className="text-foreground text-[13px] font-black tracking-tight tabular-nums">
                {formatPrice(item.basePrice)}
              </p>
            </div>
          </div>
          <div className="mb-3 flex flex-wrap gap-1">
            <Badge
              variant="outline"
              className={cn(
                BADGE_BASE,
                "h-4 px-1 text-[8px]",
                item.isActive ? ACTIVE_CLASS : INACTIVE_CLASS,
              )}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                BADGE_BASE,
                "h-4 px-1 text-[8px]",
                item.isCustomizable ? CUSTOM_CLASS : FIXED_CLASS,
              )}
            >
              {item.isCustomizable ? "Custom" : "Fixed"}
            </Badge>
          </div>
          <div className="mt-auto flex gap-1.5 border-t pt-2.5">
            <Button
              onClick={onEdit}
              variant="secondary"
              className="h-7 flex-1 rounded-md px-0 text-[10px] font-bold"
            >
              <Edit3 className="mr-1.5 h-3 w-3" /> Edit
            </Button>
            <Button
              onClick={onDelete}
              variant="outline"
              className="text-destructive hover:bg-destructive/10 border-destructive/20 h-7 w-7 rounded-md p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-card border-border/60 hover:border-primary/40 flex flex-row items-center gap-4 rounded-xl border p-2 shadow-sm transition-colors">
      <ProductPreview
        list
        candidates={previewCandidates}
        alt={item.productName}
      />

      <div className="flex min-w-0 flex-1 items-center justify-between pr-2">
        <div className="min-w-0">
          <h3 className="text-foreground truncate text-sm font-bold tracking-tight">
            {item.productName}
          </h3>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-[10px] font-bold uppercase">
              {item.sku}
            </span>
            <span className="text-border">·</span>
            <span className="text-primary text-xs font-black">
              {formatPrice(item.basePrice)}
            </span>
          </div>
        </div>

        <div className="ml-4 flex items-center gap-3">
          <div className="hidden gap-1.5 md:flex">
            <Badge
              variant="outline"
              className={cn(
                BADGE_BASE,
                item.isActive ? ACTIVE_CLASS : INACTIVE_CLASS,
              )}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                BADGE_BASE,
                item.isCustomizable ? CUSTOM_CLASS : FIXED_CLASS,
              )}
            >
              {item.isCustomizable ? "Custom" : "Fixed"}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 border-l pl-3">
            <Button
              onClick={onEdit}
              variant="secondary"
              className="h-8 rounded-lg px-3 text-xs font-bold"
            >
              <Edit3 className="mr-2 h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              onClick={onDelete}
              variant="outline"
              className="text-destructive hover:bg-destructive/10 border-destructive/20 h-8 w-8 rounded-lg"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
