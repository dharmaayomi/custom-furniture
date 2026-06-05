import * as BABYLON from "@babylonjs/core";

import { AttachTrialDragBehaviorOptions } from "./DragBehavior";

const toParentLocalDelta = (
  targetMesh: BABYLON.TransformNode,
  worldDelta: BABYLON.Vector3,
) => {
  const parent = targetMesh.parent;

  if (!(parent instanceof BABYLON.TransformNode)) {
    return worldDelta.clone();
  }

  const inverseParentWorld = parent.getWorldMatrix().clone();
  inverseParentWorld.invert();

  return BABYLON.Vector3.TransformNormal(worldDelta, inverseParentWorld);
};

export const attachFrameTrialDragBehavior = ({
  targetMesh,
  hitBox,
}: AttachTrialDragBehaviorOptions): BABYLON.PointerDragBehavior => {
  const dragBehavior = new BABYLON.PointerDragBehavior({
    dragPlaneNormal: new BABYLON.Vector3(0, 1, 0),
  });
  dragBehavior.moveAttached = false;
  dragBehavior.useObjectOrientationForDragging = false;
  dragBehavior.detachCameraControls = true;
  dragBehavior.updateDragPlane = false;

  dragBehavior.onDragObservable.add((event) => {
    const localDelta = toParentLocalDelta(targetMesh, event.delta);

    targetMesh.position.addInPlace(localDelta);
    hitBox.position.addInPlace(localDelta);
  });

  hitBox.addBehavior(dragBehavior);

  return dragBehavior;
};
