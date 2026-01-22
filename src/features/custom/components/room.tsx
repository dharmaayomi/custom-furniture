"use client";

import { useState } from "react";
import { FooterCustom } from "./FooterCustom";
import { HeaderCustom } from "./HeaderCustom";

import { Tool, ToolType } from "@/types/toolType";
import {
  DoorClosed,
  Grid,
  LampFloor,
  LayoutTemplate,
  Package,
  PaintBucket,
} from "lucide-react";
import { RoomCanvasOne } from "./CanvasOne";
import { FloatingToolPanel } from "./FloatingPanel";
import { MenuModal } from "./MenuModal";
import { SidebarPanel } from "./SidebarPanel";
import { RoomCanvasTwo } from "./CanvasTwo";
import { calculateTotalPrice, formatPrice } from "@/lib/price";
import { ListProductPanel } from "./ListProductPanel";
import { is } from "zod/v4/locales";
import { RoomCanvasThree } from "../_components/RoomCanvas";
import { RoomCanvas } from "./RoomCanvas";

const ASSETS_3D = [
  "wine_cabinet.glb",
  "cabinet-1.glb",
  "cabinet.glb",
  "chair-1.glb",
  "man.glb",
  "wall_cupboard.glb",
  "rakayolahkaliinibener.glb",
];

const ASSETS_TEXTURE = [
  "fine-wood-texture.jpg",
  "light-wood-texture.jpg",
  "wood-texture.jpg",
  "WoodFine23_COL_1K.jpg",
  "gray-abstract-texture.jpg",
  "texture-of-dry-concrete-wall.jpg",
];
export const RoomPage = () => {
  const [cameraSystem, setCameraSystem] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProductListOpen, setIsProductListOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);
  const [showHomeSidebar, setShowHomeSidebar] = useState(false);
  const [mainModel, setMainModel] = useState("wine_cabinet.glb");
  const [activeTexture, setActiveTexture] = useState("");
  const [additionalModels, setAdditionalModels] = useState<string[]>([]); // Array untuk barang tambahan
  const tools: Tool[] = [
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
      id: "paint",
      icon: PaintBucket,
      label: "Warna",
      category: "Finishing",
    },
    {
      id: "door",
      icon: DoorClosed,
      label: "Pintu",
      category: "Furniture",
    },

    {
      id: "lighting",
      icon: LampFloor,
      label: "Pencahayaan",
      category: "Pencahayaan",
    },

    { id: "grid", icon: Grid, label: "Lantai", category: "View" },
  ];

  const handleToolClick = (toolId: ToolType) => {
    if (isProductListOpen) {
      setIsProductListOpen(false);
    }

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
    if (isProductListOpen) {
      setIsProductListOpen(false);
    }

    setShowHomeSidebar(!showHomeSidebar);
    if (showHomeSidebar) {
      setIsSidebarOpen(false);
      setSelectedTool(null);
    } else {
      setIsSidebarOpen(false);
      setSelectedTool(null);
    }
  };
  const handleListClick = () => {
    // Toggle product list
    const newState = !isProductListOpen;
    setIsProductListOpen(newState);

    // Jika product list dibuka, tutup sidebar dan home sidebar
    if (newState) {
      setIsSidebarOpen(false);
      setSelectedTool(null);
      setShowHomeSidebar(false);
    }
  };
  const closeProductList = () => {
    setIsProductListOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isLoggedIn={false}
      />

      <ListProductPanel
        isOpen={isProductListOpen}
        onClose={closeProductList}
        mainModel={mainModel}
        additionalModels={additionalModels}
        totalPrice={calculateTotalPrice(
          mainModel,
          additionalModels,
          activeTexture,
        )}
      />

      <div
        className="relative min-w-0 flex-1 bg-gray-200"
        style={{
          marginRight:
            isSidebarOpen || showHomeSidebar || isProductListOpen
              ? "320px"
              : "0",
        }}
      >
        {/* Header */}
        <div className="pointer-events-none absolute top-0 left-0 z-40 w-full">
          <div className="pointer-events-auto">
            <HeaderCustom
              onMenuClick={() => setIsMenuOpen(!isMenuOpen)}
              onListClick={() => setIsProductListOpen(!isProductListOpen)}
              totalPrice={calculateTotalPrice(
                mainModel,
                additionalModels,
                activeTexture,
              )}
              formattedPrice={formatPrice(
                calculateTotalPrice(mainModel, additionalModels, activeTexture),
              )}
            />
          </div>
        </div>

        {/* Room Canvas */}
        <div className="relative h-screen flex-1">
          <RoomCanvasThree
            mainModel={mainModel}
            activeTexture={activeTexture}
            additionalModels={additionalModels}
          />
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
      {/* <SidebarPanel
        isOpen={isSidebarOpen || showHomeSidebar}
        showHomeSidebar={showHomeSidebar}
        selectedTool={selectedTool}
        tools={tools}
        onClose={closeSidebar}
      /> */}
      <SidebarPanel
        isOpen={isSidebarOpen || showHomeSidebar}
        showHomeSidebar={showHomeSidebar}
        selectedTool={selectedTool}
        tools={tools}
        onClose={closeSidebar}
        assetList3D={ASSETS_3D}
        assetListTexture={ASSETS_TEXTURE}
        onSelectMainModel={(model) => setMainModel(model)}
        onAddAdditionalModel={(model) =>
          setAdditionalModels([...additionalModels, model])
        }
        onSelectTexture={(tex) => setActiveTexture(tex)}
      />
    </div>
  );
};
