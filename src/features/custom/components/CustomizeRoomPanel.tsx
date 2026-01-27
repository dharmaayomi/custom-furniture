import React from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";

interface CustomizeRoomPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const FLOOR_TEXTURES = [
  { name: "Wood A", path: "/assets/texture/wood-texture.jpg" },
  { name: "Wood B", path: "/assets/texture/light-wood-texture.jpg" },
  { name: "Fine Wood", path: "/assets/texture/fine-wood-texture.jpg" },
  {
    name: "Concrete",
    path: "/assets/texture/texture-of-dry-concrete-wall.jpg",
  },
];

export const CustomizeRoomPanel = ({
  isOpen,
  onClose,
}: CustomizeRoomPanelProps) => {
  const { present, updateRoomConfig } = useRoomStore();
  const { roomConfig } = present;

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 z-50 h-full w-80 overflow-y-auto bg-white p-6 shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Customize Room</h2>
        <button onClick={onClose}>
          <X />
        </button>
      </div>

      <div className="space-y-6">
        {/* DIMENSIONS */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">Dimensions</h3>

          <div className="space-y-2">
            <Label>Width (cm): {roomConfig.width}</Label>
            <Slider
              value={[roomConfig.width]}
              min={300}
              max={1000}
              step={10}
              onValueChange={([val]) => updateRoomConfig({ width: val })}
              color="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Depth (cm): {roomConfig.depth}</Label>
            <Slider
              value={[roomConfig.depth]}
              min={300}
              max={1000}
              step={10}
              onValueChange={([val]) => updateRoomConfig({ depth: val })}
            />
          </div>

          <div className="space-y-2">
            <Label>Height (cm): {roomConfig.height}</Label>
            <Slider
              value={[roomConfig.height]}
              min={240}
              max={500}
              step={10}
              onValueChange={([val]) => updateRoomConfig({ height: val })}
            />
          </div>
        </div>

        {/* WALL COLOR */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">Wall Color</h3>
          <div className="flex gap-2">
            <Input
              type="color"
              value={roomConfig.wallColor}
              onChange={(e) => updateRoomConfig({ wallColor: e.target.value })}
              className="h-12 w-12 cursor-pointer p-1"
            />
            <div className="flex flex-col justify-center">
              <span className="text-sm text-gray-500">Selected Color</span>
              <span className="font-mono text-sm">{roomConfig.wallColor}</span>
            </div>
          </div>
        </div>

        {/* FLOOR TEXTURE */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">Floor Material</h3>
          <div className="grid grid-cols-2 gap-2">
            {FLOOR_TEXTURES.map((tex) => (
              <div
                key={tex.path}
                onClick={() => updateRoomConfig({ floorTexture: tex.path })}
                className={`cursor-pointer overflow-hidden rounded-lg border-2 p-1 ${roomConfig.floorTexture === tex.path ? "border-blue-500" : "border-transparent"}`}
              >
                <div
                  className="h-16 w-full rounded bg-cover bg-center"
                  style={{ backgroundImage: `url(${tex.path})` }}
                />
                <p className="mt-1 text-center text-xs">{tex.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
