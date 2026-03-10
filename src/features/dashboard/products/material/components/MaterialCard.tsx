// "use client";

// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { formatPrice } from "@/lib/price";
// import { ProductMaterial } from "@/types/materialProduct";
// import { Palette, Pencil, Trash2 } from "lucide-react";
// import {
//   formatMaterialCategory,
//   toCloudinaryThumbUrl,
// } from "./materialHelpers";
// import { MaterialPreview } from "./MaterialPreview";

// type MaterialCardProps = {
//   item: ProductMaterial;
//   viewMode: "grid" | "list";
//   onEdit: (id: string) => void;
//   onDelete: (material: ProductMaterial) => void;
// };

// const ACTIVE_BADGE_CLASS =
//   "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300";
// const INACTIVE_BADGE_CLASS =
//   "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300";

// export function MaterialCard({
//   item,
//   viewMode,
//   onEdit,
//   onDelete,
// }: MaterialCardProps) {
//   if (viewMode === "grid") {
//     return (
//       <div className="bg-card group border-border/60 hover:border-border relative overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
//         {/* Image */}
//         <div className="relative overflow-hidden">
//           <MaterialPreview
//             candidates={[
//               toCloudinaryThumbUrl(item.materialUrl),
//               item.materialUrl,
//             ]}
//             name={item.materialName}
//           />
//           <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-black/10 to-transparent" />
//         </div>

//         {/* Content */}
//         <div className="p-4">
//           {/* Name */}
//           <div className="mb-0.5 flex items-center gap-1.5">
//             <Palette className="text-muted-foreground/70 h-3.5 w-3.5 shrink-0" />
//             <p className="text-foreground truncate text-sm leading-tight font-semibold">
//               {item.materialName}
//             </p>
//           </div>

//           {/* Category + Price */}
//           <div className="mt-1 flex items-center justify-between">
//             <p className="text-muted-foreground/70 text-[11px]">
//               {formatMaterialCategory(item)}
//             </p>
//             <p className="text-foreground text-sm font-semibold tabular-nums">
//               {item.price != null ? formatPrice(item.price) : "-"}
//             </p>
//           </div>

//           {/* Badge */}
//           <div className="mt-2">
//             <Badge
//               variant="outline"
//               className={`h-5 px-2 py-0 text-[10px] font-medium ${item.isActive ? ACTIVE_BADGE_CLASS : INACTIVE_BADGE_CLASS}`}
//             >
//               {item.isActive ? "Active" : "Inactive"}
//             </Badge>
//           </div>

//           {/* Actions */}
//           <div className="border-border/60 mt-3 flex gap-2 border-t pt-3">
//             <Button
//               type="button"
//               variant="outline"
//               size="sm"
//               onClick={() => onEdit(item.id)}
//               className="hover:bg-accent h-8 flex-1 gap-1.5 bg-transparent text-xs font-medium transition-colors"
//             >
//               <Pencil className="h-3.5 w-3.5" />
//               Edit
//             </Button>
//             <Button
//               type="button"
//               variant="outline"
//               size="sm"
//               onClick={() => onDelete(item)}
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
//           <MaterialPreview
//             list
//             candidates={[
//               toCloudinaryThumbUrl(item.materialUrl),
//               item.materialUrl,
//             ]}
//             name={item.materialName}
//           />
//         </div>

//         {/* Info */}
//         <div className="min-w-0 flex-1">
//           <div className="mb-0.5 flex items-center gap-1.5">
//             <Palette className="text-muted-foreground/70 h-3.5 w-3.5 shrink-0" />
//             <p className="text-foreground truncate text-sm font-semibold">
//               {item.materialName}
//             </p>
//           </div>
//           <div className="mb-2 flex items-center gap-3">
//             <p className="text-muted-foreground/70 text-[11px]">
//               {formatMaterialCategory(item)}
//             </p>
//             <span className="text-border">·</span>
//             <p className="text-foreground/80 text-[11px] font-semibold tabular-nums">
//               {item.price != null ? formatPrice(item.price) : "-"}
//             </p>
//           </div>
//           <Badge
//             variant="outline"
//             className={`h-5 px-2 py-0 text-[10px] font-medium ${item.isActive ? ACTIVE_BADGE_CLASS : INACTIVE_BADGE_CLASS}`}
//           >
//             {item.isActive ? "Active" : "Inactive"}
//           </Badge>
//         </div>

