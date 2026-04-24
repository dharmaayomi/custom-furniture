import { create } from "zustand";
import { DEFAULT_TRIAL_ROOM_CONFIG, TrialRoomConfig } from "./core/TrialConfig";

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

export interface LoadedModel {
  instanceId: string;
  assetId: string;
  category: "frame" | "interior" | "material";
}

interface TrialRoomState {
  selectedMeshName: string | null;
  hasFrameProduct: boolean;
  spawnRequest: TrialSpawnRequest | null;
  draftRoomConfig: TrialRoomConfig;
  appliedRoomConfig: TrialRoomConfig;
  activeFrameProductId: string | null;
  activeInteriorProductIds: string[];
  activeMaterialProductIds: string[];

  selectMesh: (name: string | null) => void;
  setSelectedMesh: (name: string | null) => void;
  setHasFrameProduct: (hasFrameProduct: boolean) => void;
  setDraftRoomConfig: (patch: Partial<TrialRoomConfig>) => void;
  setAppliedRoomConfig: (nextRoomConfig: TrialRoomConfig) => void;
  setActiveFrameProductId: (assetId: string | null) => void;
  addActiveInteriorProductId: (assetId: string) => void;
  clearActiveInteriorProductIds: () => void;
  setActiveMaterialProductIds: (assetIds: string[]) => void;
  requestAssetSpawn: (
    assetId: string,
    dropPoint?: TrialSpawnPoint | null,
  ) => void;
  clearSpawnRequest: () => void;
  loadedModels: LoadedModel[];
  addLoadedModel: (model: LoadedModel) => void;
  removeLoadedModel: (instanceId: string) => void;
}

export const useTrialRoomStore = create<TrialRoomState>((set, get) => ({
  selectedMeshName: null,
  hasFrameProduct: false,
  spawnRequest: null,
  draftRoomConfig: { ...DEFAULT_TRIAL_ROOM_CONFIG },
  appliedRoomConfig: { ...DEFAULT_TRIAL_ROOM_CONFIG },
  activeFrameProductId: null,
  activeInteriorProductIds: [],
  activeMaterialProductIds: [],

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
  setDraftRoomConfig: (patch) => {
    // Step 1:
    // The drawer writes into the draft config immediately so the inputs stay responsive.
    set((state) => ({
      draftRoomConfig: {
        ...state.draftRoomConfig,
        ...patch,
      },
    }));
  },
  setAppliedRoomConfig: (nextRoomConfig) => {
    // Step 2:
    // The debounced room config is applied separately so the scene updates less often.
    set({ appliedRoomConfig: nextRoomConfig });
  },
  setActiveFrameProductId: (assetId) => {
    // Step 3:
    // Keep the current frame id in the store so pricing can follow the loaded trial state.
    set({ activeFrameProductId: assetId });
  },
  addActiveInteriorProductId: (assetId) => {
    // Step 4:
    // Interior items can be repeated, so we keep them as an ordered list.
    set((state) => ({
      activeInteriorProductIds: [...state.activeInteriorProductIds, assetId],
    }));
  },
  clearActiveInteriorProductIds: () => {
    set({ activeInteriorProductIds: [] });
  },
  setActiveMaterialProductIds: (assetIds) => {
    set({ activeMaterialProductIds: assetIds });
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
  loadedModels: [],
  addLoadedModel: (model) =>
    set((state) => ({ loadedModels: [...state.loadedModels, model] })),
  removeLoadedModel: (instanceId) =>
    set((state) => ({
      loadedModels: state.loadedModels.filter(
        (m) => m.instanceId !== instanceId,
      ),
    })),
}));
