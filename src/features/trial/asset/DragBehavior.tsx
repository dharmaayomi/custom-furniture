import * as BABYLON from "@babylonjs/core";
import { useTrialRoomStore } from "../store/useTrialRoomStore";

export interface AttachTrialDragBehaviorOptions {
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

export const registerDraggableMeshes = (
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
