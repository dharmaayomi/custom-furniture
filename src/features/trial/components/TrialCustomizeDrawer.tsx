"use client";

import { Home, Layers3, Move3D, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TrialCustomizeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const customizeSections = [
  {
    title: "Room Preset",
    description:
      "Quick entry point for switching the room mood before the detailed controls exist.",
    icon: Home,
  },
  {
    title: "Layout Control",
    description:
      "Reserve this section for wall, floor, and room dimension actions later.",
    icon: Layers3,
  },
  {
    title: "Object Transform",
    description:
      "This block can later host align, rotate, and snap actions for the active item.",
    icon: Move3D,
  },
];

export const TrialCustomizeDrawer = ({
  open,
  onOpenChange,
}: TrialCustomizeDrawerProps) => {
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
            <div className="space-y-3">
              <Badge variant="outline">
                <Sparkles className="h-3.5 w-3.5" />
                Customize Room
              </Badge>

              <div className="space-y-1">
                <div className="text-xl font-black">Trial Customize</div>
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

          <div className="relative flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-3">
              {customizeSections.map(({ title, description, icon: Icon }) => (
                <section
                  key={title}
                  className="rounded-[1.5rem] border border-white/60 bg-white/65 p-4 shadow-none dark:border-white/10 dark:bg-white/5"
                >
                  <div className="mb-3 inline-flex rounded-2xl border border-white/60 bg-white/75 p-2 text-slate-700 dark:border-white/10 dark:bg-slate-950/65 dark:text-slate-200">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-black">{title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {description}
                  </p>
                </section>
              ))}
            </div>
          </div>

          <div className="border-t border-white/60 px-5 py-4 dark:border-white/10">
            <div className="rounded-[1.5rem] border border-white/60 bg-white/65 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-semibold">Next step</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Once this flow is approved, each section can be replaced with
                the real customize controls.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
