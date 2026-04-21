import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

import { TRIAL_ROOM_CONFIG } from "./TrialConfig";

const TRIAL_MODEL_PATH = "/assets/3d/cobalagi-antinode.glb";

// Warna & tebal outline kuning
const OUTLINE_COLOR = new BABYLON.Color3(1, 0.85, 0);
const OUTLINE_WIDTH = 0.5; // sesuaikan kalau terlalu tebal/tipis

export interface TrialModelLoadResult {
  container: BABYLON.AssetContainer;
  rootMesh: BABYLON.AbstractMesh;
  boundingBoxMesh: BABYLON.Mesh;
  /** Nyalakan / matikan outline kuning secara manual dari luar */
  setOutline: (visible: boolean) => void;
  dispose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// setOutline — toggle outline di semua child mesh sekaligus
// Outline Babylon pakai renderOutline bawaan engine (bukan post-process/glow).
// Cara kerjanya: engine render ulang setiap mesh sedikit di-scale keluar,
// lalu tulis ke stencil buffer → hasilnya garis solid di tepi silhouette.
// ─────────────────────────────────────────────────────────────────────────────
const buildOutlineController = (
  rootMesh: BABYLON.AbstractMesh,
): ((visible: boolean) => void) => {
  const childMeshes = rootMesh.getChildMeshes();

  return (visible: boolean) => {
    childMeshes.forEach((mesh) => {
      mesh.renderOutline = visible;
      mesh.outlineColor = OUTLINE_COLOR;
      mesh.outlineWidth = OUTLINE_WIDTH;
    });
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// createDraggableBoundingBox
// Buat transparent hitbox seukuran bounding box model.
// Saat pointer masuk  → outline nyala
// Saat pointer keluar → outline mati  (kalau tidak sedang drag)
// Saat drag mulai     → camera input di-detach supaya kamera tidak ikut gerak
// Saat drag selesai   → camera input di-attach kembali
// ─────────────────────────────────────────────────────────────────────────────
const createDraggableBoundingBox = (
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

  dragBehavior.onDragStartObservable.add(() => {
    isDragging = true;
    setOutline(true); // outline tetap nyala selama drag

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

    // Kembalikan kontrol kamera
    getCamera()?.inputs.attachElement();

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

// ─────────────────────────────────────────────────────────────────────────────
// loadProductBase — entry point utama
// ─────────────────────────────────────────────────────────────────────────────
export const loadProductBase = async (
  scene: BABYLON.Scene,
  shadowGenerator?: BABYLON.ShadowGenerator,
): Promise<TrialModelLoadResult | null> => {
  try {
    // Load GLB ke AssetContainer (belum masuk scene)
    const container = await BABYLON.LoadAssetContainerAsync(
      TRIAL_MODEL_PATH,
      scene,
    );

    // Masukkan semua asset ke scene, buang light & camera bawaan GLB
    container.addAllToScene();
    container.lights.forEach((l) => l.dispose());
    container.cameras.forEach((c) => c.dispose());

    const rootMesh = container.meshes[0];
    if (!rootMesh) {
      container.dispose();
      return null;
    }

    rootMesh.name = "trial-product-base";
    rootMesh.metadata = { kind: "trial-product-base" };

    // Posisikan: di atas lantai, di ujung depan ruangan
    const targetY = TRIAL_ROOM_CONFIG.floorThickness;
    const targetZ = TRIAL_ROOM_CONFIG.depth / 2 - 0.01;
    rootMesh.position.set(0, targetY, targetZ);
    rootMesh.rotationQuaternion = null;
    rootMesh.computeWorldMatrix(true);

    // Setup child mesh: pickable, shadow receiver, shadow caster
    rootMesh.getChildMeshes().forEach((mesh) => {
      mesh.isPickable = true;
      mesh.receiveShadows = true;
      shadowGenerator?.addShadowCaster(mesh, false);
    });

    // Buat controller outline (awalnya mati)
    const setOutline = buildOutlineController(rootMesh);
    setOutline(false);

    // Buat hitbox transparan + drag + hover outline
    const boundingBoxMesh = createDraggableBoundingBox(
      scene,
      rootMesh,
      setOutline,
    );

    return {
      container,
      rootMesh,
      boundingBoxMesh,
      setOutline, // expose ke luar kalau perlu toggle dari komponen React
      dispose: () => {
        boundingBoxMesh.dispose();
        container.dispose();
      },
    };
  } catch (error) {
    console.error("Error loading trial product base:", error);
    return null;
  }
};
