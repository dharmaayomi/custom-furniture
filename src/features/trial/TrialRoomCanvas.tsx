"use client";

import { useEffect, useRef } from "react";
import {
  loadProductBase,
  TrialModelLoadResult,
} from "./furniture/TrialModelLoader";
import { getBackWallPosition, initTrialScene } from "./core/TrialSceneSetup";

/**
 * TrialRoomCanvas.tsx
 *
 * React entry point untuk Trial Room.
 * Tanggung jawabnya:
 *   1. Mount canvas
 *   2. Init scene (engine, camera, lighting, room, post-processing)
 *   3. Load model dengan posisi yang dihitung dari helper SceneSetup
 *   4. Cleanup saat unmount
 *
 * Tidak ada logika Babylon di sini — semuanya didelegasikan ke layer yang tepat.
 */

const TRIAL_MODEL_PATH = "/assets/3d/cobalagi-antinode.glb";

export const TrialRoomCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const {
      scene,
      lighting,
      dispose: disposeScene,
    } = initTrialScene(canvasRef.current);

    let loadedModel: TrialModelLoadResult | null = null;
    let isMounted = true;

    const loadModel = async () => {
      const result = await loadProductBase(scene, {
        modelPath: TRIAL_MODEL_PATH,
        meshName: "trial-product-base",
        initialPosition: getBackWallPosition(0.01),
        shadowGenerator: lighting.shadowGenerator,
      });

      // Guard: komponen bisa unmount sebelum load selesai
      if (!isMounted) {
        result?.dispose();
        return;
      }

      loadedModel = result;
    };

    void loadModel();

    return () => {
      isMounted = false;
      loadedModel?.dispose();
      disposeScene();
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="h-full w-full touch-none outline-none" />
  );
};
