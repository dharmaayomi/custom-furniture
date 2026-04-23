import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { useTrialRoomStore } from "../useTrialRoomStore";

// SNAP TO NEAREST WALL

// DRAG SETTING
// export const createDraggableBoundingBox = (
//   scene: BABYLON.Scene,
//   targetMesh: BABYLON.AbstractMesh,
//   setOutline: (visible: boolean) => void,
// ): BABYLON.Mesh => {
//   // 1. Pastikan world matrix & bounding info sudah up-to-date
//   targetMesh.computeWorldMatrix(true);
//   targetMesh.getChildMeshes().forEach((m) => m.computeWorldMatrix(true));
//   targetMesh.refreshBoundingInfo({ applySkeleton: true });

//   const boundingVectors = targetMesh.getHierarchyBoundingVectors(true);
//   const size = boundingVectors.max.subtract(boundingVectors.min);
//   const center = boundingVectors.min.add(size.scale(0.5));

//   // 2. Box transparan seukuran bounding box
//   const hitBox = BABYLON.MeshBuilder.CreateBox(
//     "trial-drag-hitbox",
//     { width: size.x, height: size.y, depth: size.z },
//     scene,
//   );
//   hitBox.position.copyFrom(center);

//   const mat = new BABYLON.StandardMaterial("hitbox-mat", scene);
//   mat.alpha = 0;
//   mat.backFaceCulling = false;
//   hitBox.material = mat;
//   hitBox.isPickable = true;

//   const getCamera = (): BABYLON.ArcRotateCamera | null => {
//     const cam = scene.activeCamera;
//     return cam instanceof BABYLON.ArcRotateCamera ? cam : null;
//   };

//   let isDragging = false;

//   // 4. Drag behavior — constraint di bidang horizontal (Y dikunci)
//   const dragBehavior = new BABYLON.PointerDragBehavior({
//     dragPlaneNormal: new BABYLON.Vector3(0, 1, 0),
//   });
//   dragBehavior.useObjectOrientationForDragging = false;

//   const getPointerInput = () => {
//     const cam = getCamera();
//     return cam?.inputs.attached["pointers"] as
//       | BABYLON.ArcRotateCameraPointersInput
//       | undefined;
//   };
//   dragBehavior.onDragStartObservable.add(() => {
//     isDragging = true;
//     setOutline(true); // outline tetap nyala selama drag
//     getPointerInput()?.detachControl();
//     // Matikan input kamera supaya swipe/drag tidak memutar scene
//     // — hanya furniture yang bergerak
//     getCamera()?.inputs.detachElement();
//   });

//   dragBehavior.onDragObservable.add((event) => {
//     // Geser rootMesh sebesar delta drag hitbox
//     targetMesh.position.addInPlace(event.delta);
//   });

//   dragBehavior.onDragEndObservable.add(() => {
//     isDragging = false;
//     const canvas = scene.getEngine().getRenderingCanvas();
//     if (canvas) getPointerInput()?.attachControl();

//     // Matikan outline kalau pointer sudah tidak di atas mesh
//     setOutline(false);
//   });

//   hitBox.addBehavior(dragBehavior);

//   // 5. Hover: outline nyala saat pointer masuk, mati saat keluar
//   //    (kecuali sedang drag — outline dibiarkan nyala)
//   hitBox.actionManager = new BABYLON.ActionManager(scene);

//   hitBox.actionManager.registerAction(
//     new BABYLON.ExecuteCodeAction(
//       BABYLON.ActionManager.OnPointerOverTrigger,
//       () => setOutline(true),
//     ),
//   );

//   hitBox.actionManager.registerAction(
//     new BABYLON.ExecuteCodeAction(
//       BABYLON.ActionManager.OnPointerOutTrigger,
//       () => {
//         if (!isDragging) setOutline(false);
//       },
//     ),
//   );

//   return hitBox;
// };
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

  const getCamera = (): BABYLON.ArcRotateCamera | null => {
    const cam = scene.activeCamera;
    return cam instanceof BABYLON.ArcRotateCamera ? cam : null;
  };

  // Drag behavior
  const dragBehavior = new BABYLON.PointerDragBehavior({
    dragPlaneNormal: new BABYLON.Vector3(0, 1, 0),
  });
  dragBehavior.useObjectOrientationForDragging = false;

  dragBehavior.onDragStartObservable.add(() => {
    // Matikan kontrol kamera total saat drag dimulai
    const camera = getCamera();
    if (camera) {
      camera.detachControl();
    }
  });

  dragBehavior.onDragObservable.add((event) => {
    targetMesh.position.addInPlace(event.delta);
  });

  dragBehavior.onDragEndObservable.add(() => {
    // Pasang kembali kontrol kamera setelah drag selesai
    const camera = getCamera();
    const canvas = scene.getEngine().getRenderingCanvas();
    if (camera && canvas) {
      camera.attachControl(canvas, true);
    }
  });

  hitBox.addBehavior(dragBehavior);

  // Ganti Hover menjadi Click Selection
  hitBox.actionManager = new BABYLON.ActionManager(scene);
  hitBox.actionManager.registerAction(
    // new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
    //   const store = useTrialRoomStore.getState();
    //   // Toggle selection di store
    //   store.selectMesh(targetMesh.name);

    //   // Update visual outline berdasarkan state terbaru
    //   const isSelected =
    //     useTrialRoomStore.getState().selectedMeshName === targetMesh.name;
    //   setOutline(isSelected);
    // }),
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
