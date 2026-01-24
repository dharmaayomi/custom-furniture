import { ASSET_PRICES, TEXTURE_PRICES } from "@/lib/price";
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
    total += ASSET_PRICES[model] || 0;
  });

  total += TEXTURE_PRICES[activeTexture] || 0;

  return total;
};

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
}

interface RoomStore {
  past: RoomData[];
  present: RoomData;
  future: RoomData[];

  setMainModel: (model: string) => void;
  setActiveTexture: (texture: string) => void;
  addAdditionalModel: (model: string) => void;

  undo: () => void;
  redo: () => void;
  reset: () => void;

  updateMainModelTransform: (transform: FurnitureTransform) => void;
  updateAdditionalTransform: (
    index: number,
    transform: FurnitureTransform,
  ) => void;
  saveTransformToHistory: (
    index: number,
    transform: FurnitureTransform,
    isMainModel: boolean,
  ) => void; // ⭐ TAMBAH METHOD BARU
  captureCurrentState: () => void; // Untuk save state saat drag end
}

// State Awal
const INITIAL_MAIN = "";
const INITIAL_TEXTURE = "";

const INITIAL_STATE: RoomData = {
  mainModel: INITIAL_MAIN,
  activeTexture: INITIAL_TEXTURE,
  additionalModels: [],
  totalPrice: calculateTotal(INITIAL_MAIN, [], INITIAL_TEXTURE),
  mainModelTransform: undefined,
  additionalTransforms: [],
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

  addAdditionalModel: (model) =>
    set((state) => {
      const newModels = [...state.present.additionalModels, model];

      const newPrice = calculateTotal(
        state.present.mainModel,
        newModels,
        state.present.activeTexture,
      );
      const newTransforms = [...state.present.additionalTransforms];
      const newPresent = {
        ...state.present,
        additionalModels: newModels,
        totalPrice: newPrice,
        additionalTransforms: newTransforms, // ⭐ TAMBAH INI
      };

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
      console.log("📸 Capturing state:", state.present);
      return {
        past: [...state.past, state.present],
        present: state.present, // ⭐ Keep current present
        future: [], // Clear future
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
