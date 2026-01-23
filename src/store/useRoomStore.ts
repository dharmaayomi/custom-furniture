import { create } from "zustand";

interface RoomData {
  mainModel: string;
  activeTexture: string;
  additionalModels: string[];
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
}

const INITIAL_STATE: RoomData = {
  mainModel: "wine_cabinet.glb",
  activeTexture: "",
  additionalModels: [],
};

export const useRoomStore = create<RoomStore>((set) => ({
  past: [],
  present: INITIAL_STATE,
  future: [],

  setMainModel: (model) =>
    set((state) => {
      if (state.present.mainModel === model) return state;

      const newPresent = { ...state.present, mainModel: model };
      return {
        past: [...state.past, state.present],
        present: newPresent,
        future: [],
      };
    }),

  setActiveTexture: (texture) =>
    set((state) => {
      if (state.present.activeTexture === texture) return state;

      const newPresent = { ...state.present, activeTexture: texture };
      return {
        past: [...state.past, state.present],
        present: newPresent,
        future: [],
      };
    }),

  addAdditionalModel: (model) =>
    set((state) => {
      const newPresent = {
        ...state.present,
        additionalModels: [...state.present.additionalModels, model],
      };
      return {
        past: [...state.past, state.present],
        present: newPresent,
        future: [],
      };
    }),

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
