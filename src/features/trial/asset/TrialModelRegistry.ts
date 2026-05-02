import { AssetLoadResult } from "./AssetLoader";

const registry = new Map<string, AssetLoadResult>();

export const registerAsset = (instanceId: string, result: AssetLoadResult) => {
  registry.set(instanceId, result);
};

export const unregisterAsset = (instanceId: string) => {
  registry.get(instanceId)?.dispose();
  registry.delete(instanceId);
};

export const getAsset = (instanceId: string) => registry.get(instanceId);

export const clearRegistry = () => {
  registry.forEach((r) => r.dispose());
  registry.clear();
};
