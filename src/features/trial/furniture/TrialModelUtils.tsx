import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { useTrialRoomStore } from "../useTrialRoomStore";
import {
  attachFrameTrialDragBehavior,
  attachInteriorTrialDragBehavior,
  registerTrialDraggableMeshes,
} from "./DragBehavior";

export const getRenderableMeshes = (rootMesh: BABYLON.TransformNode) => {
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
          return BABYLON.Vector3.TransformCoordinates(
            center,
            inverseParentWorld,
          );
        })()
      : center;

  return { size, localCenter };
};

interface DraggableBoundingBoxController {
  dragBehavior: BABYLON.PointerDragBehavior;
  dispose: () => void;
  mesh: BABYLON.Mesh;
  sync: () => void;
}

const createDraggableBoundingBoxBase = (
  scene: BABYLON.Scene,
  rootInstanceId: string,
  targetMesh: BABYLON.TransformNode,
  attachDragBehavior: (options: {
    targetMesh: BABYLON.TransformNode;
    hitBox: BABYLON.Mesh;
  }) => BABYLON.PointerDragBehavior,
): DraggableBoundingBoxController => {
  const hitBox = BABYLON.MeshBuilder.CreateBox(
    "trial-drag-hitbox",
    { size: 1 },
    scene,
  );
  const mat = new BABYLON.StandardMaterial("hitbox-mat", scene);
  mat.alpha = 0;
  mat.backFaceCulling = false;
  hitBox.material = mat;
  hitBox.isPickable = false;

  const sync = () => {
    const { size, localCenter } = getBoundingBoxTransform(targetMesh);

    hitBox.parent =
      targetMesh.parent instanceof BABYLON.TransformNode ? targetMesh.parent : null;
    hitBox.rotationQuaternion = null;
    hitBox.rotation.set(0, 0, 0);
    hitBox.position.copyFrom(localCenter);
    hitBox.scaling.set(
      Math.max(size.x, 0.001),
      Math.max(size.y, 0.001),
      Math.max(size.z, 0.001),
    );
    hitBox.computeWorldMatrix(true);
  };

  sync();

  const dragBehavior = attachDragBehavior({
    targetMesh,
    hitBox,
  });
  registerTrialDraggableMeshes(
    rootInstanceId,
    targetMesh,
    hitBox,
    dragBehavior,
  );

  hitBox.actionManager = new BABYLON.ActionManager(scene);
  hitBox.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
      useTrialRoomStore.getState().setSelectedMesh(rootInstanceId);
    }),
  );

  return {
    dragBehavior,
    dispose: () => {
      hitBox.dispose();
      mat.dispose();
    },
    mesh: hitBox,
    sync,
  };
};

export const createFrameDraggableBoundingBox = (
  scene: BABYLON.Scene,
  rootInstanceId: string,
  targetMesh: BABYLON.TransformNode,
) =>
  createDraggableBoundingBoxBase(
    scene,
    rootInstanceId,
    targetMesh,
    attachFrameTrialDragBehavior,
  );

export const createInteriorDraggableBoundingBox = (
  scene: BABYLON.Scene,
  rootInstanceId: string,
  targetMesh: BABYLON.TransformNode,
) =>
  createDraggableBoundingBoxBase(
    scene,
    rootInstanceId,
    targetMesh,
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
