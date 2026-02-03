import { updateRoomDimensions } from "@/features/custom/_components/MeshUtils_WallSnap";
import { CONFIG } from "@/features/custom/_components/RoomConfig";
import * as BABYLON from "@babylonjs/core";
import { ASSET_PRICES, TEXTURE_PRICES, extractModelNameFromId } from "@/lib/price";
import { create } from "zustand";

// --- 1. SETUP DATA HARGA (DATABASE SEMENTARA) ---
// Di aplikasi real, ini mungkin dari API atau database

// Helper untuk hitung total harga saat ini
const calculateTotal = (
  mainModel: string,
  additionalModels: string[],
  activeTexture: string,
) => {
  let total = ASSET_PRICES[mainModel] || 0;

  additionalModels.forEach((model) => {
    // Extract the actual model name from unique ID
    const modelName = extractModelNameFromId(model);
    total += ASSET_PRICES[modelName] || 0;
  });

  total += TEXTURE_PRICES[activeTexture] || 0;

  return total;
};

export interface RoomConfig {
  width: number; // rw
  depth: number; // rd
  height: number; // wallHeight
  wallColor: string; // Hex color
  floorTexture: string; // Texture path
}
export interface FurnitureTransform {
  modelName: string;
  position: { x: number; y: number; z: number };
  rotation: number;
}

// --- 2. UPDATE INTERFACE ---
interface RoomData {
  mainModel: string;
  activeTexture: string;
  additionalModels: string[];
  totalPrice: number; // Tambahkan field ini
  mainModelTransform?: FurnitureTransform; // Posisi & rotasi main model
  additionalTransforms: FurnitureTransform[];
  roomConfig: RoomConfig;
  showHuman: boolean;
}

interface RoomStore {
  past: RoomData[];
  present: RoomData;
  future: RoomData[];

  setMainModel: (model: string) => void;
  setActiveTexture: (texture: string) => void;
  addAdditionalModel: (model: string) => void;

  updateRoomConfig: (config: Partial<RoomConfig>) => void;

  undo: () => void;
  redo: () => void;
  reset: () => void;
  shadowGenerator: BABYLON.ShadowGenerator | null;
  setShadowGenerator: (generator: BABYLON.ShadowGenerator | null) => void;
  updateMainModelTransform: (transform: FurnitureTransform) => void;
  updateAdditionalTransform: (
    index: number,
    transform: FurnitureTransform,
  ) => void;
  saveTransformToHistory: (
    index: number,
    transform: FurnitureTransform,
    isMainModel: boolean,
  ) => void;
  updateTransformSilent: (
    index: number,
    transform: FurnitureTransform,
    isMainModel: boolean,
  ) => void;
  captureCurrentState: () => void;
  toggleHuman: () => void;
}

// State Awal
const INITIAL_MAIN = "";
const INITIAL_TEXTURE = "";
const INITIAL_ROOM_CONFIG: RoomConfig = {
  width: 620,
  depth: 420,
  height: 300,
  wallColor: "#F2F0EB",
  floorTexture: "/assets/texture/wood-texture.jpg",
};

const INITIAL_STATE: RoomData = {
  mainModel: INITIAL_MAIN,
  activeTexture: INITIAL_TEXTURE,
  additionalModels: [],
  totalPrice: calculateTotal(INITIAL_MAIN, [], INITIAL_TEXTURE),
  mainModelTransform: undefined,
  additionalTransforms: [],
  roomConfig: INITIAL_ROOM_CONFIG,
  showHuman: false,
};

