"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FooterCustom } from "./FooterCustom";
import * as BABYLON from "@babylonjs/core";

import { HeaderCustom } from "./HeaderCustom";
import { extractModelNameFromId, formatPrice } from "@/lib/price";
import { useRoomStore } from "@/store/useRoomStore";
import {
  clearDesignCodeFromStorage,
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
import { RoomCanvasThreeDB } from "../_components/RoomCanvas_DB";
import { preloadTextures } from "../_components/RoomSetup";
import { CustomizeRoomPanel } from "./CustomizeRoomPanel";
import { FloatingToolPanel } from "./FloatingPanel";
import { ListProductPanel } from "./ListProductPanel_DB";
import { MenuModal } from "./MenuModal";
import { MyDesign } from "./MyDesign";
import { OpenDesignCode } from "./OpenDesignCode";
import { ShareDesign } from "./ShareDesign";
import { SidebarPanel } from "./SidebarPanel_DB";
import { ProductInfoPanel } from "./ProductInfoPanel_DB";
import { CAMERA_CONFIG } from "../_components/RoomConfig";
import useGetProducts from "@/hooks/api/product/useGetProducts";
import useGetProductById from "@/hooks/api/product/useGetProductById";
import useGetComponents from "@/hooks/api/product/useGetComponents";
import useGetComponentById from "@/hooks/api/product/useGetComponentById";
import { useUser } from "@/providers/UserProvider";
import { SummaryOrderItem } from "@/types/summary";

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
export const RoomPageDB = () => {
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
  const didHandleForcedNewRef = useRef(false);

  const {
    present,
    setMainModel,
    setActiveTexture,
    setMeshTexture,
    addAddOnModel,
    setDesignCode,
    reset: resetRoomState,
    undo,
    redo,
  } = useRoomStore();
  const designCode = useRoomStore((state) => state.designCode);
  const { mainModels, activeTexture, addOnModels } = present;
  const { userId } = useUser();
  const { data: productListResponse } = useGetProducts(userId, {
    page: 1,
    perPage: 100,
    sortBy: "createdAt",
    orderBy: "desc",
  });
  const productList = productListResponse?.data ?? [];
  const { data: componentListResponse } = useGetComponents(
    {
      page: 1,
      perPage: 100,
      sortBy: "componentName",
      orderBy: "asc",
    },
    true,
  );
  const componentList = componentListResponse?.data ?? [];

  const selectedModelId = useMemo(() => {
    const selected = present.selectedFurniture ?? mainModels[0];
    if (!selected) return undefined;
    const extracted = extractModelNameFromId(selected);
    return extracted;
  }, [present.selectedFurniture, mainModels]);

  const selectedProductId = useMemo(
    () =>
      selectedModelId &&
      productList.some((product) => product.id === selectedModelId)
        ? selectedModelId
        : undefined,
    [selectedModelId, productList],
  );
  const selectedComponentId = useMemo(
    () =>
      selectedModelId &&
      componentList.some((component) => component.id === selectedModelId)
        ? selectedModelId
        : undefined,
    [selectedModelId, componentList],
  );

  const { data: selectedProduct } = useGetProductById(selectedProductId);
  const { data: selectedComponent } = useGetComponentById(selectedComponentId);

  const productUrlMap = useMemo(
    () =>
      Object.fromEntries(
        productList
          .filter((product) => Boolean(product.productUrl))
          .map((product) => [product.id, product.productUrl]),
      ) as Record<string, string>,
    [productList],
  );
  const componentUrlMap = useMemo(
    () =>
      Object.fromEntries(
        componentList
          .filter((component) => Boolean(component.componentUrl))
          .map((component) => [component.id, component.componentUrl]),
      ) as Record<string, string>,
    [componentList],
  );

  const resolveProductModelUrl = useCallback(
    (modelId: string) => {
      return (
        productUrlMap[modelId] ||
        (selectedProduct?.id === modelId
          ? selectedProduct.productUrl
          : undefined) ||
        componentUrlMap[modelId] ||
        (selectedComponent?.id === modelId
          ? selectedComponent.componentUrl
          : undefined)
      );
    },
    [productUrlMap, componentUrlMap, selectedProduct, selectedComponent],
  );

  const productAssetIds = useMemo(() => {
    if (productList.length === 0) return ASSETS_3D;
    return productList.map((product) => product.id);
  }, [productList]);
  const componentAssetIds = useMemo(() => {
    if (componentList.length === 0) return [];
    return componentList.map((component) => component.id);
  }, [componentList]);

  const totalPriceFromDb = useMemo(() => {
    const allModels = [...mainModels, ...addOnModels];
    const productMap = new Map(
      productList.map((product) => [product.id, product.basePrice]),
    );
    const componentMap = new Map(
      componentList.map((component) => [component.id, component.price]),
    );

    return allModels.reduce((sum, modelId) => {
      const extracted = extractModelNameFromId(modelId);
      return sum + (productMap.get(extracted) ?? componentMap.get(extracted) ?? 0);
    }, 0);
  }, [mainModels, addOnModels, productList, componentList]);

  const summaryItems = useMemo<SummaryOrderItem[]>(() => {
    const allModels = [...mainModels, ...addOnModels];
    const productMap = new Map(
      productList.map((product) => [product.id, product]),
    );
    const componentMap = new Map(
      componentList.map((component) => [component.id, component]),
    );
    const counts: Record<string, number> = {};

    allModels.forEach((modelId) => {
      const extracted = extractModelNameFromId(modelId);
      counts[extracted] = (counts[extracted] || 0) + 1;
    });

    const items: SummaryOrderItem[] = [];
    Object.entries(counts).forEach(([modelId, quantity]) => {
      const product = productMap.get(modelId);
      if (product) {
        items.push({
          id: product.id,
          name: product.productName,
          sku: product.sku || product.id,
          image: product.images?.[0],
          unitPrice: product.basePrice,
          quantity,
          subtotal: product.basePrice * quantity,
        });
        return;
      }

      const component = componentMap.get(modelId);
      if (component) {
        items.push({
          id: component.id,
          name: component.componentName,
          sku: component.id,
          image: component.componentImageUrls?.[0],
          unitPrice: component.price,
          quantity,
          subtotal: component.price * quantity,
        });
      }
    });

    return items;
  }, [mainModels, addOnModels, productList, componentList]);

  const summaryPayload = useMemo(
    () => ({
      items: summaryItems,
      subtotal: totalPriceFromDb,
      totalItems: summaryItems.reduce((sum, item) => sum + item.quantity, 0),
      currency: "IDR" as const,
      generatedAt: new Date().toISOString(),
    }),
    [summaryItems, totalPriceFromDb],
  );
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
    if (typeof window === "undefined") return;
    const { pathname, search } = window.location;
    const params = new URLSearchParams(search);
    const newDesignFlag = params.get("new");
    const isDesignCodeRoute = pathname.split("/").filter(Boolean).length > 1;
    const isForcedNewDesign = pathname === "/custom" && newDesignFlag === "1";

    if (isForcedNewDesign && !didHandleForcedNewRef.current) {
      resetRoomState();
      setDesignCode("");
      clearDesignCodeFromStorage();
      didHandleForcedNewRef.current = true;
      return;
    }

    if (isDesignCodeRoute) return;
    if (designCode) return;
    const storedCode = loadDesignCodeFromStorage();
    setDesignCode(storedCode);
    if (!storedCode) {
      saveDesignCodeToStorage("");
    }
  }, [designCode, setDesignCode, resetRoomState]);

  useEffect(() => {
    if (!scene) return;
    const texturePaths = [
      present.roomConfig.floorTexture,
      ...ASSETS_TEXTURE.map((t) => `/assets/texture/${t}`),
    ];
    preloadTextures(scene, texturePaths);
  }, [scene, present.roomConfig.floorTexture]);

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

  const handleResetRoom = () => {
    if (!scene) return;
    const camera = scene.activeCamera;
    if (!camera || !(camera instanceof BABYLON.ArcRotateCamera)) return;

    camera.inertialAlphaOffset = 0;
    camera.inertialBetaOffset = 0;
    camera.inertialRadiusOffset = 0;
    camera.inertialPanningX = 0;
    camera.inertialPanningY = 0;

    const frameRate = 60;
    const totalFrames = 100;

    const makeAnim = (name: string, prop: string, from: number, to: number) => {
      const anim = new BABYLON.Animation(
        name,
        prop,
        frameRate,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
      );
      anim.setKeys([
        { frame: 0, value: from },
        { frame: totalFrames, value: to },
      ]);
      const easing = new BABYLON.CubicEase();
      easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
      anim.setEasingFunction(easing);
      return anim;
    };

    const animations: BABYLON.Animation[] = [
      makeAnim("camAlphaReset", "alpha", camera.alpha, CAMERA_CONFIG.alpha),
      makeAnim("camBetaReset", "beta", camera.beta, CAMERA_CONFIG.beta),
      makeAnim(
        "camRadiusReset",
        "radius",
        camera.radius,
        CAMERA_CONFIG.zoomInRadius,
      ),
      makeAnim(
        "camTargetYReset",
        "target.y",
        camera.target.y,
        CAMERA_CONFIG.targetY,
      ),
      makeAnim("camTargetXReset", "target.x", camera.target.x, 0),
      makeAnim("camTargetZReset", "target.z", camera.target.z, 0),
    ];

    scene.beginDirectAnimation(
      camera,
      animations,
      0,
      totalFrames,
      false,
      1,
      () => {
        camera.setTarget(new BABYLON.Vector3(0, CAMERA_CONFIG.targetY, 0));
        camera.alpha = CAMERA_CONFIG.alpha;
        camera.beta = CAMERA_CONFIG.beta;
        camera.radius = CAMERA_CONFIG.zoomInRadius;
      },
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenMyDesign={() => setIsMyDesignOpen(true)}
        onOpenDesignCode={() => setIsOpenDesignCodeOpen(true)}
        onOpenShareDesign={() => setIsShareDesignOpen(true)}
        onResetRoom={handleResetRoom}
      />
      <MyDesign
        isOpen={isMyDesignOpen}
        onClose={() => setIsMyDesignOpen(false)}
        onBackToMenu={() => {
          setIsMyDesignOpen(false);
          setIsMenuOpen(true);
        }}
      />
      <OpenDesignCode
        isOpen={isOpenDesignCodeOpen}
        onClose={() => setIsOpenDesignCodeOpen(false)}
        onBackToMenu={() => {
          setIsOpenDesignCodeOpen(false);
          setIsMenuOpen(true);
        }}
      />
      <ShareDesign
        isOpen={isShareDesignOpen}
        onClose={() => setIsShareDesignOpen(false)}
        onBackToMenu={() => {
          setIsShareDesignOpen(false);
          setIsMenuOpen(true);
        }}
      />
      <CustomizeRoomPanel
        scene={scene}
        isOpen={activePanel === "customize"}
        onClose={closePanel}
      />
      <ListProductPanel
        isOpen={activePanel === "productList"}
        onClose={closePanel}
        mainModels={mainModels}
        addOnModels={addOnModels}
        productsFromDb={productList}
        componentsFromDb={componentList}
      />
      <ProductInfoPanel
        isOpen={activePanel === "productInfo"}
        onClose={closePanelWithRestore}
        productsFromDb={productList}
        componentsFromDb={componentList}
      />

      <div
        className={`relative min-w-0 flex-1 bg-gray-200 ${isAnyPanelOpen ? "md:mr-80" : ""}`}
      >
        {/* Header */}
        <div className="pointer-events-none absolute top-0 left-0 z-40 w-full">
          <div className="pointer-events-auto">
            <HeaderCustom
              onMenuClick={() => setIsMenuOpen(!isMenuOpen)}
              onListClick={handleOpenProductList}
              scene={scene}
              totalPrice={totalPriceFromDb}
              formattedPrice={formatPrice(totalPriceFromDb)}
              summaryPayload={summaryPayload}
            />
          </div>
        </div>

        {/* Room Canvas */}
        <div className="relative h-screen flex-1">
          <RoomCanvasThreeDB
            mainModels={mainModels}
            activeTexture={activeTexture}
            addOnModels={addOnModels}
            resolveModelUrl={resolveProductModelUrl}
            onSceneReady={setScene}
          />
        </div>

        {/* floating tool panel */}
        <FloatingToolPanel
          tools={tools}
          selectedTool={selectedTool}
          showHomeSidebar={showHomeSidebar}
          isSidebarOpen={isSidebarOpen}
          selectedFurniture={present.selectedFurniture}
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
        assetList3D={productAssetIds}
        assetListAddOn={componentAssetIds}
        assetListTexture={ASSETS_TEXTURE}
        productsFromDb={productList}
        componentsFromDb={componentList}
        mainModels={mainModels}
        selectedFurniture={present.selectedFurniture}
        onSelectMainModel={(model) => setMainModel(model)}
        onAddAdditionalModel={addAddOnModel}
        onSelectTexture={(tex) => {
          // Apply texture only to the selected mesh
          if (!present.selectedFurniture) return;
          setMeshTexture(present.selectedFurniture, tex);
        }}
      />
    </div>
  );
};
