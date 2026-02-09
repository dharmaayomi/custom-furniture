"use client";

import { useEffect, useState } from "react";
import { FooterCustom } from "./FooterCustom";
import * as BABYLON from "@babylonjs/core";

import { HeaderCustom } from "./HeaderCustom";
import { calculateTotalPrice, formatPrice } from "@/lib/price";
import { useRoomStore } from "@/store/useRoomStore";
import {
  generateDesignCode,
  loadDesignCodeFromStorage,
  saveDesignCodeToStorage,
} from "@/lib/designCode";
import { Tool, ToolType } from "@/types/toolType";
import {
  DoorClosed,
  Grid,
  LampFloor,
  LayoutTemplate,
  Package,
  PaintBucket,
} from "lucide-react";
import { RoomCanvasThree } from "../_components/RoomCanvas";
import { CustomizeRoomPanel } from "./CustomizeRoomPanel";
import { FloatingToolPanel } from "./FloatingPanel";
import { ListProductPanel } from "./ListProductPanel";
import { MenuModal } from "./MenuModal";
import { MyDesign } from "./MyDesign";
import { OpenDesignCode } from "./OpenDesignCode";
import { ShareDesign } from "./ShareDesign";
import { SidebarPanel } from "./SidebarPanel";
import { ProductInfoPanel } from "./ProductInfoPanel";

const ASSETS_3D = [
  "lemaritest.glb",
  "wine_cabinet.glb",
  "BoomBox.glb",
  "wooden_cupboard.glb",
  "cabinet-2.glb",
  "cabinet.glb",
  "wall_cupboard.glb",
];

type ActivePanel =
  | "sidebar"
  | "productList"
  | "customize"
  | "home"
  | "productInfo"
  | null;

const ASSETS_TEXTURE = [
  "fine-wood-texture.jpg",
  "light-wood-texture.jpg",
  "wood-texture.jpg",
  "WoodFine23_COL_1K.jpg",
  "gray-abstract-texture.jpg",
  "texture-of-dry-concrete-wall.jpg",
];
export const RoomPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMyDesignOpen, setIsMyDesignOpen] = useState(false);
  const [isOpenDesignCodeOpen, setIsOpenDesignCodeOpen] = useState(false);
  const [isShareDesignOpen, setIsShareDesignOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showHomeSidebar, setShowHomeSidebar] = useState(false);
  const [scene, setScene] = useState<BABYLON.Scene | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);
  const isAnyPanelOpen = activePanel !== null;

  const [showDragPlane, setShowDragPlane] = useState(false);

  const {
    present,
    setMainModel,
    setActiveTexture,
    setMeshTexture,
    addAdditionalModel,
    setDesignCode,
    undo,
    redo,
  } = useRoomStore();
  const designCode = useRoomStore((state) => state.designCode);
  const { mainModel, activeTexture, additionalModels } = present;
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.shiftKey && e.key === "Z"))
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    if (designCode) return;
    const storedCode = loadDesignCodeFromStorage();
    const code = storedCode || generateDesignCode(6);
    setDesignCode(code);
    if (!storedCode) {
      saveDesignCodeToStorage(code);
    }
  }, [designCode, setDesignCode]);

  const handleToolClick = (toolId: ToolType) => {
    if (activePanel === "sidebar" && selectedTool === toolId) {
      closePanel();
    } else {
      setSelectedTool(toolId);
      openPanel("sidebar");
    }
  };

  const openPanel = (panel: ActivePanel) => {
    setActivePanel(panel);
  };

  const closePanel = () => {
    setActivePanel(null);
    setSelectedTool(null);
  };

  const closePanelWithRestore = () => {
    setActivePanel("home");
    setShowHomeSidebar(true);
    setSelectedTool(null);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedTool(null);
    setShowHomeSidebar(false);
    setActivePanel(null);
  };

  const handleHomeClick = () => {
    openPanel(activePanel === "home" ? null : "home");
  };

  const handleOpenProductList = () => {
    openPanel("productList");
  };

  const handleCustomizeClick = () => {
    openPanel("customize");
  };

  const handleProductInfoClick = () => {
    setActivePanel("sidebar");
    setSelectedTool(null);
    setShowHomeSidebar(false);
    setActivePanel("productInfo");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenMyDesign={() => setIsMyDesignOpen(true)}
        onOpenDesignCode={() => setIsOpenDesignCodeOpen(true)}
        onOpenShareDesign={() => setIsShareDesignOpen(true)}
        isLoggedIn={false}
      />
      <MyDesign
        isOpen={isMyDesignOpen}
        onClose={() => setIsMyDesignOpen(false)}
        onBackToMenu={() => {
          setIsMyDesignOpen(false);
          setIsMenuOpen(true);
        }}
        isLoggedIn={false}
      />
      <OpenDesignCode
        isOpen={isOpenDesignCodeOpen}
        onClose={() => setIsOpenDesignCodeOpen(false)}
        onBackToMenu={() => {
          setIsOpenDesignCodeOpen(false);
          setIsMenuOpen(true);
        }}
        isLoggedIn={false}
      />
      <ShareDesign
        isOpen={isShareDesignOpen}
        onClose={() => setIsShareDesignOpen(false)}
        onBackToMenu={() => {
          setIsShareDesignOpen(false);
          setIsMenuOpen(true);
        }}
        isLoggedIn={false}
      />
      <CustomizeRoomPanel
        scene={scene}
        isOpen={activePanel === "customize"}
        onClose={closePanel}
      />
      <ListProductPanel
        isOpen={activePanel === "productList"}
        onClose={closePanel}
        mainModel={mainModel}
        additionalModels={additionalModels}
        totalPrice={calculateTotalPrice(
          mainModel,
          additionalModels,
          activeTexture,
        )}
      />
      <ProductInfoPanel
        isOpen={activePanel === "productInfo"}
        onClose={closePanelWithRestore}
      />

      <div
        className="relative min-w-0 flex-1 bg-gray-200"
        style={{
          marginRight: isAnyPanelOpen ? "320px" : "0",
        }}
      >
        {/* Header */}
        <div className="pointer-events-none absolute top-0 left-0 z-40 w-full">
          <div className="pointer-events-auto">
            <HeaderCustom
              onMenuClick={() => setIsMenuOpen(!isMenuOpen)}
              onListClick={handleOpenProductList}
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
            onSceneReady={setScene}
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
          onCustomizeClick={handleCustomizeClick}
        />

        {/* Footer */}
        <div className="pointer-events-none absolute bottom-0 left-0 z-40 w-full">
          <div className="pointer-events-auto">
            <FooterCustom
              onCustomizeClick={handleCustomizeClick}
              onInfoClick={handleProductInfoClick}
            />
          </div>
        </div>
      </div>

      {/* Sidebar Panel */}
      <SidebarPanel
        isOpen={activePanel === "sidebar" || activePanel === "home"}
        showHomeSidebar={activePanel === "home"}
        selectedTool={selectedTool}
        tools={tools}
        onClose={closeSidebar}
        assetList3D={ASSETS_3D}
        assetListTexture={ASSETS_TEXTURE}
        mainModel={mainModel}
        selectedFurniture={present.selectedFurniture}
        onSelectMainModel={(model) => setMainModel(model)}
        onAddAdditionalModel={addAdditionalModel}
        onSelectTexture={(tex) => {
          // If a mesh is selected, apply texture to that mesh only
          if (present.selectedFurniture) {
            setMeshTexture(present.selectedFurniture, tex);
          } else {
            setActiveTexture(tex);
          }
        }}
      />
    </div>
  );
};
