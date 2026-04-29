import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Columns2,
  Copy,
  CornerUpLeft,
  CornerUpRight,
  Home,
  Info,
  Moon,
  Ruler,
  Trash2,
} from "lucide-react";
import { useTheme } from "next-themes";

interface TrialFooterProps {
  hasSelection: boolean;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onViewSelectedDetails: () => void;
}

export const TrialFooter = ({
  hasSelection,
  onDeleteSelected,
  onDuplicateSelected,
  onViewSelectedDetails,
}: TrialFooterProps) => {
  const { theme, setTheme } = useTheme();
  const selectionActions = [
    {
      icon: Trash2,
      label: "Delete item",
      onClick: onDeleteSelected,
    },
    {
      icon: Copy,
      label: "Duplicate item",
      onClick: onDuplicateSelected,
    },
    {
      icon: Info,
      label: "View details",
      onClick: onViewSelectedDetails,
    },
  ];

  return (
    // LEFT
    <TooltipProvider>
      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-5 px-3 pb-4 md:px-8">
        <div className="relative mx-auto flex w-full items-end justify-between gap-3">
          <div className="bg-primary/10 pointer-events-none absolute bottom-0 left-12 h-24 w-24 rounded-full blur-3xl" />
          <div className="bg-primary/10 pointer-events-none absolute right-16 bottom-2 h-28 w-28 rounded-full blur-3xl" />

          <div className="pointer-events-auto relative flex flex-col items-center gap-2 rounded-[1.75rem] border border-white/60 bg-white/55 p-2 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
            <div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 rounded-2xl border-white/50 bg-white/70 shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
                title="Toggle theme"
              >
                <Moon className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>

            <div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 rounded-2xl border-white/50 bg-white/70 shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                aria-label="Layout"
              >
                <Columns2 className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>

            <div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 rounded-2xl border-white/50 bg-white/70 shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                aria-label="Measure"
              >
                <Ruler className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>

          {/* MIDDLE */}
          {hasSelection ? (
            <div className="pointer-events-auto relative flex items-center gap-2 rounded-[1.75rem] border border-white/60 bg-white/55 p-2 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
              {selectionActions.map(({ icon: Icon, label, onClick }) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      className="shadow-primary/20 size-9 rounded-2xl shadow-lg"
                      aria-label={label}
                      onClick={onClick}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {/* RIGHT */}

          <div className="flex items-center gap-3">
            <div className="pointer-events-auto relative flex items-center gap-2 rounded-[1.75rem] border border-white/60 bg-white/55 p-2 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-2xl border-white/50 bg-white/70 shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    aria-label="Undo"
                  >
                    <CornerUpLeft className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Undo</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-2xl border-white/50 bg-white/70 shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    aria-label="Redo"
                  >
                    <CornerUpRight className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Redo</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </footer>
    </TooltipProvider>
  );
};
