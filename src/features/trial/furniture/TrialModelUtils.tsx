import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

// SNAP TO NEAREST WALL

// DRAG SETTING
export const createDraggableBoundingBox = (
  scene: BABYLON.Scene,
  targetMesh: BABYLON.AbstractMesh,
  setOutline: (visible: boolean) => void,
): BABYLON.Mesh => {
  // 1. Pastikan world matrix & bounding info sudah up-to-date
  targetMesh.computeWorldMatrix(true);
  targetMesh.getChildMeshes().forEach((m) => m.computeWorldMatrix(true));
  targetMesh.refreshBoundingInfo({ applySkeleton: true });

  const boundingVectors = targetMesh.getHierarchyBoundingVectors(true);
  const size = boundingVectors.max.subtract(boundingVectors.min);
  const center = boundingVectors.min.add(size.scale(0.5));

  // 2. Box transparan seukuran bounding box
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

  // 3. Ambil kamera aktif — butuh untuk detach/attach input saat drag
  //    Kita pakai ArcRotateCamera (kamera orbit). Kalau proyek kamu pakai
  //    tipe lain, ganti cast-nya di sini.
  const getCamera = (): BABYLON.ArcRotateCamera | null => {
    const cam = scene.activeCamera;
    return cam instanceof BABYLON.ArcRotateCamera ? cam : null;
  };

  let isDragging = false;

  // 4. Drag behavior — constraint di bidang horizontal (Y dikunci)
  const dragBehavior = new BABYLON.PointerDragBehavior({
    dragPlaneNormal: new BABYLON.Vector3(0, 1, 0),
  });
  dragBehavior.useObjectOrientationForDragging = false;

  const getPointerInput = () => {
    const cam = getCamera();
    return cam?.inputs.attached["pointers"] as
      | BABYLON.ArcRotateCameraPointersInput
      | undefined;
  };
  dragBehavior.onDragStartObservable.add(() => {
    isDragging = true;
    setOutline(true); // outline tetap nyala selama drag
    getPointerInput()?.detachControl();
    // Matikan input kamera supaya swipe/drag tidak memutar scene
    // — hanya furniture yang bergerak
    getCamera()?.inputs.detachElement();
  });

  dragBehavior.onDragObservable.add((event) => {
    // Geser rootMesh sebesar delta drag hitbox
    targetMesh.position.addInPlace(event.delta);
  });

  dragBehavior.onDragEndObservable.add(() => {
    isDragging = false;
    // ✅ Re-attach ke canvas yang benar
    const canvas = scene.getEngine().getRenderingCanvas();
    if (canvas) getPointerInput()?.attachControl();

    // Matikan outline kalau pointer sudah tidak di atas mesh
    setOutline(false);
  });

  hitBox.addBehavior(dragBehavior);

  // 5. Hover: outline nyala saat pointer masuk, mati saat keluar
  //    (kecuali sedang drag — outline dibiarkan nyala)
  hitBox.actionManager = new BABYLON.ActionManager(scene);

  hitBox.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnPointerOverTrigger,
      () => setOutline(true),
    ),
  );

  hitBox.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnPointerOutTrigger,
      () => {
        if (!isDragging) setOutline(false);
      },
    ),
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
