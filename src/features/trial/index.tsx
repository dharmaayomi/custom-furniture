"use client";

import {
  DoorClosed,
  Grid,
  LampFloor,
  LayoutTemplate,
  Package,
  PaintBucket,
} from "lucide-react";
import { TrialRoomCanvas } from "./TrialRoomCanvas";
import {
  RightPanel,
  TrialActivePanel,
  TrialTool,
  TrialToolType,
} from "./components/RightPanel";
import { RightPanelDrawer } from "./components/RightPanelDrawer";
import { TrialHeader } from "./components/TrialHeader";
import { TrialFooter } from "./components/TrialFooter";
import { TrialCustomizeDrawer } from "./components/TrialCustomizeDrawer";
import { useState } from "react";

export const TrialPage = () => {
  const [selectedTool, setSelectedTool] = useState<TrialToolType>(null);
  const [activePanel, setActivePanel] = useState<TrialActivePanel>(null);
  const isAnyPanelOpen = activePanel !== null;
  const isSidebarPanelOpen = activePanel === "sidebar";
  const isCustomizePanelOpen = activePanel === "customize";

  const handleToolClick = (toolId: TrialToolType) => {
    if (activePanel === "sidebar" && selectedTool === toolId) {
      closePanel();
    } else {
      setSelectedTool(toolId);
      openPanel("sidebar");
    }
  };
  const openPanel = (panel: TrialActivePanel) => {
    setActivePanel(panel);
  };
  const closePanel = () => {
    setActivePanel(null);
    setSelectedTool(null);
  };
  const handleCustomizeClick = () => {
    openPanel("customize");
  };
  const tools: TrialTool[] = [
    {
      id: "frame",
      icon: Package,
      label: "Frame Lemari",
      category: "Product Base",
    },
    {
      id: "interior",
      icon: LayoutTemplate,
      label: "Interior Lemari",
      category: "Product Component",
    },
    {
      id: "material",
      icon: PaintBucket,
      label: "Material",
      category: "Material",
    },
    {
      id: "lighting",
      icon: LampFloor,
      label: "Pencahayaan",
      category: "Pencahayaan",
    },
  ];
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      <div
        className={`relative min-w-0 flex-1 bg-gray-200 ${isAnyPanelOpen ? "mr-4" : ""}`}
      >
        <TrialHeader />
        <RightPanel
          tools={tools}
          selectedTool={selectedTool}
          onToolClick={handleToolClick}
          isSidebarOpen={isAnyPanelOpen}
          onCustomizeClick={handleCustomizeClick}
        />
        <div className="relative h-screen flex-1">
          <TrialRoomCanvas />
        </div>
        <TrialFooter />
      </div>
      {isSidebarPanelOpen ? (
        <RightPanelDrawer
          open={isSidebarPanelOpen}
          selectedTool={selectedTool}
          tools={tools}
          onOpenChange={(open) => {
            if (!open) {
              closePanel();
            }
          }}
        />
      ) : (
        <TrialCustomizeDrawer
          open={isCustomizePanelOpen}
          onOpenChange={(open) => {
            if (!open) {
              closePanel();
            }
          }}
        />
      )}
    </div>
  );
};
