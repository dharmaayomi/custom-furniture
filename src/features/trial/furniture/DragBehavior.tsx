import * as BABYLON from "@babylonjs/core";

interface AttachTrialDragBehaviorOptions {
  scene: BABYLON.Scene;
  targetMesh: BABYLON.AbstractMesh;
  hitBox: BABYLON.Mesh;
}

export const attachTrialDragBehavior = ({
  scene,
  targetMesh,
  hitBox,
}: AttachTrialDragBehaviorOptions): BABYLON.PointerDragBehavior => {
  const getCamera = (): BABYLON.ArcRotateCamera | null => {
    const cam = scene.activeCamera;
    return cam instanceof BABYLON.ArcRotateCamera ? cam : null;
  };

  const dragBehavior = new BABYLON.PointerDragBehavior({
    dragPlaneNormal: new BABYLON.Vector3(0, 1, 0),
  });
  dragBehavior.useObjectOrientationForDragging = false;

  dragBehavior.onDragStartObservable.add(() => {
    const camera = getCamera();
    if (camera) {
      camera.detachControl();
    }
  });

  dragBehavior.onDragObservable.add((event) => {
    targetMesh.position.addInPlace(event.delta);
  });

  dragBehavior.onDragEndObservable.add(() => {
    const camera = getCamera();
    const canvas = scene.getEngine().getRenderingCanvas();
    if (camera && canvas) {
      camera.attachControl(canvas, true);
    }
  });

  hitBox.addBehavior(dragBehavior);

  return dragBehavior;
};
