import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Wrench } from "lucide-react";
import React from "react";

export type TrialToolType =
  | "paint"
  | "lighting"
  | "grid"
  | "furniture"
  | "tambahan"
  | "material"
  | "chair"
  | "door"
  | null;

export interface TrialTool {
  id: TrialToolType;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  category: string;
}

export type TrialActivePanel =
  | "sidebar"
  | "productList"
  | "customize"
  | "home"
  | "productInfo"
  | null;
interface RightPanelProps {
  tools: TrialTool[];
  selectedTool: TrialToolType;
  onToolClick: (toolId: TrialToolType) => void;
  isSidebarOpen: boolean;

  onCustomizeClick: () => void;
}
export const RightPanel = ({
  tools,
  selectedTool,
  onToolClick,
  isSidebarOpen,
  onCustomizeClick,
}: RightPanelProps) => {
  return (
    <TooltipProvider>
      <div
        className="absolute top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-3"
        style={{
          right: isSidebarOpen ? "2.5rem" : "2rem",
        }}
      >
        <div className="bg-primary/10 pointer-events-none absolute -top-8 -right-3 h-24 w-24 rounded-full blur-3xl" />

        <div className="pointer-events-auto flex flex-col items-center gap-2 rounded-[1.75rem] border border-white/60 bg-white/55 p-2 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          {tools.map((tool, index) => {
            const Icon = tool.icon;

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={selectedTool === tool.id ? "default" : "outline"}
                    onClick={() => onToolClick(tool.id)}
                    className={`size-9 rounded-2xl transition-all ${
                      selectedTool === tool.id
                        ? "shadow-primary/20 border-transparent shadow-lg"
                        : "border-white/50 bg-white/70 shadow-none hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    }`}
                    size="icon"
                  >
                    <Icon size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{tool.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <div className="pointer-events-auto rounded-[1.75rem] border border-white/60 bg-white/55 p-2 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                onClick={onCustomizeClick}
                className="shadow-chart-2/20 bg-chart-2 size-9 rounded-2xl shadow-lg"
                size="icon"
              >
                <Wrench size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Customize Room</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};
