"use client";

import Image from "next/image";
import { Home, PaintBucket, Ruler, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/useMobile";
import {
  TRIAL_FLOOR_TEXTURE_OPTIONS,
  TRIAL_WALL_COLOR_OPTIONS,
} from "../core/TrialConfig";
import { useTrialRoomStore } from "../store/useTrialRoomStore";

interface TrialCustomizeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const preloadTexture = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve();
    image.onerror = () =>
      reject(new Error(`Failed to preload texture: ${src}`));
    image.src = src;
  });

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const TrialCustomizeDrawer = ({
  open,
  onOpenChange,
}: TrialCustomizeDrawerProps) => {
  const isMobile = useIsMobile();
  const draftRoomConfig = useTrialRoomStore((state) => state.draftRoomConfig);
  const appliedRoomConfig = useTrialRoomStore(
    (state) => state.appliedRoomConfig,
  );
  const setDraftRoomConfig = useTrialRoomStore(
    (state) => state.setDraftRoomConfig,
  );
  const setAppliedRoomConfig = useTrialRoomStore(
    (state) => state.setAppliedRoomConfig,
  );

  const [contentReady, setContentReady] = useState(false);
  const [widthInput, setWidthInput] = useState(
    draftRoomConfig.width.toFixed(1),
  );
  const [depthInput, setDepthInput] = useState(
    draftRoomConfig.depth.toFixed(1),
  );
  const [heightInput, setHeightInput] = useState(
    draftRoomConfig.height.toFixed(1),
  );

  useEffect(() => {
    void Promise.allSettled(
      TRIAL_FLOOR_TEXTURE_OPTIONS.map((texture) =>
        preloadTexture(texture.path),
      ),
    );
  }, []);

  useEffect(() => {
    if (!open) {
      setContentReady(false);
      return;
    }

    if (isMobile) {
      setContentReady(true);
      return;
    }

    // Step 1:
    // Reserve the drawer width first so the canvas can resize before the panel content appears.
    const timeoutId = window.setTimeout(() => {
      setContentReady(true);
    }, 140);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isMobile, open]);

  useEffect(() => {
    setWidthInput(draftRoomConfig.width.toFixed(1));
    setDepthInput(draftRoomConfig.depth.toFixed(1));
    setHeightInput(draftRoomConfig.height.toFixed(1));
  }, [draftRoomConfig.width, draftRoomConfig.depth, draftRoomConfig.height]);

  useEffect(() => {
    let cancelled = false;

    // Step 2:
    // Debounce the scene update so the room only rebuilds after the user pauses input.
    const timeoutId = window.setTimeout(async () => {
      if (draftRoomConfig.floorTexture !== appliedRoomConfig.floorTexture) {
        try {
          await preloadTexture(draftRoomConfig.floorTexture);
        } catch (error) {
          console.error(error);
          return;
        }
      }

      if (cancelled) {
        return;
      }

      setAppliedRoomConfig({ ...draftRoomConfig });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [appliedRoomConfig.floorTexture, draftRoomConfig, setAppliedRoomConfig]);

  const updateDimensionInput = (
    rawValue: string,
    key: "width" | "depth" | "height",
    min: number,
    max: number,
  ) => {
    const parsed = Number.parseFloat(rawValue);
    if (Number.isNaN(parsed)) {
      return;
    }

    setDraftRoomConfig({
      [key]: clamp(parsed, min, max),
    });
  };

  const content = (
    <>
      <div className="bg-primary/10 pointer-events-none absolute top-10 right-8 h-28 w-28 rounded-full blur-3xl" />
      <div className="bg-primary/10 pointer-events-none absolute bottom-12 left-6 h-24 w-24 rounded-full blur-3xl" />

      <div className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
        {isMobile ? (
          <DrawerHeader className="border-b border-white/60 px-4 pt-3 pb-4 dark:border-white/10">
            <div className="flex items-start justify-between gap-3 text-left">
              <div className="space-y-3">
                <Badge
                  variant="secondary"
                  className="border-primary/40 text-primary rounded-full border bg-white/20 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase dark:border-white/10 dark:bg-white/5"
                >
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  Customize Room
                </Badge>

                <div className="space-y-1">
                  <DrawerTitle className="text-xl font-black">
                    Pengaturan Ruangan
                  </DrawerTitle>
                  <p className="text-muted-foreground max-w-sm text-xs leading-6">
                    Atur ukuran, warna dinding, dan lantai agar sesuai dengan
                    ruangan Anda di dunia nyata.
                  </p>
                </div>
              </div>

              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-2xl border-white/50 bg-white/70 shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  aria-label="Close customize panel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
        ) : (
          <div className="flex items-start justify-between gap-3 border-b border-white/60 px-7 pt-7 pb-4 dark:border-white/10">
            <div className="space-y-3">
              <Badge
                variant="secondary"
                className="border-primary/40 text-primary rounded-full border bg-white/20 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase dark:border-white/10 dark:bg-white/5"
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Customize Room
              </Badge>

              <div className="space-y-1">
                <div className="text-xl font-black">Pengaturan Ruangan</div>
                <p className="text-muted-foreground max-w-sm text-xs leading-6">
                  Atur ukuran, warna dinding, dan lantai agar sesuai dengan
                  ruangan Anda di dunia nyata.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="size-9 rounded-2xl border-white/50 bg-white/70 shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              aria-label="Close customize panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5">
          <div className="space-y-4">
            <section className="rounded-[1.5rem] border border-white/60 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl border border-white/60 bg-white/75 p-2 dark:border-white/10 dark:bg-slate-950/65">
                  <Ruler className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black">Ukuran Ruangan</h3>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">Width</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={4}
                      max={10}
                      step={0.1}
                      value={widthInput}
                      onChange={(event) => {
                        setWidthInput(event.target.value);
                        updateDimensionInput(
                          event.target.value,
                          "width",
                          4,
                          10,
                        );
                      }}
                      className="h-9 w-24 rounded-xl border-white/50 bg-white/70 text-right dark:border-white/10 dark:bg-white/5"
                    />
                  </div>
                  <Slider
                    value={[draftRoomConfig.width]}
                    min={4}
                    max={10}
                    step={0.1}
                    onValueChange={([value]) => {
                      setDraftRoomConfig({ width: value });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">Depth</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={4}
                      max={10}
                      step={0.1}
                      value={depthInput}
                      onChange={(event) => {
                        setDepthInput(event.target.value);
                        updateDimensionInput(
                          event.target.value,
                          "depth",
                          4,
                          10,
                        );
                      }}
                      className="h-9 w-24 rounded-xl border-white/50 bg-white/70 text-right dark:border-white/10 dark:bg-white/5"
                    />
                  </div>
                  <Slider
                    value={[draftRoomConfig.depth]}
                    min={4}
                    max={10}
                    step={0.1}
                    onValueChange={([value]) => {
                      setDraftRoomConfig({ depth: value });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">Height</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={2.6}
                      max={4.2}
                      step={0.1}
                      value={heightInput}
                      onChange={(event) => {
                        setHeightInput(event.target.value);
                        updateDimensionInput(
                          event.target.value,
                          "height",
                          2.6,
                          4.2,
                        );
                      }}
                      className="h-9 w-24 rounded-xl border-white/50 bg-white/70 text-right dark:border-white/10 dark:bg-white/5"
                    />
                  </div>
                  <Slider
                    value={[draftRoomConfig.height]}
                    min={2.6}
                    max={4.2}
                    step={0.1}
                    onValueChange={([value]) => {
                      setDraftRoomConfig({ height: value });
                    }}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-white/60 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl border border-white/60 bg-white/75 p-2 dark:border-white/10 dark:bg-slate-950/65">
                  <PaintBucket className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black">Warna Tembok</h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={draftRoomConfig.wallColor}
                  onChange={(event) => {
                    setDraftRoomConfig({ wallColor: event.target.value });
                  }}
                  className="h-12 w-12 cursor-pointer rounded-xl border-white/50 bg-white/70 p-1 dark:border-white/10 dark:bg-white/5"
                />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Selected
                  </p>
                  <p className="font-mono text-sm">
                    {draftRoomConfig.wallColor}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-6 gap-2">
                {TRIAL_WALL_COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setDraftRoomConfig({ wallColor: color });
                    }}
                    className={`h-9 rounded-xl border transition ${
                      draftRoomConfig.wallColor === color
                        ? "border-slate-900 ring-2 ring-slate-900/15 dark:border-white dark:ring-white/20"
                        : "border-white/60 dark:border-white/10"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select wall color ${color}`}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-white/60 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl border border-white/60 bg-white/75 p-2 dark:border-white/10 dark:bg-slate-950/65">
                  <Home className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black">Lantai</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {TRIAL_FLOOR_TEXTURE_OPTIONS.map((texture) => (
                  <button
                    key={texture.path}
                    type="button"
                    onClick={() => {
                      setDraftRoomConfig({ floorTexture: texture.path });
                    }}
                    className={`overflow-hidden rounded-4xl border p-1 text-left transition ${
                      draftRoomConfig.floorTexture === texture.path
                        ? "border-slate-900 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.5)] dark:border-white"
                        : "border-white/60 dark:border-white/10"
                    }`}
                  >
                    <div className="relative h-20 overflow-hidden rounded-xl">
                      <Image
                        src={texture.path}
                        alt={texture.name}
                        fill
                        sizes="180px"
                        className="object-cover"
                      />
                    </div>
                    <p className="px-2 pt-2 pb-1 text-xs font-semibold">
                      {texture.name}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          </div>
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
      className={`relative z-20 overflow-hidden rounded-l-xl border-l border-white/60 bg-white/80 text-slate-950 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-[opacity,margin] duration-200 dark:border-white/10 dark:bg-slate-950/85 dark:text-slate-50 ${
        open ? "-ml-6 w-[min(92vw,408px)] opacity-100" : "ml-0 w-0 opacity-0"
      }`}
      aria-hidden={!open}
    >
      <div
        className={`h-full transition-opacity duration-200 ${
          open && contentReady
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div className="h-full min-h-0 w-102">{content}</div>
      </div>
    </div>
  );
};
