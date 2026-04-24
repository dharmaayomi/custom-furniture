import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/price";
import { ListOrdered, MoveRight, Save } from "lucide-react";
import { calculateTrialTotalPrice } from "../trialPrice";
import { useTrialRoomStore } from "../useTrialRoomStore";
import { MenuDrawer } from "./MenuDrawer";

export const TrialHeader = () => {
  const activeFrameProductId = useTrialRoomStore(
    (state) => state.activeFrameProductId,
  );
  const activeInteriorProductIds = useTrialRoomStore(
    (state) => state.activeInteriorProductIds,
  );
  const activeMaterialProductIds = useTrialRoomStore(
    (state) => state.activeMaterialProductIds,
  );

  const totalPrice = calculateTrialTotalPrice(
    activeFrameProductId ? [activeFrameProductId] : [],
    activeInteriorProductIds,
    activeMaterialProductIds,
  );

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-5 px-4 pt-4 sm:px-6 md:px-8">
      <div className="relative mx-auto flex w-full items-start justify-between gap-3">
        <div className="bg-primary/10 pointer-events-none absolute -top-6 left-20 h-24 w-24 rounded-full blur-3xl" />
        <div className="bg-primary/10 pointer-events-none absolute top-0 right-12 h-28 w-28 rounded-full blur-3xl" />

        <div className="pointer-events-auto relative flex items-center gap-2 rounded-[1.75rem] border border-white/60 bg-white/75 p-2 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <MenuDrawer />

          <Button
            id="header-save-button"
            name="header-save"
            type="button"
            variant="outline"
            className="hidden size-9 rounded-2xl border-white/50 bg-white/60 px-4 text-sm font-semibold shadow-none hover:bg-white md:inline-flex dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>

        <div className="pointer-events-auto relative flex items-center gap-2 rounded-[1.75rem] border border-white/60 bg-white/75 p-2 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-2xl border-white/50 bg-white/70 shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="from-background/95 to-background/70 border-border/60 flex h-11 items-center gap-3 rounded-2xl border bg-linear-to-r px-3 shadow-none sm:px-4 dark:from-slate-950/50 dark:to-slate-950/40">
            <div className="min-w-0">
              <div className="text-foreground text-sm font-black sm:text-base">
                {formatPrice(totalPrice)}
              </div>
            </div>
          </div>

          <Button
            type="button"
            className="group shadow-primary/20 rounded-2xl px-3 text-sm font-bold shadow-lg sm:px-5"
          >
            <span className="hidden sm:inline">Summary</span>
            <MoveRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
