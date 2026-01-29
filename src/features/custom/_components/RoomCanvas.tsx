"use client";

import React, { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { createScene } from "./SceneSetup";
import {
  loadAdditionalModel,
  loadMainModel,
  updateAllTextures,
} from "./ModelLoader_WallSnap";
import { useRoomStore } from "@/store/useRoomStore";
import { setupAutoHideWalls, updateRoomDimensions } from "./MeshUtils_WallSnap";
import { setupRoom } from "./RoomSetup";
import { useDebounceValue } from "usehooks-ts";
import { HumanHelper } from "./HumanHelper";

interface RoomCanvasProps {
  mainModel: string;
  activeTexture: string;
  additionalModels: string[];
  onSceneReady?: (scene: BABYLON.Scene) => void;
}

const getAdditionalMeshes = (
  scene: BABYLON.Scene,
  mainMesh: BABYLON.AbstractMesh | null,
) => {
  return scene.meshes.filter(
    (m) => m.metadata === "furniture" && m !== mainMesh && !m.parent,
  );
};

export const RoomCanvasThree = ({
  mainModel,
  activeTexture,
  additionalModels,
  onSceneReady,
}: RoomCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const mainMeshRef = useRef<BABYLON.AbstractMesh | null>(null);
  const present = useRoomStore((state) => state.present);
  const presentRef = useRef(present);

  useEffect(() => {
    presentRef.current = present;
  }, [present]);

  const { roomConfig } = present;
  const shadowGenRef = useRef<BABYLON.ShadowGenerator | null>(null);
  const cameraRef = useRef<BABYLON.ArcRotateCamera | null>(null);
  const roomMeshesRef = useRef<{
    walls: BABYLON.Mesh[];
    floorVinyl: BABYLON.Mesh;
    ceiling: BABYLON.Mesh;
    floorBase: BABYLON.Mesh;
  } | null>(null);
  const [debouncedRoomConfig] = useDebounceValue(roomConfig, 150);
  const [debouncedActiveTexture] = useDebounceValue(activeTexture, 150);
  // --- 1. INITIAL SCENE SETUP ---

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true);

    // Ambil references dari createScene yang sudah dimodifikasi
    const { scene, shadowGen, camera } = createScene(canvas, engine);

    sceneRef.current = scene;
    shadowGenRef.current = shadowGen;
    cameraRef.current = camera as any;

    if (onSceneReady) {
      onSceneReady(scene);
    }

    engine.runRenderLoop(() => {
      scene.render();
    });
    // HumanHelper(scene, new BABYLON.Vector3(0, 0, 0));
    // engine.runRenderLoop(() => {
    //   scene.render();
    // });
    const handleResize = () => engine.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !shadowGenRef.current || !cameraRef.current)
      return;

    const scene = sceneRef.current;
    const shadowGen = shadowGenRef.current;
    const camera = cameraRef.current;

    // Bersihkan mesh lama
    if (roomMeshesRef.current) {
      roomMeshesRef.current.walls.forEach((w) => w.dispose());
      roomMeshesRef.current.floorVinyl.dispose();
      roomMeshesRef.current.ceiling.dispose();
      roomMeshesRef.current.floorBase.dispose();

      shadowGen.removeShadowCaster(roomMeshesRef.current.ceiling);
      roomMeshesRef.current.walls.forEach((w) =>
        shadowGen.removeShadowCaster(w),
      );
    }

    const newRoomMeshes = setupRoom(scene, debouncedRoomConfig);
    scene.executeWhenReady(() => {
      roomMeshesRef.current = newRoomMeshes;

      shadowGen.addShadowCaster(newRoomMeshes.ceiling);
      newRoomMeshes.walls.forEach((w) => shadowGen.addShadowCaster(w));

      setupAutoHideWalls(scene, newRoomMeshes.walls, camera);
      updateRoomDimensions(scene);
    });
  }, [debouncedRoomConfig]);

  // --- 2. LOAD MAIN MODEL ---
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    const updateMainModel = async () => {
      // 1. Selalu hapus model lama jika ada (bahkan jika mainModel sekarang kosong)
      if (mainMeshRef.current) {
        mainMeshRef.current.dispose();
        mainMeshRef.current = null;
      }

      // 2. Hanya load model baru jika string mainModel TIDAK kosong

      if (mainModel) {
        const savedTransform = presentRef.current.mainModelTransform;
        const mesh = await loadMainModel(
          mainModel,
          activeTexture,
          scene,
          savedTransform,
        );
        mainMeshRef.current = mesh;
      }
    };

    updateMainModel();
  }, [mainModel]);

  // --- 3. SYNC ADDITIONAL MODELS (FIX UNTUK UNDO/REDO) ---
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    const syncModels = async () => {
      const currentMeshes = getAdditionalMeshes(scene, mainMeshRef.current);

      console.log("🔄 Syncing models...");
      console.log("📦 Store has:", additionalModels);
      console.log(
        "🎭 Scene has:",
        currentMeshes.map((m) => m.name),
      );

      currentMeshes.forEach((mesh) => {
        if (!additionalModels.includes(mesh.name)) {
          mesh.dispose();
        }
      });

      // Load Mesh baru atau Sync Mesh yang hilang
      // Kita iterasi berdasarkan index di additionalModels untuk mencocokkan dengan transforms
      for (let i = 0; i < additionalModels.length; i++) {
        const uniqueId = additionalModels[i];

        // Cek apakah mesh sudah ada di scene
        const existingMesh = scene.getMeshByName(uniqueId);

        if (!existingMesh) {
          // Extract nama file asli
          const parts = uniqueId.split("_");
          const modelName = parts.slice(0, -2).join("_");

          // AMBIL TRANSFORM DARI STORE BERDASARKAN INDEX
          // Pastikan additionalTransforms di store sinkron dengan additionalModels array
          const savedTransform = presentRef.current.additionalTransforms[i];

          await loadAdditionalModel(
            modelName,
            activeTexture,
            scene,
            mainMeshRef.current,
            savedTransform, // <-- Kirim data history
          );
        }
      }
    };
    syncModels();
  }, [additionalModels]); // Trigger saat jumlah berubah

  // --- 4. UPDATE TEXTURE ---
  useEffect(() => {
    if (!sceneRef.current || !debouncedActiveTexture) return;
    const scene = sceneRef.current;

    updateAllTextures(scene, debouncedActiveTexture, mainMeshRef.current);
  }, [debouncedActiveTexture]);

  // ⭐ --- 5. RESTORE POSITIONS SAAT UNDO/REDO ---
  useEffect(() => {
    // console.log("🔄 RESTORE EFFECT TRIGGERED");

    if (!sceneRef.current) {
      // console.log("⚠️ No scene ref");
      return;
    }

    // Restore main model transform
    if (present.mainModelTransform && mainMeshRef.current) {
      const t = present.mainModelTransform;
      // console.log("📍 Restoring main model to:", t);
      mainMeshRef.current.position.set(
        t.position.x,
        t.position.y,
        t.position.z,
      );
      mainMeshRef.current.rotation.y = t.rotation;
      // console.log("✅ Main model restored");
    } else {
      // console.log("⚠️ No main transform or mesh");
    }

    // Restore additional transforms
    const additionalMeshes = getAdditionalMeshes(
      sceneRef.current,
      mainMeshRef.current,
    );
    // console.log("🔍 Additional meshes found:", additionalMeshes.length);

    present.additionalTransforms.forEach((transform, index) => {
      const mesh = additionalMeshes[index];
      if (mesh) {
        // console.log(`📍 Restoring mesh ${index} (${mesh.name}) to:`, transform);
        mesh.position.set(
          transform.position.x,
          transform.position.y,
          transform.position.z,
        );
        mesh.rotation.y = transform.rotation;
        // console.log(`✅ Mesh ${index} restored`);
      } else {
        // console.log(`⚠️ No mesh at index ${index}`);
      }
    });
  }, [present.mainModelTransform, present.additionalTransforms]);

  return (
    <canvas ref={canvasRef} className="h-full w-full touch-none outline-none" />
  );
};
