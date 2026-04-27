import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { useTrialRoomStore } from "../useTrialRoomStore";
import {
  attachFrameTrialDragBehavior,
  attachInteriorTrialDragBehavior,
  registerTrialDraggableMeshes,
} from "./DragBehavior";

const getRenderableMeshes = (rootMesh: BABYLON.TransformNode) => {
  const renderMeshes = rootMesh.getChildMeshes();

  if (rootMesh instanceof BABYLON.AbstractMesh) {
    renderMeshes.unshift(rootMesh);
  }

  return renderMeshes;
};

const getBoundingBoxTransform = (targetMesh: BABYLON.TransformNode) => {
  targetMesh.computeWorldMatrix(true);
  const renderMeshes = getRenderableMeshes(targetMesh);
  renderMeshes.forEach((mesh) => {
    mesh.computeWorldMatrix(true);
    mesh.refreshBoundingInfo({ applySkeleton: true });
  });

  const boundingVectors = targetMesh.getHierarchyBoundingVectors(true);
  const size = boundingVectors.max.subtract(boundingVectors.min);
  const center = boundingVectors.min.add(size.scale(0.5));

  const parent = targetMesh.parent;
  const localCenter =
    parent instanceof BABYLON.TransformNode
      ? (() => {
          const inverseParentWorld = parent.getWorldMatrix().clone();
          inverseParentWorld.invert();
          return BABYLON.Vector3.TransformCoordinates(center, inverseParentWorld);
        })()
      : center;

  return { size, localCenter };
};

const createDraggableBoundingBoxBase = (
  scene: BABYLON.Scene,
  targetMesh: BABYLON.TransformNode,
  setOutline: (visible: boolean) => void,
  attachDragBehavior: (
    options: {
      targetMesh: BABYLON.TransformNode;
      hitBox: BABYLON.Mesh;
    },
  ) => BABYLON.PointerDragBehavior,
): BABYLON.Mesh => {
  const { size, localCenter } = getBoundingBoxTransform(targetMesh);

  const hitBox = BABYLON.MeshBuilder.CreateBox(
    "trial-drag-hitbox",
    { width: size.x, height: size.y, depth: size.z },
    scene,
  );
  if (targetMesh.parent instanceof BABYLON.TransformNode) {
    hitBox.parent = targetMesh.parent;
  }
  hitBox.position.copyFrom(localCenter);

  const mat = new BABYLON.StandardMaterial("hitbox-mat", scene);
  mat.alpha = 0;
  mat.backFaceCulling = false;
  hitBox.material = mat;
  hitBox.isPickable = true;

  const dragBehavior = attachDragBehavior({
    targetMesh,
    hitBox,
  });
  registerTrialDraggableMeshes(targetMesh, hitBox, dragBehavior);

  hitBox.actionManager = new BABYLON.ActionManager(scene);
  hitBox.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
      useTrialRoomStore.getState().setSelectedMesh(targetMesh.name);
      // Outline dikontrol sepenuhnya oleh subscriber di TrialModelLoader
    }),
  );

  return hitBox;
};

export const createFrameDraggableBoundingBox = (
  scene: BABYLON.Scene,
  targetMesh: BABYLON.TransformNode,
  setOutline: (visible: boolean) => void,
) =>
  createDraggableBoundingBoxBase(
    scene,
    targetMesh,
    setOutline,
    attachFrameTrialDragBehavior,
  );

export const createInteriorDraggableBoundingBox = (
  scene: BABYLON.Scene,
  targetMesh: BABYLON.TransformNode,
  setOutline: (visible: boolean) => void,
) =>
  createDraggableBoundingBoxBase(
    scene,
    targetMesh,
    setOutline,
    attachInteriorTrialDragBehavior,
  );

// OUTLINE
const OUTLINE_COLOR = new BABYLON.Color3(1, 0.85, 0);
const OUTLINE_WIDTH = 2.5;
export const buildOutlineController = (
  scene: BABYLON.Scene,
  rootMesh: BABYLON.TransformNode,
): ((visible: boolean) => void) => {
  const selectionLayer =
    scene.getSelectionOutlineLayerByName("trial-selection-outline") ??
    new BABYLON.SelectionOutlineLayer("trial-selection-outline", scene, {
      mainTextureRatio: 2.0,
    });
  const selectionGroup = getRenderableMeshes(rootMesh);

  selectionLayer.outlineColor = OUTLINE_COLOR;
  selectionLayer.outlineThickness = OUTLINE_WIDTH;
  selectionLayer.occlusionStrength = 0.6;
  selectionLayer.occlusionThreshold = 0.05;

  return (visible: boolean) => {
    selectionLayer.clearSelection();

    if (visible && selectionGroup.length > 0) {
      selectionLayer.clearSelection();
      selectionLayer.addSelection(selectionGroup);
    }
  };
};
