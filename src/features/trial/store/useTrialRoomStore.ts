import { create } from "zustand";
import {
  DEFAULT_TRIAL_ROOM_CONFIG,
  TrialRoomConfig,
} from "../core/TrialConfig";

export interface SpawnPoint {
  x: number;
  y: number;
  z: number;
}

export interface SpawnRequest {
  requestId: number;
  assetId: string;
  dropPoint: SpawnPoint | null;
}

export interface LoadedModel {
  instanceId: string;
  assetId: string;
  category: "frame" | "component" | "material";
}

export interface TrialSelectionActionRequest {
  action: "delete" | "duplicate";
  requestId: number;
  targetInstanceId: string;
}

interface TrialRoomState {
  selectedMeshName: string | null;
  hasFrameProduct: boolean;
  spawnRequest: SpawnRequest | null;
  selectionActionRequest: TrialSelectionActionRequest | null;
  draftRoomConfig: TrialRoomConfig;
  appliedRoomConfig: TrialRoomConfig;
  activeFrameProductIds: string[];
  activeComponentProductIds: string[];
  activeMaterialProductIds: string[];

  selectMesh: (name: string | null) => void;
  setSelectedMesh: (name: string | null) => void;
  setHasFrameProduct: (hasFrameProduct: boolean) => void;
  setDraftRoomConfig: (patch: Partial<TrialRoomConfig>) => void;
  setAppliedRoomConfig: (nextRoomConfig: TrialRoomConfig) => void;
  setActiveFrameProductIds: (assetIds: string[]) => void;
  setActiveComponentProductIds: (assetIds: string[]) => void;
  addActiveComponentProductId: (assetId: string) => void;
  clearActiveComponentProductIds: () => void;
  setActiveMaterialProductIds: (assetIds: string[]) => void;
  requestAssetSpawn: (assetId: string, dropPoint?: SpawnPoint | null) => void;
  clearSpawnRequest: () => void;
  requestSelectionAction: (
    action: TrialSelectionActionRequest["action"],
    targetInstanceId: string,
  ) => void;
  clearSelectionActionRequest: () => void;
  loadedModels: LoadedModel[];
  addLoadedModel: (model: LoadedModel) => void;
  removeLoadedModel: (instanceId: string) => void;
}

export const useTrialRoomStore = create<TrialRoomState>((set, get) => ({
  selectedMeshName: null,
  hasFrameProduct: false,
  spawnRequest: null,
  selectionActionRequest: null,
  draftRoomConfig: { ...DEFAULT_TRIAL_ROOM_CONFIG },
  appliedRoomConfig: { ...DEFAULT_TRIAL_ROOM_CONFIG },
  activeFrameProductIds: [],
  activeComponentProductIds: [],
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
  setActiveFrameProductIds: (assetIds) => {
    // Step 3:
    // Keep every loaded frame id in the store so pricing can follow the loaded trial state.
    set({ activeFrameProductIds: assetIds });
  },
  setActiveComponentProductIds: (assetIds) => {
    set({ activeComponentProductIds: assetIds });
  },
  addActiveComponentProductId: (assetId) => {
    // Step 4:
    // Component items can be repeated, so we keep them as an ordered list.
    set((state) => ({
      activeComponentProductIds: [...state.activeComponentProductIds, assetId],
    }));
  },
  clearActiveComponentProductIds: () => {
    set({ activeComponentProductIds: [] });
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
  requestSelectionAction: (action, targetInstanceId) => {
    set((state) => ({
      selectionActionRequest: {
        action,
        requestId: (state.selectionActionRequest?.requestId ?? 0) + 1,
        targetInstanceId,
      },
    }));
  },
  clearSelectionActionRequest: () => {
    set({ selectionActionRequest: null });
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
