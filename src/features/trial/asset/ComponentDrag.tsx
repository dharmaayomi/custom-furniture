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

const getParentLocalYAxisInWorld = (targetMesh: BABYLON.TransformNode) => {
  const parent = targetMesh.parent;

  if (!(parent instanceof BABYLON.TransformNode)) {
    return BABYLON.Axis.Y.clone();
  }

  const axis = BABYLON.Vector3.TransformNormal(
    BABYLON.Axis.Y,
    parent.getWorldMatrix(),
  );

  axis.normalize();
  return axis;
};

export const attachComponentDragBehavior = ({
  targetMesh,
  hitBox,
}: AttachTrialDragBehaviorOptions): BABYLON.PointerDragBehavior => {
  const dragBehavior = new BABYLON.PointerDragBehavior({
    dragAxis: getParentLocalYAxisInWorld(targetMesh),
  });
  dragBehavior.moveAttached = false;
  dragBehavior.useObjectOrientationForDragging = false;
  dragBehavior.detachCameraControls = true;

  dragBehavior.onDragObservable.add((event) => {
    const localDelta = toParentLocalDelta(targetMesh, event.delta);
    const yOnlyDelta = new BABYLON.Vector3(0, localDelta.y, 0);

    targetMesh.position.addInPlace(yOnlyDelta);
    hitBox.position.addInPlace(yOnlyDelta);
  });

  hitBox.addBehavior(dragBehavior);

  return dragBehavior;
};
