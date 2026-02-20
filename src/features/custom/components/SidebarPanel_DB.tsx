import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/price";
import { X } from "lucide-react";
import { ProductBase } from "@/types/product";
import { Tool, ToolType } from "@/types/toolType";
import { useState } from "react";
import {
  getStatusAlertClass,
  getStatusAlertDescriptionClass,
  getStatusAlertTitleClass,
} from "@/lib/statusStyles";

interface SidebarPanelProps {
  isOpen: boolean;
  showHomeSidebar: boolean;
  selectedTool: ToolType;
  tools: Tool[];
  onClose: () => void;
  assetList3D: string[];
  assetListTexture: string[];
  productsFromDb?: ProductBase[];
  mainModels: string[];
  onSelectMainModel: (name: string) => void;
  onAddAdditionalModel: (name: string) => void;
  onSelectTexture: (name: string) => void;
  selectedFurniture: string | null;
}

export const SidebarPanel = ({
  isOpen,
  showHomeSidebar,
  selectedTool,
  tools,
  onClose,
  assetList3D,
  assetListTexture,
  productsFromDb = [],
  mainModels,
  onSelectMainModel,
  onAddAdditionalModel,
  onSelectTexture,
  selectedFurniture,
}: SidebarPanelProps) => {
  const [previousState, setPreviousState] = useState(null);
  const productMap = new Map(productsFromDb.map((product) => [product.id, product]));

  const renderToolSidebar = () => {
    const tool = tools.find((t) => t.id === selectedTool);
    if (!tool) return null;

    let itemsToShow: string[] = [];
    let handleItemClick: (item: string) => void = () => {};
    let isTexture = false;

    if (tool.id === "furniture") {
      itemsToShow = assetList3D;
      handleItemClick = onSelectMainModel;
    } else if (tool.id === "tambahan") {
      itemsToShow = assetList3D;
      handleItemClick = onAddAdditionalModel;
    } else if (tool.id === "paint") {
      itemsToShow = assetListTexture;
      handleItemClick = onSelectTexture;
      isTexture = true;
    } else {
      itemsToShow = ["1", "2"];
    }
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-foreground text-2xl font-semibold">
            {tool.label}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-muted"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">Kategori: {tool.category}</p>

          {tool.id === "tambahan" && mainModels.length === 0 && (
            <div className={getStatusAlertClass("warning")}>
              <p className={getStatusAlertTitleClass("warning")}>
                Please select a model first
              </p>
              <p className={getStatusAlertDescriptionClass("warning")}>
                You need to place the furniture before adding additional items.
              </p>
            </div>
          )}

          {tool.id === "paint" && mainModels.length === 0 && (
            <div className={getStatusAlertClass("warning")}>
              <p className={getStatusAlertTitleClass("warning")}>
                Please select a model first
              </p>
              <p className={getStatusAlertDescriptionClass("warning")}>
                You need to place the furniture before adding paint textures.
              </p>
            </div>
          )}
          {tool.id === "paint" &&
            mainModels.length > 0 &&
            !selectedFurniture && (
              <div className={getStatusAlertClass("warning")}>
                <p className={getStatusAlertTitleClass("warning")}>
                  Please select a model
                </p>
                <p className={getStatusAlertDescriptionClass("warning")}>
                  Select a furniture item to apply a texture.
                </p>
              </div>
            )}
          <div className="mt-6 grid grid-cols-2 gap-4">
            {itemsToShow.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (tool.id === "tambahan" && mainModels.length === 0) {
                    return; // Prevent click if main model doesn't exist
                  }
                  if (tool.id === "paint" && !selectedFurniture) {
                    return; // Prevent texture when no selection
                  }
                  handleItemClick(item);
                }}
                className={`bg-muted border-border hover:border-ring relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                  (tool.id === "tambahan" && mainModels.length === 0) ||
                  (tool.id === "paint" && !selectedFurniture)
                    ? "pointer-events-none cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                {/* Render Preview (Simple Text/Image logic) */}
                {isTexture ? (
                  // Preview Texture
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(/assets/texture/${item})` }}
                  />
                ) : (
                  (() => {
                    const dbProduct = productMap.get(item);

                    if (!dbProduct) {
                      return (
                        <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center p-2 text-center text-xs">
                          <span className="font-bold">{item}</span>
                          <span className="text-muted-foreground/70 mt-1 text-[10px]">
                            (3D Asset)
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div className="flex h-full w-full flex-col">
                        <div className="bg-muted aspect-square w-full overflow-hidden">
                          {dbProduct.images?.[0] ? (
                            <img
                              src={dbProduct.images[0]}
                              alt={dbProduct.productName}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                        <div className="bg-background flex flex-1 flex-col justify-between p-2">
                          <p className="text-foreground line-clamp-2 text-xs font-semibold">
                            {dbProduct.productName}
                          </p>
                          <p className="text-muted-foreground mt-1 text-[11px] font-medium">
                            {formatPrice(dbProduct.basePrice)}
                          </p>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            ))}
          </div>

          {isTexture && (
            <div className="mt-4">
              <Button
                onClick={() => {
                  console.log("Reset Texture button clicked");
                  // Only reset texture for the selected furniture. If none selected,
                  // do nothing to avoid clearing global textures unexpectedly.
                  if (selectedFurniture) {
                    handleItemClick("");
                  }
                }}
                disabled={!selectedFurniture}
                className={`w-full font-semibold ${selectedFurniture ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
              >
                Reset Texture
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHomeSidebar = () => {
    const rooms = [
      { id: 1, name: "Bathroom products", image: "bathroom" },
      { id: 2, name: "Bedroom products", image: "bedroom" },
      { id: 3, name: "Workspace products", image: "workspace" },
      { id: 4, name: "Hallway products", image: "hallway" },
      { id: 5, name: "Dining products", image: "dining" },
      { id: 6, name: "Living room products", image: "living" },
    ];

    return (
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-foreground text-2xl font-semibold">
              Browse products by room
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Furnish your space from different areas of the home to meet your
              lifestyle needs
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-muted"
          >
            <X size={20} />
          </Button>
        </div>

        {/* room type */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="border-border hover:border-ring group relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all"
            >
              <div className="bg-muted flex aspect-4/3 items-center justify-center">
                <span className="text-muted-foreground text-sm">{room.name}</span>
              </div>
              <div className="bg-card/90 absolute right-0 bottom-0 left-0 p-3 backdrop-blur">
                <p className="text-foreground text-sm font-medium">{room.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-background text-foreground fixed top-0 right-0 z-60 h-full w-[85vw] max-w-88 shadow-md sm:w-80 sm:max-w-none ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="h-full overflow-y-auto">
        {showHomeSidebar ? renderHomeSidebar() : renderToolSidebar()}
      </div>
    </div>
  );
};

