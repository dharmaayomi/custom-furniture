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
import { useState } from "react";

export const TrialPage = () => {
  const [selectedTool, setSelectedTool] = useState<TrialToolType>(null);
  const [activePanel, setActivePanel] = useState<TrialActivePanel>(null);
  const isAnyPanelOpen = activePanel !== null;

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
      id: "furniture",
      icon: Package,
      label: "Furniture",
      category: "Furniture",
    },
    {
      id: "tambahan",
      icon: LayoutTemplate,
      label: "Tambahan",
      category: "Struktur",
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
      <RightPanelDrawer
        open={isAnyPanelOpen}
        selectedTool={selectedTool}
        tools={tools}
        onOpenChange={(open) => {
          if (!open) {
            closePanel();
          }
        }}
      />
    </div>
  );
};
