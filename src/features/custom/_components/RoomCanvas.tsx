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

interface RoomCanvasProps {
  mainModel: string;
  activeTexture: string;
  additionalModels: string[];
}

export const RoomCanvasThree = ({
  mainModel,
  activeTexture,
  additionalModels,
}: RoomCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const mainMeshRef = useRef<BABYLON.AbstractMesh | null>(null);

  // --- 1. INITIAL SCENE SETUP ---
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true);

    // Create scene with all setup (includes smooth camera & auto-snap system)
    const scene = createScene(canvas, engine);
    sceneRef.current = scene;

    // Start render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle resize
    const handleResize = () => engine.resize();
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => engine.resize());
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      engine.dispose();
    };
  }, []);

  // --- 2. LOAD MAIN MODEL ---
  useEffect(() => {
    if (!sceneRef.current || !mainModel) return;
    const scene = sceneRef.current;

    const load = async () => {
      // Remove old mesh
      if (mainMeshRef.current) {
        mainMeshRef.current.dispose();
        mainMeshRef.current = null;
      }

      // Load new mesh (will be positioned at center back wall)
      const mesh = await loadMainModel(mainModel, activeTexture, scene);
      mainMeshRef.current = mesh;
    };

    load();
  }, [mainModel]);

  // --- 3. LOAD ADDITIONAL MODELS WITH AUTO-SNAP ---
  useEffect(() => {
    if (!sceneRef.current || additionalModels.length === 0) return;
    const scene = sceneRef.current;
    const lastAddedModel = additionalModels[additionalModels.length - 1];

    const load = async () => {
      // Will auto-snap next to existing furniture
      await loadAdditionalModel(
        lastAddedModel,
        activeTexture,
        scene,
        mainMeshRef.current,
      );
    };

    load();
  }, [additionalModels.length]);

  // --- 4. UPDATE TEXTURE ---
  useEffect(() => {
    if (!sceneRef.current || !activeTexture) return;
    const scene = sceneRef.current;

    updateAllTextures(scene, activeTexture, mainMeshRef.current);
  }, [activeTexture]);

  return (
    <canvas ref={canvasRef} className="h-full w-full touch-none outline-none" />
  );
};
