import { updateRoomDimensions } from "@/features/custom/_components/MeshUtils_WallSnap";
import { CONFIG } from "@/features/custom/_components/RoomConfig";
import * as BABYLON from "@babylonjs/core";
import {
  ASSET_PRICES,
  TEXTURE_PRICES,
  extractModelNameFromId,
} from "@/lib/price";
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
  texture?: string;
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
  selectedFurniture: string | null; // Track selected furniture mesh name
}

interface RoomStore {
  past: RoomData[];
  present: RoomData;
  future: RoomData[];

  setMainModel: (model: string) => void;
  setActiveTexture: (texture: string) => void;
  setMeshTexture: (meshName: string, texture: string) => void;
  addAdditionalModel: (model: string) => void;
  setSelectedFurniture: (meshName: string | null) => void;
  duplicateSelectedFurniture: () => void;
  deleteSelectedFurniture: () => void;

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
  selectedFurniture: null,
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
        // changes

        mainModelTransform: undefined,
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
      console.log("setActiveTexture called with:", texture);
      // Skip update only if setting the same non-empty texture
      // Always allow clearing texture (texture === "") even if it's already empty
      if (state.present.activeTexture === texture && texture !== "") {
        console.log("Skipping update - same non-empty texture");
        return state;
      }

      console.log(
        "Updating texture from",
        state.present.activeTexture,
        "to",
        texture,
      );

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

