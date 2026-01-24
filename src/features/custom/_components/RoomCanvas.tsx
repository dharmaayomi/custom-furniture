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

interface RoomCanvasProps {
  mainModel: string;
  activeTexture: string;
  additionalModels: string[];
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
}: RoomCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const mainMeshRef = useRef<BABYLON.AbstractMesh | null>(null);
  const present = useRoomStore((state) => state.present);

  // --- 1. INITIAL SCENE SETUP ---
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true);

    const scene = createScene(canvas, engine);
    sceneRef.current = scene;

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => engine.resize();
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => engine.resize());
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      engine.dispose();
    };
  }, []);

  // --- 2. LOAD MAIN MODEL ---
  useEffect(() => {
    // Hapus "!mainModel" dari pengecekan awal
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
        const mesh = await loadMainModel(mainModel, activeTexture, scene);
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

      // KASUS A: Store lebih banyak -> TAMBAH mesh
      if (additionalModels.length > currentMeshes.length) {
        const indexToAdd = currentMeshes.length;
        const modelToLoad = additionalModels[indexToAdd];

        if (modelToLoad) {
          await loadAdditionalModel(
            modelToLoad,
            activeTexture,
            scene,
            mainMeshRef.current,
          );
        }
      }
      // KASUS B: Scene lebih banyak -> HAPUS mesh (UNDO)
      else if (currentMeshes.length > additionalModels.length) {
        const diff = currentMeshes.length - additionalModels.length;

        // Hapus mesh dari belakang (LIFO)
        for (let i = 0; i < diff; i++) {
          const meshToRemove = currentMeshes[currentMeshes.length - 1 - i];
          if (meshToRemove) {
            console.log("🗑️ Removing mesh:", meshToRemove.name);
            meshToRemove.dispose();
          }
        }
      }
    };

    syncModels();
  }, [additionalModels.length]); // Trigger saat jumlah berubah

  // --- 4. UPDATE TEXTURE ---
  useEffect(() => {
    if (!sceneRef.current || !activeTexture) return;
    const scene = sceneRef.current;

    updateAllTextures(scene, activeTexture, mainMeshRef.current);
  }, [activeTexture]);

  // ⭐ --- 5. RESTORE POSITIONS SAAT UNDO/REDO ---
  useEffect(() => {
    console.log("🔄 RESTORE EFFECT TRIGGERED");

    if (!sceneRef.current) {
      console.log("⚠️ No scene ref");
      return;
    }

    console.log("📦 Present state:", {
      mainTransform: present.mainModelTransform,
      additionalTransforms: present.additionalTransforms,
    });

    // Restore main model transform
    if (present.mainModelTransform && mainMeshRef.current) {
      const t = present.mainModelTransform;
      console.log("📍 Restoring main model to:", t);
      mainMeshRef.current.position.set(
        t.position.x,
        t.position.y,
        t.position.z,
      );
      mainMeshRef.current.rotation.y = t.rotation;
      console.log("✅ Main model restored");
    } else {
      console.log("⚠️ No main transform or mesh");
    }

    // Restore additional transforms
    const additionalMeshes = getAdditionalMeshes(
      sceneRef.current,
      mainMeshRef.current,
    );
    console.log("🔍 Additional meshes found:", additionalMeshes.length);

    present.additionalTransforms.forEach((transform, index) => {
      const mesh = additionalMeshes[index];
      if (mesh) {
        console.log(`📍 Restoring mesh ${index} (${mesh.name}) to:`, transform);
        mesh.position.set(
          transform.position.x,
          transform.position.y,
          transform.position.z,
        );
        mesh.rotation.y = transform.rotation;
        console.log(`✅ Mesh ${index} restored`);
      } else {
        console.log(`⚠️ No mesh at index ${index}`);
      }
    });
  }, [present.mainModelTransform, present.additionalTransforms]);

  return (
    <canvas ref={canvasRef} className="h-full w-full touch-none outline-none" />
  );
};
