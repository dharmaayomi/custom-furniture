import * as BABYLON from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials/grid";
import { setupTrialCamera } from "./TrialCameraSetup";

import { setupTrialRoom } from "./TrialRoomSetup";

import { TRIAL_ROOM_CONFIG } from "./TrialConfig";
import { setupTrialAutoHideWalls } from "../furniture/WallVisibility";
import { setupTrialLighting, TrialLightingResult } from "./TrialLightingSetup";

/**
 * TrialSceneSetup.ts
 *
 * Tanggung jawab file ini:
 *   1. Buat engine + scene
 *   2. Setup camera, lighting, room geometry
 *   3. Pasang wall auto-hide observer
 *   4. Konfigurasi post-processing (tone mapping)
 *   5. Return TrialSceneContext — semua yang dibutuhkan layer di atasnya
 *
 * Tidak tahu tentang furniture, model, atau store.
 */

export interface TrialSceneContext {
  engine: BABYLON.Engine;
  scene: BABYLON.Scene;
  camera: BABYLON.ArcRotateCamera;
  lighting: TrialLightingResult;
  /** Dispose seluruh scene + engine + observer */
  dispose: () => void;
}

export const initTrialScene = (
  canvas: HTMLCanvasElement,
): TrialSceneContext => {
  const engine = new BABYLON.Engine(canvas, true, {
    adaptToDeviceRatio: true,
    preserveDrawingBuffer: true,
    alpha: true, // ← ini
  });

  const scene = new BABYLON.Scene(engine);
  // scene.clearColor = new BABYLON.Color4(0.95, 0.96, 0.96, 1);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

  const camera = setupTrialCamera(canvas, scene);
  const lighting = setupTrialLighting(scene);
  const room = setupTrialRoom(scene);

  // Shadow casters: semua mesh structural kecuali lantai vinyl & floor base
  const shadowCasters: BABYLON.Mesh[] = [
    room.backWall,
    room.frontWall,
    room.leftWall,
    room.rightWall,
    room.ceiling,
    room.innerBackWall,
    room.innerFrontWall,
    room.innerLeftWall,
    room.innerRightWall,
    room.innerCeiling,
  ];
  shadowCasters.forEach((mesh) => {
    lighting.shadowGenerator.addShadowCaster(mesh, false);
  });

  // Wall auto-hide
  const wallObserver = setupTrialAutoHideWalls(scene, room.walls, camera);

  // Post-processing
  scene.imageProcessingConfiguration.toneMappingEnabled = true;
  scene.imageProcessingConfiguration.toneMappingType =
    BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
  scene.imageProcessingConfiguration.exposure = 1.1;
  scene.imageProcessingConfiguration.contrast = 1.35;

  // Render loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  const handleResize = () => engine.resize();
  window.addEventListener("resize", handleResize);

  const dispose = () => {
    window.removeEventListener("resize", handleResize);
    scene.onBeforeRenderObservable.remove(wallObserver);
    scene.dispose();
    engine.dispose();
  };

  return { engine, scene, camera, lighting, dispose };
};

// ─── Helpers yang dipakai pemanggil untuk hitung posisi furniture ─────────────

/**
 * Hitung posisi awal furniture di dinding belakang (nempel ke wall_back).
 * Pemanggil bisa override Z offset sesuai kedalaman model yang sudah diketahui.
 */
export const getBackWallPosition = (zOffset = 0.01): BABYLON.Vector3 => {
  const { depth, floorThickness } = TRIAL_ROOM_CONFIG;
  return new BABYLON.Vector3(
    0, // X: di-center, dikoreksi loader setelah load
    floorThickness, // Y: tepat di atas lantai
    depth / 2 - zOffset, // Z: nempel ke dinding belakang
  );
};
