import React, { useEffect, useState } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import * as BABYLON from "@babylonjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";
import { updateRoomDimensions } from "../_components/MeshUtils_WallSnap";
import { ROOM_DIMENSIONS } from "../_components/RoomConfig";

interface CustomizeRoomPanelProps {
  isOpen: boolean;
  onClose: () => void;
  scene: BABYLON.Scene | null;
}

const FLOOR_TEXTURES = [
  { name: "Oak Wood", path: "/assets/texture/european-oak.jpg" },
  { name: "Light Wood", path: "/assets/texture/light-wood-texture.jpg" },
  { name: "Fine Wood", path: "/assets/texture/fine-wood-texture.jpg" },
  {
    name: "Concrete",
    path: "/assets/texture/texture-of-dry-concrete-wall.jpg",
  },
  { name: "Carpet", path: "/assets/texture/carpet.jpg" },
  { name: "Tile", path: "/assets/texture/bathroom-tile.jpg" },
  { name: " Herringbone", path: "/assets/texture/Oak_Herringbone.jpg" },
  { name: "Gray Herringbone", path: "/assets/texture/gray_herringbone.jpg" },
];

export const CustomizeRoomPanel = ({
  isOpen,
  onClose,
  scene,
}: CustomizeRoomPanelProps) => {
  const { present, updateRoomConfig } = useRoomStore();
  const { roomConfig } = present;
  const [widthInput, setWidthInput] = useState("");
  const [depthInput, setDepthInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const wallOffset = ROOM_DIMENSIONS.wallThickness * 2;
  const widthDisplay = roomConfig.width - wallOffset;
  const depthDisplay = roomConfig.depth - wallOffset;
  const heightDisplay = roomConfig.height - wallOffset;

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const updateDimensionFromInput = (
    value: string,
    min: number,
    max: number,
    key: "width" | "depth" | "height",
  ) => {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) return;
    const clamped = clamp(parsed + wallOffset, min, max);
    updateRoomConfig({ [key]: clamped });
  };

  useEffect(() => {
    setWidthInput(widthDisplay.toFixed(2));
    setDepthInput(depthDisplay.toFixed(2));
    setHeightInput(heightDisplay.toFixed(2));
  }, [widthDisplay, depthDisplay, heightDisplay]);

  useEffect(() => {
    if (scene) {
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        updateRoomDimensions(scene);
      }, 150);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [roomConfig.width, roomConfig.depth, scene]);
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
            <div className="flex items-center justify-between gap-3">
              <Label>Width (m)</Label>
              <Input
                type="number"
                inputMode="decimal"
                min={3 - wallOffset}
                max={10 - wallOffset}
                step={0.01}
                value={widthInput}
                onChange={(e) => {
                  setWidthInput(e.target.value);
                  updateDimensionFromInput(e.target.value, 3, 10, "width");
                }}
                className="h-9 w-24 text-right"
              />
            </div>
            <Slider
              value={[roomConfig.width]}
              min={3}
              max={10}
              step={0.1}
              onValueChange={([val]) => updateRoomConfig({ width: val })}
              color="bg-white"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Depth (m)</Label>
              <Input
                type="number"
                inputMode="decimal"
                min={3 - wallOffset}
                max={10 - wallOffset}
                step={0.01}
                value={depthInput}
                onChange={(e) => {
                  setDepthInput(e.target.value);
                  updateDimensionFromInput(e.target.value, 3, 10, "depth");
                }}
                className="h-9 w-24 text-right"
              />
            </div>
            <Slider
              value={[roomConfig.depth]}
              min={3}
              max={10}
              step={0.1}
              onValueChange={([val]) => updateRoomConfig({ depth: val })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Height (m)</Label>
              <Input
                type="number"
                inputMode="decimal"
                min={2.9 - wallOffset}
                max={5.0 - wallOffset}
                step={0.01}
                value={heightInput}
                onChange={(e) => {
                  setHeightInput(e.target.value);
                  updateDimensionFromInput(e.target.value, 2.9, 5.0, "height");
                }}
                className="h-9 w-24 text-right"
              />
            </div>
            <Slider
              value={[roomConfig.height]}
              min={2.9}
              max={5.0}
              step={0.1}
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
