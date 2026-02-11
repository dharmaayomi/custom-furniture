"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ListOrdered, Menu, MoveRight, Save } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { DEFAULT_ROOM_CONFIG, useRoomStore } from "@/store/useRoomStore";
import { toast } from "sonner";
import {
  loadDesignCodeFromStorage,
  saveDesignCodeToStorage,
} from "@/lib/designCode";

interface HeaderCustomProps {
  onMenuClick: () => void;
  onListClick?: () => void;
  totalPrice?: number;
  formattedPrice?: string;
}

export const HeaderCustom = ({
  onMenuClick,
  onListClick,
  formattedPrice = "Rp.0",
}: HeaderCustomProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const { status } = useSession();
  const roomState = useRoomStore((state) => state.present);
  const designCode = useRoomStore((state) => state.designCode);
  const setDesignCode = useRoomStore((state) => state.setDesignCode);

  const handleSaveClick = () => {
    if (status === "authenticated") {
      const isDefaultRoomConfig =
        roomState.roomConfig.width === DEFAULT_ROOM_CONFIG.width &&
        roomState.roomConfig.depth === DEFAULT_ROOM_CONFIG.depth &&
        roomState.roomConfig.height === DEFAULT_ROOM_CONFIG.height &&
        roomState.roomConfig.wallColor === DEFAULT_ROOM_CONFIG.wallColor &&
        roomState.roomConfig.floorTexture === DEFAULT_ROOM_CONFIG.floorTexture;

      const isEmptyDesign =
        roomState.mainModels.length === 0 &&
        roomState.addOnModels.length === 0 &&
        roomState.activeTexture === "" &&
        roomState.mainModelTransforms.length === 0 &&
        roomState.addOnTransforms.length === 0 &&
        isDefaultRoomConfig;

      if (isEmptyDesign) {
        toast("Empty design", {
          description:
            "Add a room change or furniture before saving your design.",
        });
        return;
      }

      const designConfig = {
        units: { distance: "m", rotation: "rad" },
        room: roomState.roomConfig,
        mainModels: roomState.mainModels.map((id, index) => {
          const transform = roomState.mainModelTransforms[index];
          return {
            id,
            position_m: transform
              ? [
                  transform.position.x,
                  transform.position.y,
                  transform.position.z,
                ]
              : null,
            rotation: [0, transform?.rotation ?? 0, 0],
            scale: transform?.scale
              ? [transform.scale.x, transform.scale.y, transform.scale.z]
              : null,
            texture: transform?.texture ?? null,
          };
        }),
        addOnModels: roomState.addOnModels.map((id, index) => {
          const transform = roomState.addOnTransforms[index];
          return {
            id,
            position_m: transform
              ? [
                  transform.position.x,
                  transform.position.y,
                  transform.position.z,
                ]
              : null,
            rotation: [0, transform?.rotation ?? 0, 0],
            scale: transform?.scale
              ? [transform.scale.x, transform.scale.y, transform.scale.z]
              : null,
            texture: transform?.texture ?? null,
          };
        }),
        activeTexture: roomState.activeTexture,
        totalPrice: { amount: roomState.totalPrice, currency: "IDR" },
      };

      const storedCode = loadDesignCodeFromStorage();
      const code = designCode || storedCode;
      if (code !== designCode) {
        setDesignCode(code);
      }
      saveDesignCodeToStorage(code);

      console.log("Design code:", code);
      console.log("Design config:", designConfig);
      console.log(
        "Design config (JSON):",
        JSON.stringify(designConfig, null, 2),
      );
    } else {
      setIsDialogOpen(true);
    }
  };

  const handleLoginRedirect = () => {
    setIsDialogOpen(false);
    router.push("/login");
  };

  return (
    <>
      <header className="pointer-events-none absolute z-5 mx-auto flex w-full justify-between gap-4 px-4 pt-5 sm:px-6 sm:pt-4 md:px-8">
        {/* left button */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-4">
          <div
            className="cursor-pointer rounded-full bg-gray-100 p-3 shadow-md md:p-4"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4 md:h-6 md:w-6" />
          </div>
          <Button
            className="hidden cursor-pointer items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-black shadow-md hover:text-white md:flex"
            onClick={handleSaveClick}
          >
            <Save />
            <div>Save</div>
          </Button>
        </div>

        {/* right button */}
        <div className="pointer-events-auto flex items-center gap-4">
          <div
            className="cursor-pointer rounded-full bg-gray-100 p-2 shadow-md"
            onClick={onListClick}
          >
            <ListOrdered className="h-4 w-4" />
          </div>
          <div className="items-center justify-center text-center text-black">
            {formattedPrice}
          </div>
          <div className="flex cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-2 py-2 text-sm font-bold text-white sm:px-4">
            <span className="hidden sm:inline">SUMMARY</span>

            <MoveRight />
          </div>
        </div>
      </header>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Save design</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <DialogDescription className="text-base text-gray-600">
              You need to log in to save your designs.
            </DialogDescription>
          </div>

          <div className="mt-4 flex w-full">
            <Button
              className="hover:bg-primary/90 w-full rounded-full text-base font-bold"
              onClick={handleLoginRedirect}
            >
              Log in or sign up
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
