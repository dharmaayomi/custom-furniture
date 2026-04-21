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
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none outline-none"
      />
    </div>
  );
};
