"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { FooterCustom } from "./FooterCustom";
import { HeaderCustom } from "./HeaderCustom";
import { RoomCanvas } from "./RoomCanvas";

import {
  Armchair,
  BedDouble,
  Grid,
  LayoutTemplate,
  PaintBucket,
  X,
} from "lucide-react";
import { FloatingToolPanel } from "./FloatingPanel";
import { SidebarPanel } from "./SidebarPanel";
import { MenuModal } from "./MenuModal";
import { Tool, ToolType } from "@/types/toolType";

export const RoomPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);
  const [showHomeSidebar, setShowHomeSidebar] = useState(false);
  const tools: Tool[] = [
    {
      id: "bed",
      icon: BedDouble,
      label: "Furniture Bed",
      category: "Furniture",
    },
    {
      id: "tambahan",
      icon: LayoutTemplate,
      label: "Tambahan",
      category: "Struktur",
    },
    {
      id: "chair",
      icon: Armchair,
      label: "Furniture Kursi",
      category: "Furniture",
    },
    {
      id: "paint",
      icon: PaintBucket,
      label: "Cat Dinding",
      category: "Finishing",
    },
    { id: "grid", icon: Grid, label: "Grid Lantai", category: "View" },
  ];

  const handleToolClick = (toolId: ToolType) => {
    if (showHomeSidebar) {
      setShowHomeSidebar(false);
    }

    if (selectedTool === toolId && isSidebarOpen) {
      setIsSidebarOpen(false);
      setSelectedTool(null);
    } else {
      setIsSidebarOpen(true);
      setSelectedTool(toolId);
    }
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedTool(null);
    setShowHomeSidebar(false);
  };

  const handleHomeClick = () => {
    setShowHomeSidebar(!showHomeSidebar);
    if (showHomeSidebar) {
      setIsSidebarOpen(false);
      setSelectedTool(null);
    } else {
      setIsSidebarOpen(false);
      setSelectedTool(null);
    }
  };
  const renderSidebarContent = () => {
    const tool = tools.find((t) => t.id === selectedTool);
    if (!tool) return null;

    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800">{tool.label}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeSidebar}
            className="hover:bg-gray-200"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">Kategori: {tool.category}</p>

          {/* Sample items - sesuaikan dengan kebutuhan */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="aspect-square cursor-pointer rounded-lg border-2 border-gray-200 bg-gray-100 transition-all hover:border-blue-500"
              >
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  Item {item}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-6">
            <h3 className="mb-3 font-medium">Filter</h3>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Option 1</span>
              </label>
              <label className="flex cursor-pointer items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Option 2</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isLoggedIn={false}
      />

      <div
        className="relative min-w-0 flex-1 bg-gray-200 transition-all duration-500 ease-in-out"
        style={{
          marginRight: isSidebarOpen || showHomeSidebar ? "320px" : "0",
        }}
      >
        {/* Header */}
        <div className="pointer-events-none absolute top-0 left-0 z-40 w-full">
          <div className="pointer-events-auto">
            <HeaderCustom onMenuClick={() => setIsMenuOpen(!isMenuOpen)} />
          </div>
        </div>

        {/* Header */}
        {/* <div className="pointer-events-none absolute top-0 left-0 z-40 w-full">
          <div className="pointer-events-auto">
            <HeaderCustom onMenuClick={() => setIsMenuOpen(!isMenuOpen)} />
          </div>
        </div> */}

        {/* Room Canvas */}
        <div className="relative h-screen flex-1">
          <RoomCanvas />
        </div>

        {/* floating tool panel */}
        <FloatingToolPanel
          tools={tools}
          selectedTool={selectedTool}
          showHomeSidebar={showHomeSidebar}
          isSidebarOpen={isSidebarOpen}
          onToolClick={handleToolClick}
          onHomeClick={handleHomeClick}
        />

        {/* Footer */}
        <div className="pointer-events-none absolute bottom-0 left-0 z-40 w-full">
          <div className="pointer-events-auto">
            <FooterCustom />
          </div>
        </div>
      </div>

      {/* Sidebar Panel */}
      <SidebarPanel
        isOpen={isSidebarOpen || showHomeSidebar}
        showHomeSidebar={showHomeSidebar}
        selectedTool={selectedTool}
        tools={tools}
        onClose={closeSidebar}
      />
    </div>
  );
};
