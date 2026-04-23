import * as BABYLON from "@babylonjs/core";
import { useTrialRoomStore } from "../useTrialRoomStore";

interface AttachTrialDragBehaviorOptions {
  targetMesh: BABYLON.AbstractMesh;
  hitBox: BABYLON.Mesh;
}

interface TrialDragMetadata {
  kind?: string;
  dragBehavior?: BABYLON.PointerDragBehavior;
  dragHitBox?: BABYLON.Mesh;
  dragRootName?: string;
}

const getTrialDragMetadata = (
  mesh?: BABYLON.Nullable<BABYLON.AbstractMesh>,
): TrialDragMetadata | null => {
  if (!mesh?.metadata) {
    return null;
  }

  return mesh.metadata as TrialDragMetadata;
};

export const attachTrialDragBehavior = ({
  targetMesh,
  hitBox,
}: AttachTrialDragBehaviorOptions): BABYLON.PointerDragBehavior => {
  const dragBehavior = new BABYLON.PointerDragBehavior({
    dragPlaneNormal: new BABYLON.Vector3(0, 1, 0),
  });
  dragBehavior.moveAttached = false;
  dragBehavior.useObjectOrientationForDragging = false;
  dragBehavior.detachCameraControls = true;

  dragBehavior.onDragObservable.add((event) => {
    targetMesh.position.addInPlace(event.delta);
    hitBox.position.addInPlace(event.delta);
  });

  hitBox.addBehavior(dragBehavior);

  return dragBehavior;
};

export const registerTrialDraggableMeshes = (
  rootMesh: BABYLON.AbstractMesh,
  hitBox: BABYLON.Mesh,
  dragBehavior: BABYLON.PointerDragBehavior,
) => {
  const applyMetadata = (mesh: BABYLON.AbstractMesh, kind?: string) => {
    mesh.metadata = {
      ...(mesh.metadata ?? {}),
      ...(kind ? { kind } : {}),
      dragBehavior,
      dragHitBox: hitBox,
      dragRootName: rootMesh.name,
    };
  };

  applyMetadata(rootMesh);
  rootMesh.getChildMeshes().forEach((mesh) => applyMetadata(mesh));
  applyMetadata(hitBox, "bounding-box");
};

export const isTrialDraggableMesh = (
  mesh?: BABYLON.Nullable<BABYLON.AbstractMesh>,
) => {
  const metadata = getTrialDragMetadata(mesh);
  return Boolean(metadata?.dragBehavior && metadata?.dragHitBox);
};

export const tryStartTrialDragFromPointer = (
  pointerInfo: BABYLON.PointerInfo,
) => {
  const pickedMesh = pointerInfo.pickInfo?.pickedMesh;
  const metadata = getTrialDragMetadata(pickedMesh);
  const pointerEvent = pointerInfo.event as PointerEvent | undefined;
  const pickInfo = pointerInfo.pickInfo;

  if (
    pointerInfo.type !== BABYLON.PointerEventTypes.POINTERDOWN ||
    !metadata?.dragBehavior ||
    !metadata.dragHitBox ||
    !pickInfo?.hit ||
    !pickInfo.pickedPoint ||
    !pickInfo.ray
  ) {
    return false;
  }

  if (metadata.kind === "bounding-box") {
    if (metadata.dragRootName) {
      useTrialRoomStore.getState().setSelectedMesh(metadata.dragRootName);
    }
    return true;
  }

  if (metadata.dragRootName) {
    useTrialRoomStore.getState().setSelectedMesh(metadata.dragRootName);
  }

  metadata.dragBehavior.startDrag(
    pointerEvent?.pointerId,
    pickInfo.ray,
    pickInfo.pickedPoint,
  );
  return true;
};
