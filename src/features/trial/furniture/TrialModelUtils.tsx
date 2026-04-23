import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { useTrialRoomStore } from "../useTrialRoomStore";
import { attachTrialDragBehavior } from "./DragBehavior";

// HITBOX
export const createDraggableBoundingBox = (
  scene: BABYLON.Scene,
  targetMesh: BABYLON.AbstractMesh,
  setOutline: (visible: boolean) => void,
): BABYLON.Mesh => {
  targetMesh.computeWorldMatrix(true);
  targetMesh.getChildMeshes().forEach((m) => m.computeWorldMatrix(true));
  targetMesh.refreshBoundingInfo({ applySkeleton: true });

  const boundingVectors = targetMesh.getHierarchyBoundingVectors(true);
  const size = boundingVectors.max.subtract(boundingVectors.min);
  const center = boundingVectors.min.add(size.scale(0.5));

  const hitBox = BABYLON.MeshBuilder.CreateBox(
    "trial-drag-hitbox",
    { width: size.x, height: size.y, depth: size.z },
    scene,
  );
  hitBox.position.copyFrom(center);

  const mat = new BABYLON.StandardMaterial("hitbox-mat", scene);
  mat.alpha = 0;
  mat.backFaceCulling = false;
  hitBox.material = mat;
  hitBox.isPickable = true;
  hitBox.metadata = { kind: "bounding-box" };

  attachTrialDragBehavior({
    scene,
    targetMesh,
    hitBox,
  });

  hitBox.actionManager = new BABYLON.ActionManager(scene);
  hitBox.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
      useTrialRoomStore.getState().selectMesh(targetMesh.name);
      // Outline dikontrol sepenuhnya oleh subscriber di TrialModelLoader
    }),
  );

  return hitBox;
};

// OUTLINE
const OUTLINE_COLOR = new BABYLON.Color3(1, 0.85, 0);
const OUTLINE_WIDTH = 2.5;
export const buildOutlineController = (
  scene: BABYLON.Scene,
  rootMesh: BABYLON.AbstractMesh,
): ((visible: boolean) => void) => {
  const selectionLayer =
    scene.getSelectionOutlineLayerByName("trial-selection-outline") ??
    new BABYLON.SelectionOutlineLayer("trial-selection-outline", scene, {
      mainTextureRatio: 2.0,
    });
  const selectionGroup = rootMesh.getChildMeshes();

  selectionLayer.outlineColor = OUTLINE_COLOR;
  selectionLayer.outlineThickness = OUTLINE_WIDTH;
  selectionLayer.occlusionStrength = 0.6;
  selectionLayer.occlusionThreshold = 0.05;

  return (visible: boolean) => {
    selectionLayer.clearSelection();

    if (visible) {
      selectionLayer.addSelection(
        selectionGroup.length ? selectionGroup : rootMesh,
      );
    }
  };
};
