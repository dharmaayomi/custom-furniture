import { TrialModelLoadResult } from "./TrialModelLoader";

const registry = new Map<string, TrialModelLoadResult>();

export const registerModel = (
  instanceId: string,
  result: TrialModelLoadResult,
) => {
  registry.set(instanceId, result);
};

export const unregisterModel = (instanceId: string) => {
  registry.get(instanceId)?.dispose();
  registry.delete(instanceId);
};

export const getModel = (instanceId: string) => registry.get(instanceId);

export const clearRegistry = () => {
  registry.forEach((r) => r.dispose());
  registry.clear();
};
