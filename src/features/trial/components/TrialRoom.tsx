"use client";

import React, { useEffect, useRef } from "react";

import { initTrialRoom } from "./TrialSceneSetup";

export const TrialRoom = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const cleanup = initTrialRoom(canvasRef.current);
    return cleanup;
  }, []);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-stone-100">
      <div className="absolute top-4 left-4 z-10 max-w-xs rounded-2xl border bg-white/85 p-4 shadow-lg backdrop-blur">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-stone-700">
          Trial Room
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Pure room setup only. No drag system, no model logic, only the base
          room with textures from the public folder.
        </p>
      </div>

      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none outline-none"
      />
    </div>
  );
};
