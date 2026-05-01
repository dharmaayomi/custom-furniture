import * as BABYLON from "@babylonjs/core";
import { setupTrialCamera } from "./TrialCameraSetup";
import { setupTrialRoom } from "./TrialRoomSetup";
import { setupTrialAutoHideWalls } from "../furniture/WallVisibility";
import { DEFAULT_TRIAL_ROOM_CONFIG, TrialRoomConfig } from "./TrialConfig";
import {
  setupTrialLighting,
  TrialLightingResult,
  TrialThemeMode,
} from "./TrialLightingSetup";

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
 */

export interface TrialSceneContext {
  engine: BABYLON.Engine;
  scene: BABYLON.Scene;
  camera: BABYLON.ArcRotateCamera;
  lighting: TrialLightingResult;
  updateRoomConfig: (roomConfig: TrialRoomConfig) => void;
  updateThemeMode: (themeMode: TrialThemeMode) => void;
  /** Dispose seluruh scene + engine + observer */
  dispose: () => void;
}

const applySceneThemeMood = (
  scene: BABYLON.Scene,
  themeMode: TrialThemeMode,
) => {
  const config = scene.imageProcessingConfiguration;
  config.toneMappingEnabled = true;
  config.toneMappingType =
    BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;

  if (themeMode === "dark") {
    config.exposure = 1;
    config.contrast = 1.2;
    return;
  }

  config.exposure = 1.1;
  config.contrast = 1.35;
};

export const initTrialScene = (
  canvas: HTMLCanvasElement,
  initialRoomConfig: TrialRoomConfig = DEFAULT_TRIAL_ROOM_CONFIG,
  initialThemeMode: TrialThemeMode = "light",
): TrialSceneContext => {
  const engine = new BABYLON.Engine(canvas, true, {
    adaptToDeviceRatio: true,
    preserveDrawingBuffer: true,
    alpha: true, // ← ini
  });

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

  const camera = setupTrialCamera(canvas, scene, initialRoomConfig);
  const lighting = setupTrialLighting(
    scene,
    initialRoomConfig,
    initialThemeMode,
  );
  let room = setupTrialRoom(scene, initialRoomConfig);

  // room.shadowCasters.forEach((mesh) => {
  //   lighting.shadowGenerator.addShadowCaster(mesh, false);
  // });

  // Wall auto-hide
  let wallObserver = setupTrialAutoHideWalls(scene, room.walls, camera);

  applySceneThemeMood(scene, initialThemeMode);

  // Render loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  let resizeFrame = 0;
  let lastWidth = 0;
  let lastHeight = 0;

  const resizeEngine = () => {
    resizeFrame = 0;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (width === 0 || height === 0) {
      return;
    }

    if (width === lastWidth && height === lastHeight) {
      return;
    }

    lastWidth = width;
    lastHeight = height;
    engine.resize();
  };

  const scheduleResize = () => {
    if (resizeFrame) {
      return;
    }

    resizeFrame = window.requestAnimationFrame(resizeEngine);
  };

  const handleResize = () => scheduleResize();
  const resizeTarget = canvas.parentElement ?? canvas;
  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          scheduleResize();
        })
      : null;

  window.addEventListener("resize", handleResize);
  resizeObserver?.observe(resizeTarget);
  scheduleResize();

  const updateRoomConfig = (nextRoomConfig: TrialRoomConfig) => {
    scene.onBeforeRenderObservable.remove(wallObserver);
    // room.shadowCasters.forEach((mesh) => {
    //   lighting.shadowGenerator.removeShadowCaster(mesh);
    // });
    room.dispose();

    room = setupTrialRoom(scene, nextRoomConfig);
    // room.shadowCasters.forEach((mesh) => {
    //   lighting.shadowGenerator.addShadowCaster(mesh, false);
    // });
    lighting.updateForRoomConfig(nextRoomConfig);
    wallObserver = setupTrialAutoHideWalls(scene, room.walls, camera);
    scheduleResize();
  };

  const updateThemeMode = (themeMode: TrialThemeMode) => {
    lighting.updateThemeMode(themeMode);
    applySceneThemeMood(scene, themeMode);
  };

  const dispose = () => {
    window.removeEventListener("resize", handleResize);
    resizeObserver?.disconnect();
    if (resizeFrame) {
      window.cancelAnimationFrame(resizeFrame);
    }
    scene.onBeforeRenderObservable.remove(wallObserver);
    room.dispose();
    scene.dispose();
    engine.dispose();
  };

  return {
    engine,
    scene,
    camera,
    lighting,
    updateRoomConfig,
    updateThemeMode,
    dispose,
  };
};

// ─── Helpers yang dipakai pemanggil untuk hitung posisi furniture ─────────────

/**
 * Hitung posisi awal furniture di dinding belakang (nempel ke wall_back).
 * Pemanggil bisa override Z offset sesuai kedalaman model yang sudah diketahui.
 */
export const getBackWallPosition = (
  roomConfig: TrialRoomConfig = DEFAULT_TRIAL_ROOM_CONFIG,
  zOffset = 0.01,
): BABYLON.Vector3 => {
  const { depth, floorThickness } = roomConfig;
  return new BABYLON.Vector3(
    0, // X: di-center, dikoreksi loader setelah load
    floorThickness, // Y: tepat di atas lantai
    depth / 2 - zOffset, // Z: nempel ke dinding belakang
  );
};
