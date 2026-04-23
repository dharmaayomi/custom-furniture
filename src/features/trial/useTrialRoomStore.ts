import { create } from "zustand";

export interface TrialSpawnPoint {
  x: number;
  y: number;
  z: number;
}

export interface TrialSpawnRequest {
  requestId: number;
  assetId: string;
  dropPoint: TrialSpawnPoint | null;
}

interface TrialRoomState {
  selectedMeshName: string | null;
  hasFrameProduct: boolean;
  spawnRequest: TrialSpawnRequest | null;

  selectMesh: (name: string | null) => void;
  setSelectedMesh: (name: string | null) => void;
  setHasFrameProduct: (hasFrameProduct: boolean) => void;
  requestAssetSpawn: (
    assetId: string,
    dropPoint?: TrialSpawnPoint | null,
  ) => void;
  clearSpawnRequest: () => void;
}

export const useTrialRoomStore = create<TrialRoomState>((set, get) => ({
  selectedMeshName: null,
  hasFrameProduct: false,
  spawnRequest: null,

  selectMesh: (name) => {
    const current = get().selectedMeshName;
    set({ selectedMeshName: current === name ? null : name });
  },
  setSelectedMesh: (name) => {
    set({ selectedMeshName: name });
  },
  setHasFrameProduct: (hasFrameProduct) => {
    set({ hasFrameProduct });
  },
  requestAssetSpawn: (assetId, dropPoint = null) => {
    // Step 1:
    // Emit a new request every time the user clicks a card or drops it on the canvas.
    set((state) => ({
      spawnRequest: {
        requestId: (state.spawnRequest?.requestId ?? 0) + 1,
        assetId,
        dropPoint,
      },
    }));
  },
  clearSpawnRequest: () => {
    set({ spawnRequest: null });
  },
}));
