"use client";

import Image from "next/image";
import { Eye, Grip, X } from "lucide-react";
import type { DragEvent, KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { TrialTool, TrialToolType } from "./RightPanel";
import {
  getTrialAssetsByCategory,
  TRIAL_ASSET_DRAG_TYPE,
  TrialAssetCategory,
  TrialAssetItem,
} from "../trialAssetCatalog";
import { useTrialRoomStore } from "../useTrialRoomStore";

interface RightPanelDrawerProps {
  open: boolean;
  selectedTool: TrialToolType;
  tools: TrialTool[];
  onOpenChange: (open: boolean) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);

const getDrawerCategory = (
  selectedTool: TrialToolType,
): TrialAssetCategory | null => {
  if (selectedTool === "furniture" || selectedTool === "tambahan") {
    return selectedTool;
  }

  return null;
};

export const RightPanelDrawer = ({
  open,
  selectedTool,
  tools,
  onOpenChange,
}: RightPanelDrawerProps) => {
  const hasBaseFurniture = useTrialRoomStore((state) => state.hasBaseFurniture);
  const requestAssetSpawn = useTrialRoomStore(
    (state) => state.requestAssetSpawn,
  );

  const selectedToolData = tools.find((tool) => tool.id === selectedTool);
  const assetCategory = getDrawerCategory(selectedTool);
  const cards = assetCategory ? getTrialAssetsByCategory(assetCategory) : [];

  // Step 1:
  // Clicking a card uses the default spawn flow.
  // Furniture goes to the back wall, while tambahan attaches to the existing furniture.
  const handleCardClick = (card: TrialAssetItem, disabled: boolean) => {
    if (disabled) {
      return;
    }

    requestAssetSpawn(card.id, null);
  };

  // Step 2:
  // Dragging a card writes the asset id into the browser drag payload.
  // The canvas reads this same key when the user drops the card.
  const handleCardDragStart = (
    event: DragEvent<HTMLElement>,
    card: TrialAssetItem,
    disabled: boolean,
  ) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(TRIAL_ASSET_DRAG_TYPE, card.id);
    event.dataTransfer.setData("text/plain", card.id);
  };

  return (
    <div
      className={`relative z-20 overflow-hidden rounded-l-xl border-l border-white/60 bg-white/80 text-slate-950 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-[width,opacity,margin] duration-300 dark:border-white/10 dark:bg-slate-950/85 dark:text-slate-50 ${
        open ? "-ml-6 w-[min(92vw,408px)] opacity-100" : "ml-0 w-0 opacity-0"
      }`}
      aria-hidden={!open}
    >
      <div
        className={`h-full ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div className="bg-primary/10 pointer-events-none absolute top-10 right-8 h-28 w-28 rounded-full blur-3xl" />
        <div className="bg-primary/10 pointer-events-none absolute bottom-12 left-6 h-24 w-24 rounded-full blur-3xl" />

        <div className="relative flex h-full w-102 flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-white/60 px-7 pt-7 pb-4 dark:border-white/10">
            <div className="space-y-2">
              <div className="text-xl font-black">
                {selectedToolData?.label ?? "Customize Room"}
              </div>
              <p className="text-muted-foreground max-w-sm text-sm leading-6">
                Click a card to spawn it on the default position, or drag it
                into the canvas to place it there.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="size-9 rounded-2xl border-white/50 bg-white/70 shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              aria-label="Close right panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative flex-1 overflow-y-auto px-5 py-5">
            {cards.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {cards.map((card) => {
                  const isDisabled =
                    card.category === "tambahan" && !hasBaseFurniture;

                  return (
                    <article
                      key={card.id}
                      role="button"
                      tabIndex={isDisabled ? -1 : 0}
                      draggable={!isDisabled}
                      aria-disabled={isDisabled}
                      onClick={() => handleCardClick(card, isDisabled)}
                      onDragStart={(event) =>
                        handleCardDragStart(event, card, isDisabled)
                      }
                      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
                        if (isDisabled) {
                          return;
                        }

                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleCardClick(card, false);
                        }
                      }}
                      className={`overflow-hidden rounded-xl border border-white/60 bg-white/65 shadow-none transition hover:shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-white/5 ${
                        isDisabled
                          ? "cursor-not-allowed opacity-45"
                          : "cursor-pointer"
                      }`}
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <Image
                          src={card.image}
                          alt={card.name}
                          fill
                          sizes="(max-width: 768px) 44vw, 180px"
                          className="object-cover"
                        />
                        <div className="absolute top-2 right-2 rounded-full border border-white/60 bg-white/75 p-1.5 text-slate-700 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/65 dark:text-slate-200">
                          <Grip className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      <div className="space-y-2 p-3">
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {card.name}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {card.size}
                            </p>
                          </div>
                          <Eye className="text-muted-foreground/70 mt-0.5 h-4 w-4 shrink-0" />
                        </div>

                        <p className="text-sm font-bold">
                          {formatPrice(card.price)}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full min-h-56 items-center justify-center rounded-2xl border border-dashed border-white/60 bg-white/50 px-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                This tool is still empty. The spawn flow is currently wired for
                furniture and tambahan.
              </div>
            )}
          </div>

          <div className="border-t border-white/60 px-5 py-4 dark:border-white/10">
            <p className="text-muted-foreground text-sm">
              {assetCategory === "tambahan" && !hasBaseFurniture
                ? "Load one furniture item first before adding tambahan."
                : cards.length > 0
                  ? `${cards.length} items ready. Click to spawn or drag to place.`
                  : "Select furniture or tambahan to test the loading flow."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
