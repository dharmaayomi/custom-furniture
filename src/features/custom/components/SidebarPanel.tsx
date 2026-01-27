import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Tool, ToolType } from "@/types/toolType";

interface SidebarPanelProps {
  isOpen: boolean;
  showHomeSidebar: boolean;
  selectedTool: ToolType;
  tools: Tool[];
  onClose: () => void;
  assetList3D: string[];
  assetListTexture: string[];
  onSelectMainModel: (name: string) => void;
  onAddAdditionalModel: (name: string) => void;
  onSelectTexture: (name: string) => void;
}

export const SidebarPanel = ({
  isOpen,
  showHomeSidebar,
  selectedTool,
  tools,
  onClose,
  assetList3D,
  assetListTexture,
  onSelectMainModel,
  onAddAdditionalModel,
  onSelectTexture,
}: SidebarPanelProps) => {
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
          <h2 className="text-2xl font-semibold text-gray-800">{tool.label}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-200"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">Kategori: {tool.category}</p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            {itemsToShow.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleItemClick(item)}
                className="relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100 transition-all hover:border-blue-500"
              >
                {/* Render Preview (Simple Text/Image logic) */}
                {isTexture ? (
                  // Preview Texture
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(/assets/texture/${item})` }}
                  />
                ) : (
                  // Preview 3D Model (Thumbnail Placeholder)
                  <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center text-xs text-gray-600">
                    <span className="font-bold">{item}</span>
                    <span className="mt-1 text-[10px] text-gray-400">
                      (3D Asset)
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
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
            <h2 className="text-2xl font-semibold text-gray-800">
              Browse products by room
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Furnish your space from different areas of the home to meet your
              lifestyle needs
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-200"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="group relative cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 transition-all hover:border-blue-500"
            >
              <div className="flex aspect-4/3 items-center justify-center bg-gray-100">
                <span className="text-sm text-gray-400">{room.name}</span>
              </div>
              <div className="bg-opacity-90 absolute right-0 bottom-0 left-0 bg-white p-3">
                <p className="text-sm font-medium text-gray-800">{room.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      // className={`fixed top-0 right-0 z-50 h-full w-80 bg-white shadow-2xl transition-transform duration-500 ease-in-out ${
      className={`fixed top-0 right-0 z-50 h-full w-80 bg-white shadow-md ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="h-full overflow-y-auto">
        {showHomeSidebar ? renderHomeSidebar() : renderToolSidebar()}
      </div>
    </div>
  );
};