  setMeshTexture: (meshName: string, texture: string) =>
    set((state) => {
      // Persist texture on the corresponding FurnitureTransform so it survives undo/redo
      const extracted = meshName; // meshName is expected to be the unique id used in transforms

      // Determine whether the meshName corresponds to the main model transform
      const mainTransformName = state.present.mainModelTransform?.modelName;
      if (mainTransformName && extracted === mainTransformName) {
        const current = state.present.mainModelTransform || {
          modelName: state.present.mainModel,
          position: { x: 0, y: 0, z: 0 },
          rotation: 0,
        };

        const existing = current.texture || "";
        if (existing === texture && texture !== "") return state;

        const newMainTransform = { ...current };
        if (!texture || texture === "") {
          delete newMainTransform.texture;
        } else {
          newMainTransform.texture = texture;
        }

        const newPresent = {
          ...state.present,
          mainModelTransform: newMainTransform,
        };

        return {
          past: [...state.past, state.present],
          present: newPresent,
          future: [],
        };
      }

      // Otherwise try to find a matching additional model by exact unique id
      const idx = state.present.additionalModels.findIndex(
        (id) => id === extracted,
      );

      if (idx === -1) {
        // Fallback: no matching transform found, no-op
        return state;
      }

      const currentTransforms = [...state.present.additionalTransforms];
      const current = currentTransforms[idx] || {
        modelName: state.present.additionalModels[idx],
        position: { x: 0, y: 0, z: 0 },
        rotation: 0,
      };

      const existing = current.texture || "";
      if (existing === texture && texture !== "") return state;

      const newTransform = { ...current };
      if (!texture || texture === "") {
        delete newTransform.texture;
      } else {
        newTransform.texture = texture;
      }

      currentTransforms[idx] = newTransform;

      const newPresent = {
        ...state.present,
        additionalTransforms: currentTransforms,
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

  setSelectedFurniture: (meshName) =>
    set((state) => ({
      present: { ...state.present, selectedFurniture: meshName },
    })),

  duplicateSelectedFurniture: () =>
    set((state) => {
      const selected = state.present.selectedFurniture;
      if (!selected) return state;

      // Extract the actual model name from selected furniture
      const extractedSelected = extractModelNameFromId(selected);

      let modelNameToDuplicate = "";

      // Check if it's main model
      if (extractedSelected === state.present.mainModel) {
        modelNameToDuplicate = state.present.mainModel;
      } else {
        // Find the additional model name from the selected mesh name
        const found = state.present.additionalModels.find(
          (id) =>
            id === selected || extractModelNameFromId(id) === extractedSelected,
        );
        if (found) {
          modelNameToDuplicate = extractModelNameFromId(found);
        }
      }

      if (!modelNameToDuplicate) return state;

      // Add as additional model
      const uniqueId = `${modelNameToDuplicate}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newModels = [...state.present.additionalModels, uniqueId];

      const newTransforms = [
        ...state.present.additionalTransforms,
        {
          modelName: uniqueId,
          position: { x: 0, y: 0, z: 0 },
          rotation: 0,
        },
      ];

      const newPrice = calculateTotal(
        state.present.mainModel,
        newModels,
        state.present.activeTexture,
      );

      const newPresent = {
        ...state.present,
        additionalModels: newModels,
        totalPrice: newPrice,
        additionalTransforms: newTransforms,
        selectedFurniture: null,
      };

      return {
        past: [...state.past, state.present],
        present: newPresent,
        future: [],
      };
    }),

  deleteSelectedFurniture: () =>
    set((state) => {
      const selected = state.present.selectedFurniture;
      if (!selected) return state;

      // Extract the actual model name from selected furniture
      const extractedSelected = extractModelNameFromId(selected);

      // Check if it's main model
      if (extractedSelected === state.present.mainModel) {
        // If there are additional models, promote the first one to main model
        if (state.present.additionalModels.length > 0) {
          const promotedModelId = state.present.additionalModels[0];
          const promotedModelName = extractModelNameFromId(promotedModelId);
          const promotedTransform = state.present.additionalTransforms[0];

          // Remove from additional models
          const newAdditionalModels = state.present.additionalModels.slice(1);
          const newAdditionalTransforms =
            state.present.additionalTransforms.slice(1);

          const newPrice = calculateTotal(
            promotedModelName,
            newAdditionalModels,
            state.present.activeTexture,
          );

          const newPresent = {
            ...state.present,
            mainModel: promotedModelName,
            mainModelTransform: promotedTransform,
            additionalModels: newAdditionalModels,
            additionalTransforms: newAdditionalTransforms,
            totalPrice: newPrice,
            selectedFurniture: null,
          };

          return {
            past: [...state.past, state.present],
            present: newPresent,
            future: [],
          };
        } else {
          // No additional models, just clear the main model
          const newPresent = {
            ...state.present,
            mainModel: "",
            mainModelTransform: undefined,
            selectedFurniture: null,
            totalPrice: calculateTotal(
              "",
              state.present.additionalModels,
              state.present.activeTexture,
            ),
          };
          return {
            past: [...state.past, state.present],
            present: newPresent,
            future: [],
          };
        }
      }

      // Find and remove from additional models
      const modelIndex = state.present.additionalModels.findIndex(
        (id) =>
          id === selected || extractModelNameFromId(id) === extractedSelected,
      );

      if (modelIndex === -1) return state;

      const newModels = state.present.additionalModels.filter(
        (_, idx) => idx !== modelIndex,
      );
      const newTransforms = state.present.additionalTransforms.filter(
        (_, idx) => idx !== modelIndex,
      );

      const newPrice = calculateTotal(
        state.present.mainModel,
        newModels,
        state.present.activeTexture,
      );

      const newPresent = {
        ...state.present,
        additionalModels: newModels,
        additionalTransforms: newTransforms,
        totalPrice: newPrice,
        selectedFurniture: null,
      };

      return {
        past: [...state.past, state.present],
        present: newPresent,
        future: [],
      };
    }),

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

      // Clear selected furniture on undo
      const clearedPrevious = { ...previous, selectedFurniture: null };

      return {
        past: newPast,
        present: clearedPrevious,
        future: [state.present, ...state.future],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;

      const next = state.future[0];
      const newFuture = state.future.slice(1);

      // Clear selected furniture on redo
      const clearedNext = { ...next, selectedFurniture: null };

      return {
        past: [...state.past, state.present],
        present: clearedNext,
        future: newFuture,
      };
    }),

  reset: () => set({ past: [], present: INITIAL_STATE, future: [] }),
}));
