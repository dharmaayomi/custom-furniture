import * as BABYLON from "@babylonjs/core";
import { useTrialRoomStore } from "../store/useTrialRoomStore";

interface AttachTrialDragBehaviorOptions {
  targetMesh: BABYLON.TransformNode;
  hitBox: BABYLON.Mesh;
}

interface TrialDragMetadata {
  kind?: string;
  dragBehavior?: BABYLON.PointerDragBehavior;
  dragHitBox?: BABYLON.Mesh;
  dragRootInstanceId?: string;
  dragRootName?: string;
}

export interface TrialResolvedDragTarget {
  dragBehavior: BABYLON.PointerDragBehavior;
  dragHitBox: BABYLON.Mesh;
  instanceId: string;
  kind?: string;
}

const getTrialDragMetadata = (
  mesh?: BABYLON.Nullable<BABYLON.AbstractMesh>,
): TrialDragMetadata | null => {
  if (!mesh?.metadata) {
    return null;
  }

  return mesh.metadata as TrialDragMetadata;
};

export const getTrialResolvedDragTarget = (
  mesh?: BABYLON.Nullable<BABYLON.AbstractMesh>,
): TrialResolvedDragTarget | null => {
  const metadata = getTrialDragMetadata(mesh);
  if (
    !metadata?.dragBehavior ||
    !metadata.dragHitBox ||
    !metadata.dragRootInstanceId
  ) {
    return null;
  }

  return {
    dragBehavior: metadata.dragBehavior,
    dragHitBox: metadata.dragHitBox,
    instanceId: metadata.dragRootInstanceId,
    kind: metadata.kind,
  };
};

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

export const attachInteriorTrialDragBehavior = ({
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

export const registerTrialDraggableMeshes = (
  rootInstanceId: string,
  rootMesh: BABYLON.TransformNode,
  hitBox: BABYLON.Mesh,
  dragBehavior: BABYLON.PointerDragBehavior,
) => {
  const applyMetadata = (mesh: BABYLON.AbstractMesh, kind?: string) => {
    mesh.metadata = {
      ...(mesh.metadata ?? {}),
      ...(kind ? { kind } : {}),
      dragBehavior,
      dragHitBox: hitBox,
      dragRootInstanceId: rootInstanceId,
      dragRootName: rootMesh.name,
    };
  };

  if (rootMesh instanceof BABYLON.AbstractMesh) {
    applyMetadata(rootMesh);
  }
  rootMesh.getChildMeshes().forEach((mesh) => applyMetadata(mesh));
  applyMetadata(hitBox, "bounding-box");
};

export const isTrialDraggableMesh = (
  mesh?: BABYLON.Nullable<BABYLON.AbstractMesh>,
) => {
  return Boolean(getTrialResolvedDragTarget(mesh));
};

export const tryStartTrialDragFromPick = (
  pickInfo: BABYLON.PickingInfo,
  pointerEvent?: PointerEvent,
) => {
  if (
    !pickInfo?.hit ||
    !pickInfo.pickedMesh ||
    !pickInfo.pickedPoint ||
    !pickInfo.ray
  ) {
    return false;
  }

  const target = getTrialResolvedDragTarget(pickInfo.pickedMesh);
  if (!target) {
    return false;
  }

  useTrialRoomStore.getState().setSelectedMesh(target.instanceId);

  if (target.kind === "bounding-box") {
    target.dragBehavior.startDrag(
      pointerEvent?.pointerId,
      pickInfo.ray,
      pickInfo.pickedPoint,
    );
    return true;
  }

  target.dragBehavior.startDrag(
    pointerEvent?.pointerId,
    pickInfo.ray,
    pickInfo.pickedPoint,
  );
  return true;
};

export const tryStartTrialDragFromPointer = (
  pointerInfo: BABYLON.PointerInfo,
) => {
  if (pointerInfo.type !== BABYLON.PointerEventTypes.POINTERDOWN) {
    return false;
  }

  return tryStartTrialDragFromPick(
    pointerInfo.pickInfo!,
    pointerInfo.event as PointerEvent | undefined,
  );
};
