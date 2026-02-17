"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as BABYLON from "@babylonjs/core";
import { Check, ListOrdered, Menu, MoveRight, Save } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { DEFAULT_ROOM_CONFIG, useRoomStore } from "@/store/useRoomStore";
import { toast } from "sonner";
import {
  loadDesignCodeFromStorage,
  saveDesignCodeToStorage,
} from "@/lib/designCode";
import useSaveDesign from "@/hooks/api/design/useSaveDesign";
import { useUser } from "@/providers/UserProvider";
import useGetSavedDesignByCode from "@/hooks/api/design/useGetSavedDesignByCode";
import useGetDesignPreviewUploadSignature from "@/hooks/api/design/useGetDesignPreviewUploadSignature";
import { CAMERA_CONFIG } from "../_components/RoomConfig";

interface HeaderCustomProps {
  onMenuClick: () => void;
  onListClick?: () => void;
  totalPrice?: number;
  formattedPrice?: string;
  scene?: BABYLON.Scene | null;
}

export const HeaderCustom = ({
  onMenuClick,
  onListClick,
  formattedPrice = "Rp.0",
  scene = null,
}: HeaderCustomProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const { userId } = useUser();
  const roomState = useRoomStore((state) => state.present);
  const designCode = useRoomStore((state) => state.designCode);
  const setDesignCode = useRoomStore((state) => state.setDesignCode);
  const { mutateAsync: saveDesign, isPending } = useSaveDesign();
  const { mutateAsync: getPreviewUploadSignature } =
    useGetDesignPreviewUploadSignature();
  const [designName, setDesignName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [lastSavedHash, setLastSavedHash] = useState<string | null>(null);
  const routeDesignCode = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] !== "custom" || !parts[1]) return "";
    return decodeURIComponent(parts[1]);
  }, [pathname]);
  const { data: savedDesignByCodeData } = useGetSavedDesignByCode(
    userId,
    routeDesignCode || undefined,
  );
  const savedDesignByCodePayload =
    (savedDesignByCodeData as any)?.data ?? savedDesignByCodeData;
  const existingDesignName = (
    savedDesignByCodePayload?.designName ?? ""
  ).trim();
  const activeDesignName = designName.trim() || existingDesignName;

  const capturePreviewFromCanvas = async (): Promise<Blob | undefined> => {
    try {
      if (typeof window === "undefined") return undefined;
      let sourceCanvas: HTMLCanvasElement | undefined;

      if (scene) {
        const activeCamera = scene.activeCamera;
        if (activeCamera && activeCamera instanceof BABYLON.ArcRotateCamera) {
          const previousState = {
            alpha: activeCamera.alpha,
            beta: activeCamera.beta,
            radius: activeCamera.radius,
            target: activeCamera.target.clone(),
            inertialAlphaOffset: activeCamera.inertialAlphaOffset,
            inertialBetaOffset: activeCamera.inertialBetaOffset,
            inertialRadiusOffset: activeCamera.inertialRadiusOffset,
            inertialPanningX: activeCamera.inertialPanningX,
            inertialPanningY: activeCamera.inertialPanningY,
          };

          activeCamera.inertialAlphaOffset = 0;
          activeCamera.inertialBetaOffset = 0;
          activeCamera.inertialRadiusOffset = 0;
          activeCamera.inertialPanningX = 0;
          activeCamera.inertialPanningY = 0;

          activeCamera.alpha = CAMERA_CONFIG.alpha;
          activeCamera.beta = CAMERA_CONFIG.beta;
          activeCamera.radius = CAMERA_CONFIG.radius;
          activeCamera.setTarget(new BABYLON.Vector3(0, CAMERA_CONFIG.targetY, 0));

          scene.render();
          await new Promise((resolve) => requestAnimationFrame(resolve));

          sourceCanvas = scene.getEngine().getRenderingCanvas() ?? undefined;

          activeCamera.alpha = previousState.alpha;
          activeCamera.beta = previousState.beta;
          activeCamera.radius = previousState.radius;
          activeCamera.setTarget(previousState.target);
          activeCamera.inertialAlphaOffset = previousState.inertialAlphaOffset;
          activeCamera.inertialBetaOffset = previousState.inertialBetaOffset;
          activeCamera.inertialRadiusOffset =
            previousState.inertialRadiusOffset;
          activeCamera.inertialPanningX = previousState.inertialPanningX;
          activeCamera.inertialPanningY = previousState.inertialPanningY;
          scene.render();
        }
      }

      if (!sourceCanvas) {
        const canvases = Array.from(document.querySelectorAll("canvas"));
        if (!canvases.length) return undefined;
        sourceCanvas = canvases
          .filter((canvas) => canvas.width > 0 && canvas.height > 0)
          .sort((a, b) => b.width * b.height - a.width * a.height)[0];
      }

      if (!sourceCanvas) return undefined;

      const maxWidth = 960;
      const scale = Math.min(1, maxWidth / sourceCanvas.width);
      const targetWidth = Math.max(1, Math.round(sourceCanvas.width * scale));
      const targetHeight = Math.max(1, Math.round(sourceCanvas.height * scale));

      const previewCanvas = document.createElement("canvas");
      previewCanvas.width = targetWidth;
      previewCanvas.height = targetHeight;

      const context = previewCanvas.getContext("2d", { alpha: false });
      if (!context) return undefined;

      context.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

      const toJpegBlob = (quality: number) =>
        new Promise<Blob | undefined>((resolve) => {
          previewCanvas.toBlob(
            (blob) => {
              resolve(blob ?? undefined);
            },
            "image/jpeg",
            quality,
          );
        });

      let quality = 0.7;
      let blob = await toJpegBlob(quality);
      const maxBytes = 250 * 1024;

      while ((blob?.size ?? 0) > maxBytes && quality > 0.4) {
        quality -= 0.1;
        blob = await toJpegBlob(quality);
      }

      return blob;
    } catch {
      return undefined;
    }
  };

  const uploadPreviewToCloudinary = async (
    previewBlob: Blob,
  ): Promise<string | undefined> => {
    try {
      const signaturePayload = await getPreviewUploadSignature();
      const {
        apiKey,
        cloudName,
        folder,
        signature,
        timestamp,
      } = signaturePayload ?? {};

      if (!apiKey || !cloudName || !folder || !signature || !timestamp) {
        return undefined;
      }

      const formData = new FormData();
      formData.append("file", previewBlob, `design-preview-${Date.now()}.jpg`);
      formData.append("api_key", String(apiKey));
      formData.append("timestamp", String(timestamp));
      formData.append("signature", String(signature));
      formData.append("folder", String(folder));

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        return undefined;
      }

      const uploaded = await response.json();
      return typeof uploaded?.secure_url === "string"
        ? uploaded.secure_url
        : undefined;
    } catch {
      return undefined;
    }
  };

  const buildDesignConfig = () => ({
    units: { distance: "m", rotation: "rad" },
    room: roomState.roomConfig,
    mainModels: roomState.mainModels.map((id, index) => {
      const transform = roomState.mainModelTransforms[index];
      return {
        id,
        position_m: transform
          ? [transform.position.x, transform.position.y, transform.position.z]
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
          ? [transform.position.x, transform.position.y, transform.position.z]
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
  });

  const currentConfigHash = useMemo(
    () => JSON.stringify(buildDesignConfig()),
    [
      roomState.roomConfig,
      roomState.mainModels,
      roomState.addOnModels,
      roomState.activeTexture,
      roomState.mainModelTransforms,
      roomState.addOnTransforms,
      roomState.totalPrice,
    ],
  );

  const isDirty =
    lastSavedHash === null ? true : lastSavedHash !== currentConfigHash;

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
      if (!isDirty) {
        toast("Already saved", { description: "No changes to save." });
        return;
      }

      if (!activeDesignName) {
        setIsNameDialogOpen(true);
        return;
      }

      handleSaveDesign(activeDesignName);
    } else {
      setIsDialogOpen(true);
    }
  };

  const handleSaveDesign = async (name: string) => {
    const storedCode = loadDesignCodeFromStorage();
    const code = designCode || storedCode;
    if (code !== designCode) {
      setDesignCode(code);
    }
    if (code) {
      saveDesignCodeToStorage(code);
    }

    const previewBlob = await capturePreviewFromCanvas();
    const previewUrl = previewBlob
      ? await uploadPreviewToCloudinary(previewBlob)
      : undefined;

    const payload = {
      configuration: buildDesignConfig(),
      designName: name,
      designCode: code || undefined,
      previewUrl,
    };
    try {
      const result = await saveDesign({
        configuration: payload.configuration,
        designName: payload.designName,
        designCode: payload.designCode,
        previewUrl: payload.previewUrl,
      });
      const responsePayload = (result as any)?.data ?? result;
      const savedName = responsePayload?.designName || name;
      setDesignName(savedName);
      setLastSavedHash(currentConfigHash);
      toast("Design saved", {
        description: savedName ? `Saved as "${savedName}".` : undefined,
      });
    } catch (error) {
      toast("Failed to save design");
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
            id="header-save-button"
            name="header-save"
            className="hidden cursor-pointer items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-black shadow-md hover:text-white md:flex"
            onClick={handleSaveClick}
            disabled={isPending || (!isDirty && !!activeDesignName)}
          >
            {!isDirty && !!activeDesignName ? <Check size={16} /> : <Save />}
            <div>{!isDirty && !!activeDesignName ? "Saved" : "Save"}</div>
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
      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Name your design
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <DialogDescription className="text-base text-gray-600">
              Give your design a name so you can find it later.
            </DialogDescription>
          </div>

          <div className="mt-2 flex w-full flex-col gap-3">
            <Input
              placeholder="e.g. Living Room A"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
            />
            <Button
              className="hover:bg-primary/90 w-full rounded-full text-base font-bold"
              onClick={async () => {
                const trimmed = nameInput.trim();
                if (!trimmed) {
                  toast("Design name required");
                  return;
                }
                setIsNameDialogOpen(false);
                setNameInput("");
                await handleSaveDesign(trimmed);
              }}
            >
              Save Design
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
