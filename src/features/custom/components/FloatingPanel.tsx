import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tool, ToolType } from "@/types/toolType";
import { Home, Wrench } from "lucide-react";
import { useState } from "react";

interface FloatingToolPanelProps {
  tools: Tool[];
  selectedTool: ToolType;
  showHomeSidebar: boolean;
  isSidebarOpen: boolean;
  onToolClick: (toolId: ToolType) => void;
  onHomeClick: () => void;
  onCustomizeClick: () => void;
}

export const FloatingToolPanel = ({
  tools,
  selectedTool,
  showHomeSidebar,
  isSidebarOpen,
  onToolClick,
  onHomeClick,
  onCustomizeClick,
}: FloatingToolPanelProps) => {
  const [previousState, setPreviousState] = useState(null);

  return (
    <TooltipProvider>
      <div
        // className="pointer-events-auto absolute top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-3 transition-all duration-500 ease-in-out"
        className="pointer-events-auto absolute top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-3"
        style={{
          right: isSidebarOpen || showHomeSidebar ? " 2rem" : "2rem",
        }}
      >
        {/* Home Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onHomeClick}
              // className={`shadow-lg transition-all ${
              className={`shadow-lg ${
                showHomeSidebar
                  ? "bg-white text-black hover:bg-white hover:text-black"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
              size="icon"
            >
              <Home size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Home</p>
          </TooltipContent>
        </Tooltip>

        {/* Tool Group */}
        <div className="flex flex-col overflow-hidden rounded-sm bg-slate-900 shadow-lg">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onToolClick(tool.id)}
                    className={`rounded-none border-none transition-all ${
                      selectedTool === tool.id
                        ? "bg-white text-black hover:bg-white hover:text-black"
                        : "bg-slate-900 text-white hover:bg-slate-800"
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

        {/* customize room */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onCustomizeClick}
              className="bg-slate-900 text-white shadow-lg hover:bg-slate-800"
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
    </TooltipProvider>
  );
};