export const useRoomStore = create<RoomStore>((set) => ({
  past: [],
  present: INITIAL_STATE,
  future: [],

  // --- 3. ACTIONS DENGAN KALKULASI HARGA OTOMATIS ---

  setMainModel: (model) =>
    set((state) => {
      if (state.present.mainModel === model) return state;

      // Hitung harga baru
      const newPrice = calculateTotal(
        model,
        state.present.additionalModels,
        state.present.activeTexture,
      );

      const newPresent = {
        ...state.present,
        mainModel: model,
        totalPrice: newPrice,
      };

      return {
        past: [...state.past, state.present],
        present: newPresent,
        future: [],
      };
    }),
  shadowGenerator: null,

  setShadowGenerator: (generator) => set({ shadowGenerator: generator }),
  setActiveTexture: (texture) =>
    set((state) => {
      if (state.present.activeTexture === texture) return state;

      const newPrice = calculateTotal(
        state.present.mainModel,
        state.present.additionalModels,
        texture,
      );

      const newPresent = {
        ...state.present,
        activeTexture: texture,
        totalPrice: newPrice,
      };

      return {
        past: [...state.past, state.present],
        present: newPresent,
        future: [],
      };
    }),

  toggleHuman: () =>
    set((state) => ({
      present: { ...state.present, showHuman: !state.present.showHuman },
      // Gunakan update silent atau capture history tergantung keinginan Anda
    })),

  addAdditionalModel: (model) =>
    set((state) => {
      const currentPresent = state.present;
      const uniqueId = `${model}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newModels = [...currentPresent.additionalModels, uniqueId];

      const newTransforms = [
        ...currentPresent.additionalTransforms,
        {
          modelName: uniqueId,
          position: { x: 0, y: 0, z: 0 },
          rotation: 0,
        },
      ];
      
      // Calculate price using the new models list (which contains uniqueIds)
      const newPrice = calculateTotal(
        state.present.mainModel,
        newModels, // Pass uniqueIds, calculateTotal will extract model names
        state.present.activeTexture,
      );
      
      const newPresent = {
        ...currentPresent,
        additionalModels: newModels,
        totalPrice: newPrice,
        additionalTransforms: newTransforms,
      };

      return {
        past: [...state.past, currentPresent],
        present: newPresent,
        future: state.future,
      };
    }),

  updateRoomConfig: (config) =>
    set((state) => {
      const newConfig = { ...state.present.roomConfig, ...config };
      const newPresent = { ...state.present, roomConfig: newConfig };
      updateRoomDimensions();

      return {
        past: [...state.past, state.present],
        present: newPresent,
        future: [],
      };
    }),

  updateMainModelTransform: (transform) =>
    set((state) => ({
      present: {
        ...state.present,
        mainModelTransform: transform,
      },
    })),

  updateAdditionalTransform: (index, transform) =>
    set((state) => {
      const newTransforms = [...state.present.additionalTransforms];
      newTransforms[index] = transform;

      return {
        present: {
          ...state.present,
          additionalTransforms: newTransforms,
        },
      };
    }),

  saveTransformToHistory: (
    index: number,
    transform: FurnitureTransform,
    isMainModel: boolean,
  ) =>
    set((state) => {
      let newPresent: RoomData;

      if (isMainModel) {
        newPresent = {
          ...state.present,
          mainModelTransform: transform,
        };
      } else {
        const newTransforms = [...state.present.additionalTransforms];
        newTransforms[index] = transform;
        newPresent = {
          ...state.present,
          additionalTransforms: newTransforms,
        };
      }

      return {
        past: [...state.past, state.present],
        present: newPresent,
        future: [],
      };
    }),

  captureCurrentState: () =>
    set((state) => {
      return {
        past: [...state.past, state.present],
        present: state.present,
        future: [],
      };
    }),

  updateTransformSilent: (index, transform, isMainModel) =>
    set((state) => {
      let newPresent;

      if (isMainModel) {
        newPresent = {
          ...state.present,
          mainModelTransform: transform,
        };
      } else {
        const newTransforms = [...state.present.additionalTransforms];
        newTransforms[index] = transform;
        newPresent = {
          ...state.present,
          additionalTransforms: newTransforms,
        };
      }
      // Return state tanpa mengubah 'past'
      return {
        past: state.past,
        present: newPresent,
        future: state.future,
      };
    }),

  // --- 4. UNDO & REDO (Tidak perlu diubah logic-nya) ---
  // Karena 'price' ada di dalam objek 'present', maka saat undo,
  // dia akan me-replace 'present' dengan data dari 'past' (yang berisi harga lama).

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;

      const next = state.future[0];
      const newFuture = state.future.slice(1);

      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    }),

  reset: () => set({ past: [], present: INITIAL_STATE, future: [] }),
}));
