import { updateRoomDimensions } from "@/features/custom/_components/MeshUtils_WallSnap";
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
  mainModels: string[],
  addOnModels: string[],
  activeTexture: string,
) => {
  let total = 0;

  mainModels.forEach((model) => {
    const modelName = extractModelNameFromId(model);
    total += ASSET_PRICES[modelName] || 0;
  });

  addOnModels.forEach((model) => {
    const modelName = extractModelNameFromId(model);
    total += ASSET_PRICES[modelName] || 0;
  });

  total += TEXTURE_PRICES[activeTexture] || 0;

  return total;
};

const getBaseModelName = (modelName: string) =>
  modelName.replace(/\.glb$/i, "");

const getNextIndexedId = (modelName: string, existingModels: string[]) => {
  const base = getBaseModelName(modelName);
  const count = existingModels.filter((id) => {
    const extracted = extractModelNameFromId(id);
    return getBaseModelName(extracted) === base;
  }).length;
  return `${base}_${count + 1}`;
};

export interface RoomConfig {
  width: number; // meters
  depth: number; // meters
  height: number; // meters
  wallColor: string; // Hex color
  floorTexture: string; // Texture path
}
export interface FurnitureTransform {
  modelName: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  scale?: { x: number; y: number; z: number };
  texture?: string;
}

// --- 2. UPDATE INTERFACE ---
interface RoomData {
  mainModels: string[];
  addOnModels: string[];
  activeTexture: string;
  totalPrice: number; // Tambahkan field ini
  mainModelTransforms: FurnitureTransform[]; // Posisi & rotasi main models
  addOnTransforms: FurnitureTransform[];
  roomConfig: RoomConfig;
  showHuman: boolean;
  selectedFurniture: string | null; // Track selected furniture mesh name
}

interface RoomStore {
  past: RoomData[];
  present: RoomData;
  future: RoomData[];
  designCode: string;
  setDesignCode: (code: string) => void;
  loadRoomState: (data: Partial<RoomData>) => void;

  setMainModel: (model: string) => void;
  setActiveTexture: (texture: string) => void;
  setMeshTexture: (meshName: string, texture: string) => void;
  addAddOnModel: (model: string) => void;
  setSelectedFurniture: (meshName: string | null) => void;
  duplicateSelectedFurniture: () => void;
  deleteSelectedFurniture: () => void;

  updateRoomConfig: (config: Partial<RoomConfig>) => void;

