import { create } from "zustand";

interface TrialRoomState {
  selectedMeshName: string | null;

  selectMesh: (name: string | null) => void;
  setSelectedMesh: (name: string | null) => void;
}

export const useTrialRoomStore = create<TrialRoomState>((set, get) => ({
  selectedMeshName: null,

  selectMesh: (name) => {
    const current = get().selectedMeshName;
    set({ selectedMeshName: current === name ? null : name });
  },
  setSelectedMesh: (name) => {
    set({ selectedMeshName: name });
  },
}));
