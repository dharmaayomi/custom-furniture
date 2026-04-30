import * as BABYLON from "@babylonjs/core";
import { TrialRoomConfig } from "./TrialConfig";
import { getBackWallPosition } from "./TrialSceneSetup";
import { useTrialRoomStore } from "../useTrialRoomStore";
import { getTrialAssetById } from "../trialAssetCatalog";
import { registerModel } from "../furniture/TrialModelRegistry";
import { loadProductBase } from "../furniture/TrialModelLoader";

const resolveSpawnPosition = (
  category: "frame" | "interior" | "material",
  dropPoint: { x: number; y: number; z: number } | null,
  roomConfig: TrialRoomConfig,
): BABYLON.Vector3 => {
  if (dropPoint) {
    return new BABYLON.Vector3(dropPoint.x, dropPoint.y, dropPoint.z);
  }

  switch (category) {
    case "frame":
      return getBackWallPosition(roomConfig);
    case "interior":
    case "material":
    default:
      return new BABYLON.Vector3(0, roomConfig.floorThickness, 0);
  }
};

export const setupTrialSpawnListener = (
  scene: BABYLON.Scene,
  shadowGenerator: BABYLON.ShadowGenerator,
  roomConfig: TrialRoomConfig,
) => {
  return useTrialRoomStore.subscribe(async (state) => {
    const request = state.spawnRequest;
    if (!request) return;

    const asset = getTrialAssetById(request.assetId);
    if (!asset) return;

    const instanceId = `${asset.id}-${request.requestId}`;
    const spawnPosition = resolveSpawnPosition(
      asset.category,
      request.dropPoint,
      roomConfig,
    );

    const result = await loadProductBase(scene, {
      instanceId,
      modelPath: asset.modelPath,
      meshName: instanceId,
      initialPosition: spawnPosition,
      shadowGenerator,
      interactionMode:
        asset.category === "material"
          ? "none"
          : asset.category === "interior"
            ? "interior"
            : "frame",
      centerOnXAxis: asset.category === "frame",
    });

    if (!result) return;

    registerModel(instanceId, result);
    useTrialRoomStore.getState().addLoadedModel({
      instanceId,
      assetId: asset.id,
      category: asset.category,
    });

    useTrialRoomStore.getState().clearSpawnRequest();
  });
};