  undo: () => void;
  redo: () => void;
  reset: () => void;
  shadowGenerator: BABYLON.ShadowGenerator | null;
  setShadowGenerator: (generator: BABYLON.ShadowGenerator | null) => void;
  updateMainModelTransform: (
    index: number,
    transform: FurnitureTransform,
  ) => void;
  updateAddOnTransform: (index: number, transform: FurnitureTransform) => void;
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
const INITIAL_TEXTURE = "";
export const DEFAULT_ROOM_CONFIG: RoomConfig = {
  width: 6.2,
  depth: 4.2,
  height: 3.0,
  wallColor: "#F2F0EB",
  floorTexture: "/assets/texture/wood-texture.jpg",
};

const INITIAL_STATE: RoomData = {
  mainModels: [],
  addOnModels: [],
  activeTexture: INITIAL_TEXTURE,
  totalPrice: calculateTotal([], [], INITIAL_TEXTURE),
  mainModelTransforms: [],
  addOnTransforms: [],
  roomConfig: DEFAULT_ROOM_CONFIG,
  showHuman: false,
  selectedFurniture: null,
};

const normalizeRoomState = (data: Partial<RoomData>): RoomData => {
  const mainModels = data.mainModels ?? [];
  const addOnModels = data.addOnModels ?? [];
  const activeTexture = data.activeTexture ?? INITIAL_TEXTURE;
  const totalPrice =
    data.totalPrice ??
    calculateTotal(mainModels, addOnModels, activeTexture);

  return {
    ...INITIAL_STATE,
    ...data,
    mainModels,
    addOnModels,
    activeTexture,
    mainModelTransforms: data.mainModelTransforms ?? [],
    addOnTransforms: data.addOnTransforms ?? [],
    roomConfig: { ...DEFAULT_ROOM_CONFIG, ...(data.roomConfig ?? {}) },
    totalPrice,
    showHuman: data.showHuman ?? false,
    selectedFurniture: null,
  };
};

export const useRoomStore = create<RoomStore>((set) => ({
  past: [],
  present: INITIAL_STATE,
  future: [],
  designCode: "",
  setDesignCode: (code) => set({ designCode: code }),
  loadRoomState: (data) =>
    set(() => ({
      past: [],
      present: normalizeRoomState(data),
      future: [],
    })),

  // --- 3. ACTIONS DENGAN KALKULASI HARGA OTOMATIS ---

  setMainModel: (model) =>
    set((state) => {
      const currentPresent = state.present;
      const existing = [...currentPresent.mainModels, ...currentPresent.addOnModels];
      const uniqueId = getNextIndexedId(model, existing);
      const newMainModels = [...currentPresent.mainModels, uniqueId];
      const newMainTransforms = [
        ...currentPresent.mainModelTransforms,
        {
          modelName: uniqueId,
          position: { x: 0, y: 0, z: 0 },
          rotation: 0,
        },
      ];

      const newPrice = calculateTotal(
        newMainModels,
        currentPresent.addOnModels,
        currentPresent.activeTexture,
      );

      const newPresent = {
        ...currentPresent,
        mainModels: newMainModels,
        mainModelTransforms: newMainTransforms,
        totalPrice: newPrice,
      };

      return {
        past: [...state.past, currentPresent],
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
        return state;
      }

      const newPrice = calculateTotal(
        state.present.mainModels,
        state.present.addOnModels,
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

      // Determine whether the meshName corresponds to a main model transform
      const mainIdx = state.present.mainModelTransforms.findIndex(
        (t) => t.modelName === extracted,
      );
      const fallbackMainIdx =
        mainIdx === -1
          ? state.present.mainModels.findIndex((id) => id === extracted)
          : mainIdx;

      if (fallbackMainIdx !== -1) {
        const currentTransforms = [...state.present.mainModelTransforms];
        const current =
          currentTransforms[fallbackMainIdx] || {
            modelName: state.present.mainModels[fallbackMainIdx],
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

        currentTransforms[fallbackMainIdx] = newTransform;

        const newPresent = {
          ...state.present,
          mainModelTransforms: currentTransforms,
        };

        return {
          past: [...state.past, state.present],
          present: newPresent,
          future: [],
        };
      }

      // Otherwise try to find a matching add-on model by exact unique id
      const idx = state.present.addOnModels.findIndex((id) => id === extracted);

      if (idx === -1) {
        // Fallback: no matching transform found, no-op
        return state;
      }

      const currentTransforms = [...state.present.addOnTransforms];
      const current = currentTransforms[idx] || {
        modelName: state.present.addOnModels[idx],
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
        addOnTransforms: currentTransforms,
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

      const allModels = [
        ...state.present.mainModels,
        ...state.present.addOnModels,
      ];
      const extractedSelected = extractModelNameFromId(selected);

      const mainIndex = state.present.mainModels.findIndex(
        (id) => id === selected || extractModelNameFromId(id) === extractedSelected,
      );
      const addOnIndex = state.present.addOnModels.findIndex(
        (id) => id === selected || extractModelNameFromId(id) === extractedSelected,
      );

      if (mainIndex !== -1) {
        const modelNameToDuplicate = extractModelNameFromId(
          state.present.mainModels[mainIndex],
        );
        const uniqueId = getNextIndexedId(modelNameToDuplicate, allModels);
        const newMainModels = [...state.present.mainModels, uniqueId];
        const newMainTransforms = [
          ...state.present.mainModelTransforms,
          {
            modelName: uniqueId,
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
          },
        ];

        const newPrice = calculateTotal(
          newMainModels,
          state.present.addOnModels,
          state.present.activeTexture,
        );

        return {
          past: [...state.past, state.present],
          present: {
            ...state.present,
            mainModels: newMainModels,
            mainModelTransforms: newMainTransforms,
            totalPrice: newPrice,
            selectedFurniture: null,
          },
          future: [],
        };
      }

      if (addOnIndex !== -1) {
        const modelNameToDuplicate = extractModelNameFromId(
          state.present.addOnModels[addOnIndex],
        );
        const uniqueId = getNextIndexedId(modelNameToDuplicate, allModels);
        const newModels = [...state.present.addOnModels, uniqueId];
        const newTransforms = [
          ...state.present.addOnTransforms,
          {
            modelName: uniqueId,
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
          },
        ];

        const newPrice = calculateTotal(
          state.present.mainModels,
          newModels,
          state.present.activeTexture,
        );

        return {
          past: [...state.past, state.present],
          present: {
            ...state.present,
            addOnModels: newModels,
            addOnTransforms: newTransforms,
            totalPrice: newPrice,
            selectedFurniture: null,
          },
          future: [],
        };
      }

      return state;
    }),

  deleteSelectedFurniture: () =>
    set((state) => {
      const selected = state.present.selectedFurniture;
      if (!selected) return state;

      const extractedSelected = extractModelNameFromId(selected);

      const mainIndex = state.present.mainModels.findIndex(
        (id) => id === selected || extractModelNameFromId(id) === extractedSelected,
      );
      if (mainIndex !== -1) {
        const newMainModels = state.present.mainModels.filter(
          (_, idx) => idx !== mainIndex,
        );
        const newMainTransforms = state.present.mainModelTransforms.filter(
          (_, idx) => idx !== mainIndex,
        );

        const newPrice = calculateTotal(
          newMainModels,
          state.present.addOnModels,
          state.present.activeTexture,
        );

        return {
          past: [...state.past, state.present],
          present: {
            ...state.present,
            mainModels: newMainModels,
            mainModelTransforms: newMainTransforms,
            totalPrice: newPrice,
            selectedFurniture: null,
          },
          future: [],
        };
      }

      const modelIndex = state.present.addOnModels.findIndex(
        (id) => id === selected || extractModelNameFromId(id) === extractedSelected,
      );

      if (modelIndex === -1) return state;

      const newModels = state.present.addOnModels.filter(
        (_, idx) => idx !== modelIndex,
      );
      const newTransforms = state.present.addOnTransforms.filter(
        (_, idx) => idx !== modelIndex,
      );

      const newPrice = calculateTotal(
        state.present.mainModels,
        newModels,
        state.present.activeTexture,
      );

      return {
        past: [...state.past, state.present],
        present: {
          ...state.present,
          addOnModels: newModels,
          addOnTransforms: newTransforms,
          totalPrice: newPrice,
          selectedFurniture: null,
        },
        future: [],
      };
    }),

  addAddOnModel: (model) =>
    set((state) => {
      const currentPresent = state.present;
      const existing = [
        ...currentPresent.mainModels,
        ...currentPresent.addOnModels,
      ];
      const uniqueId = getNextIndexedId(model, existing);
      const newModels = [...currentPresent.addOnModels, uniqueId];

      const newTransforms = [
        ...currentPresent.addOnTransforms,
        {
          modelName: uniqueId,
          position: { x: 0, y: 0, z: 0 },
          rotation: 0,
        },
      ];

      const newPrice = calculateTotal(
        currentPresent.mainModels,
        newModels,
        currentPresent.activeTexture,
      );

      const newPresent = {
        ...currentPresent,
        addOnModels: newModels,
        totalPrice: newPrice,
        addOnTransforms: newTransforms,
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

  updateMainModelTransform: (index, transform) =>
    set((state) => {
      const newTransforms = [...state.present.mainModelTransforms];
      newTransforms[index] = transform;
      return {
        present: {
          ...state.present,
          mainModelTransforms: newTransforms,
        },
      };
    }),

  updateAddOnTransform: (index, transform) =>
    set((state) => {
      const newTransforms = [...state.present.addOnTransforms];
      newTransforms[index] = transform;

      return {
        present: {
          ...state.present,
          addOnTransforms: newTransforms,
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
        const newTransforms = [...state.present.mainModelTransforms];
        newTransforms[index] = transform;
        newPresent = {
          ...state.present,
          mainModelTransforms: newTransforms,
        };
      } else {
        const newTransforms = [...state.present.addOnTransforms];
        newTransforms[index] = transform;
        newPresent = {
          ...state.present,
          addOnTransforms: newTransforms,
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
        const newTransforms = [...state.present.mainModelTransforms];
        newTransforms[index] = transform;
        newPresent = {
          ...state.present,
          mainModelTransforms: newTransforms,
        };
      } else {
        const newTransforms = [...state.present.addOnTransforms];
        newTransforms[index] = transform;
        newPresent = {
          ...state.present,
          addOnTransforms: newTransforms,
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
