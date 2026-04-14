import React from "react";
import { initTrialRoom } from "./TrialSceneSetup";

export const TrialRoom = () => {
  // Fungsi ini dipanggil React saat elemen canvas dibuat
  const handleCanvasRef = (canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      // Inisialisasi Babylon secara langsung
      initTrialRoom(canvas);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-slate-200">
      {/* Panel Sederhana (Mockup Sidebar di /custom) */}
      <div className="absolute top-4 left-4 z-10 rounded-lg bg-white/80 p-4 shadow-md backdrop-blur">
        <h2 className="font-bold">Room Controller</h2>
        <p className="text-xs text-gray-500">Mode: Hardcoded Flow</p>
      </div>

      {/* Canvas Replikasi /custom */}
      <canvas
        ref={handleCanvasRef}
        className="h-full w-full touch-none outline-none"
      />
    </div>
  );
};
