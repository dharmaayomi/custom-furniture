"use client";

import Image from "next/image";
import { Eye, Grip, X } from "lucide-react";
import type { DragEvent, KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/useMobile";
import { formatPrice } from "@/lib/price";

import { TrialTool, TrialToolType } from "./RightPanel";
import {
  getTrialAssetsByCategory,
  TRIAL_ASSET_DRAG_TYPE,
  TrialAssetCategory,
  TrialAssetItem,
} from "../trialAssetCatalog";
import { useTrialRoomStore } from "../store/useTrialRoomStore";

interface RightPanelDrawerProps {
  open: boolean;
  selectedTool: TrialToolType;
  tools: TrialTool[];
  onOpenChange: (open: boolean) => void;
}

const getDrawerCategory = (
  selectedTool: TrialToolType,
): TrialAssetCategory | null => {
  if (
    selectedTool === "frame" ||
    selectedTool === "interior" ||
    selectedTool === "material"
  ) {
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
  const isMobile = useIsMobile();
  const hasFrameProduct = useTrialRoomStore((state) => state.hasFrameProduct);
  const requestAssetSpawn = useTrialRoomStore(
    (state) => state.requestAssetSpawn,
  );

  const selectedToolData = tools.find((tool) => tool.id === selectedTool);
  const assetCategory = getDrawerCategory(selectedTool);
  const cards = assetCategory ? getTrialAssetsByCategory(assetCategory) : [];

  // Step 1:
  // Clicking a card uses the default spawn flow.
  // Frame Lemari goes to the back wall, while Interior Lemari attaches to the selected frame.
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

  const content = (
    <>
      <div className="bg-primary/10 pointer-events-none absolute top-10 right-8 h-28 w-28 rounded-full blur-3xl" />
      <div className="bg-primary/10 pointer-events-none absolute bottom-12 left-6 h-24 w-24 rounded-full blur-3xl" />

      <div className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
        {isMobile ? (
          <DrawerHeader className="border-b border-white/60 px-4 pt-3 pb-4 dark:border-white/10">
            <div className="flex items-start justify-between gap-3 text-left">
              <div className="space-y-1">
                <DrawerTitle className="text-xl font-black">
                  {selectedToolData?.label ?? "Customize Room"}
                </DrawerTitle>
                <p className="text-muted-foreground text-xs">
                  {cards.length} items available
                </p>
              </div>

              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-2xl border-white/50 bg-white/70 shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  aria-label="Close right panel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
        ) : (
          <div className="flex items-start justify-between gap-3 border-b border-white/60 px-7 pt-7 pb-4 dark:border-white/10">
            <div className="space-y-2">
              <div className="text-xl font-black">
                {selectedToolData?.label ?? "Customize Room"}
              </div>
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
        )}

        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5">
          {cards.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {cards.map((card) => {
                const isDisabled =
                  card.category === "material" ||
                  (card.category === "interior" && !hasFrameProduct);

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
              Frame Lemari and Interior Lemari.
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
        <DrawerContent className="max-h-[82vh] rounded-t-[1.75rem] border-t border-white/60 bg-white/90 text-slate-950 shadow-[0_-20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/92 dark:text-slate-50">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div
      className={`relative z-20 overflow-hidden rounded-l-xl border-l border-white/60 bg-white/80 text-slate-950 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-[width,opacity,margin] duration-300 dark:border-white/10 dark:bg-slate-950 dark:text-slate-50 ${
        open ? "-ml-6 w-[min(92vw,408px)] opacity-100" : "ml-0 w-0 opacity-0"
      }`}
      aria-hidden={!open}
    >
      <div
        className={`h-full min-h-0 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div className="h-full min-h-0 w-102">{content}</div>
      </div>
    </div>
  );
};
