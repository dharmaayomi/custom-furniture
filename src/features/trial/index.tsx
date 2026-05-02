"use client";

import { LampFloor, LayoutTemplate, Package, PaintBucket } from "lucide-react";
import { TrialRoomCanvas } from "./TrialRoomCanvas";
import { RightPanel, TrialTool, TrialToolType } from "./components/RightPanel";
import { RightPanelDrawer } from "./components/RightPanelDrawer";
import { TrialHeader } from "./components/TrialHeader";
import { TrialFooter } from "./components/TrialFooter";
import { TrialCustomizeDrawer } from "./components/TrialCustomizeDrawer";
import { useMemo, useState } from "react";
import { useTrialRoomStore } from "./store/useTrialRoomStore";
import { TrialProductInfo } from "./components/TrialProductInfo";
import { TrialProductList } from "./components/TrialProductList";
import { useIsMobile } from "@/hooks/useMobile";

type TrialSidePanel = "sidebar" | "customize" | null;
type TrialOverlayDrawer = "productInfo" | "productList" | null;

export const TrialPage = () => {
  const isMobile = useIsMobile();
  const [selectedTool, setSelectedTool] = useState<TrialToolType>(null);
  const [activeSidePanel, setActiveSidePanel] = useState<TrialSidePanel>(null);
  const [activeOverlayDrawer, setActiveOverlayDrawer] =
    useState<TrialOverlayDrawer>(null);
  const isAnyLayoutPanelOpen = activeSidePanel !== null;
  const isSidebarPanelOpen = activeSidePanel === "sidebar";
  const isCustomizePanelOpen = activeSidePanel === "customize";
  const isProductListPanelOpen = activeOverlayDrawer === "productList";
  const isProductInfoPanelOpen = activeOverlayDrawer === "productInfo";
  const loadedModels = useTrialRoomStore((state) => state.loadedModels);
  const selectedInstanceId = useTrialRoomStore(
    (state) => state.selectedMeshName,
  );
  const requestSelectionAction = useTrialRoomStore(
    (state) => state.requestSelectionAction,
  );
  const selectedModel = useMemo(
    () =>
      loadedModels.find((model) => model.instanceId === selectedInstanceId) ??
      null,
    [loadedModels, selectedInstanceId],
  );
  const hasSelection = selectedModel !== null;

  const handleToolClick = (toolId: TrialToolType) => {
    if (activeSidePanel === "sidebar" && selectedTool === toolId) {
      closeSidePanel();
    } else {
      setSelectedTool(toolId);
      openSidePanel("sidebar");
    }
  };
  const openSidePanel = (panel: Exclude<TrialSidePanel, null>) => {
    setActiveSidePanel(panel);
  };
  const closeSidePanel = () => {
    setActiveSidePanel(null);
    setSelectedTool(null);
  };
  const handleCustomizeClick = () => {
    openSidePanel("customize");
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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
      <div
        className={`relative min-w-0 flex-1 bg-slate-200 transition-colors dark:bg-slate-900 ${
          isAnyLayoutPanelOpen && !isMobile ? "mr-4" : ""
        }`}
      >
        <TrialHeader
          onOpenProductList={() => {
            setActiveOverlayDrawer("productList");
          }}
        />
        <RightPanel
          tools={tools}
          selectedTool={selectedTool}
          onToolClick={handleToolClick}
          isSidebarOpen={isAnyLayoutPanelOpen}
          onCustomizeClick={handleCustomizeClick}
        />
        <div className="relative h-screen flex-1">
          <TrialRoomCanvas />
        </div>
        <TrialFooter
          hasSelection={hasSelection}
          onDeleteSelected={() => {
            if (!selectedModel) {
              return;
            }

            requestSelectionAction("delete", selectedModel.instanceId);
          }}
          onDuplicateSelected={() => {
            if (!selectedModel) {
              return;
            }

            requestSelectionAction("duplicate", selectedModel.instanceId);
          }}
          onViewSelectedDetails={() => {
            if (!selectedModel) {
              return;
            }

            setActiveOverlayDrawer("productInfo");
          }}
        />
      </div>
      {isSidebarPanelOpen ? (
        <RightPanelDrawer
          open={isSidebarPanelOpen}
          selectedTool={selectedTool}
          tools={tools}
          onOpenChange={(open) => {
            if (!open) {
              closeSidePanel();
            }
          }}
        />
      ) : (
        <TrialCustomizeDrawer
          open={isCustomizePanelOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeSidePanel();
            }
          }}
        />
      )}
      <TrialProductInfo
        open={isProductInfoPanelOpen}
        selectedModel={selectedModel}
        onOpenChange={(open) => {
          setActiveOverlayDrawer(open ? "productInfo" : null);
        }}
      />
      <TrialProductList
        open={isProductListPanelOpen}
        onOpenChange={(open) => {
          setActiveOverlayDrawer(open ? "productList" : null);
        }}
      />
    </div>
  );
};