//         {/* Actions */}
//         <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
//           <Button
//             type="button"
//             variant="outline"
//             size="sm"
//             onClick={() => onEdit(item.id)}
//             className="hover:bg-accent h-8 flex-1 gap-1.5 bg-transparent text-xs font-medium transition-colors sm:flex-none sm:px-3"
//           >
//             <Pencil className="h-3.5 w-3.5" />
//             Edit
//           </Button>
//           <Button
//             type="button"
//             variant="outline"
//             size="sm"
//             onClick={() => onDelete(item)}
//             className="text-destructive hover:bg-destructive hover:border-destructive h-8 w-8 bg-transparent p-0 transition-colors hover:text-white sm:flex-none"
//           >
//             <Trash2 className="h-3.5 w-3.5" />
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/price";
import { cn } from "@/lib/utils";
import { ProductMaterial } from "@/types/materialProduct";
import { Palette, Pencil, Trash2, Box } from "lucide-react";
import {
  formatMaterialCategory,
  toCloudinaryThumbUrl,
} from "./materialHelpers";
import { MaterialPreview } from "./MaterialPreview";

type MaterialCardProps = {
  item: ProductMaterial;
  viewMode: "grid" | "list";
  onEdit: (id: string) => void;
  onDelete: (material: ProductMaterial) => void;
};

// --- Dashboard Style Badges ---
const BADGE_BASE =
  "h-4 px-1.5 py-0 text-[9px] font-bold uppercase border rounded-md shadow-none";
const ACTIVE_CLASS = "bg-emerald-50 border-emerald-200 text-emerald-600";
const INACTIVE_CLASS = "bg-zinc-50 border-zinc-200 text-zinc-500";

export function MaterialCard({
  item,
  viewMode,
  onEdit,
  onDelete,
}: MaterialCardProps) {
  if (viewMode === "grid") {
    return (
      <div className="group bg-card border-border/60 hover:border-primary/40 flex flex-col overflow-hidden rounded-xl border shadow-sm transition-colors">
        {/* Image / Preview */}
        <div className="relative">
          <MaterialPreview
            candidates={[
              toCloudinaryThumbUrl(item.materialUrl),
              item.materialUrl,
            ]}
            name={item.materialName}
          />
          {/* Subtle Bottom Overlay */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t from-black/5 to-transparent" />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-3">
          {/* Header: Name & Price */}
          <div className="mb-2 space-y-0.5">
            <div className="flex items-start gap-1.5">
              <Palette className="text-muted-foreground/50 mt-0.5 h-3 w-3 shrink-0" />
              <h3 className="text-foreground line-clamp-1 text-xs font-bold tracking-tight">
                {item.materialName}
              </h3>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-muted-foreground/60 text-[9px] font-bold tracking-tighter uppercase">
                {formatMaterialCategory(item)}
              </p>
              <p className="text-foreground text-[13px] font-black tracking-tight tabular-nums">
                {item.price != null ? formatPrice(item.price) : "-"}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-3 flex">
            <Badge
              variant="outline"
              className={cn(
                BADGE_BASE,
                item.isActive ? ACTIVE_CLASS : INACTIVE_CLASS,
              )}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Action Row */}
          <div className="mt-auto flex gap-1.5 border-t pt-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onEdit(item.id)}
              className="h-7 flex-1 rounded-md text-[10px] font-bold transition-colors"
            >
              <Pencil className="mr-1.5 h-3 w-3" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDelete(item)}
              className="text-destructive hover:bg-destructive/10 border-destructive/20 h-7 w-7 rounded-md p-0 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- List View Mode ---
  return (
    <div className="group bg-card border-border/60 hover:border-primary/40 flex flex-row items-center gap-4 rounded-xl border p-2 shadow-sm transition-colors">
      {/* Thumbnail */}
      <div className="shrink-0 overflow-hidden rounded-lg border">
        <MaterialPreview
          list
          candidates={[
            toCloudinaryThumbUrl(item.materialUrl),
            item.materialUrl,
          ]}
          name={item.materialName}
        />
      </div>

      {/* Info Container */}
      <div className="flex min-w-0 flex-1 items-center justify-between pr-2">
        <div className="min-w-0">
          <h3 className="text-foreground truncate text-sm font-bold tracking-tight">
            {item.materialName}
          </h3>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-muted-foreground text-[10px] font-bold tracking-wide uppercase">
              {formatMaterialCategory(item)}
            </span>
            <span className="text-border">·</span>
            <span className="text-primary text-xs font-black">
              {item.price != null ? formatPrice(item.price) : "-"}
            </span>
          </div>
        </div>

        {/* Status & Actions Group */}
        <div className="ml-4 flex items-center gap-3">
          <div className="hidden md:flex">
            <Badge
              variant="outline"
              className={cn(
                BADGE_BASE,
                item.isActive ? ACTIVE_CLASS : INACTIVE_CLASS,
              )}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 border-l pl-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onEdit(item.id)}
              className="h-8 rounded-lg px-3 text-xs font-bold"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDelete(item)}
              className="text-destructive hover:bg-destructive/10 border-destructive/20 h-8 w-8 rounded-lg p-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
