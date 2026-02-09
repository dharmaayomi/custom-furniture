"use client";

import { useRoomStore } from "@/store/useRoomStore";
import { extractModelNameFromId } from "@/lib/price";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { useEffect, useRef } from "react";
import { useDebounceValue } from "usehooks-ts";
import { HumanHelper } from "./HumanHelper";
import { setupAutoHideWalls, updateRoomDimensions } from "./MeshUtils_WallSnap";
import {
  loadAdditionalModel,
  loadMainModel,
  updateAllTextures,
} from "./ModelLoader_WallSnap";
import { setupRoom } from "./RoomSetup";
import { createScene } from "./SceneSetup";

interface RoomCanvasProps {
  mainModels: string[];
  activeTexture: string;
  addOnModels: string[];
  onSceneReady?: (scene: BABYLON.Scene) => void;
}

const getAdditionalMeshes = (
  scene: BABYLON.Scene,
  mainMeshes: BABYLON.AbstractMesh[],
) => {
  return scene.meshes.filter(
    (m) =>
      m.metadata === "furniture" &&
      !mainMeshes.includes(m as BABYLON.AbstractMesh) &&
      !m.parent,
  );
};

export const RoomCanvasThree = ({
  mainModels,
  activeTexture,
  addOnModels,
  onSceneReady,
}: RoomCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const mainMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);
  const present = useRoomStore((state) => state.present);
  const presentRef = useRef(present);
  const showHuman = useRoomStore((state) => state.present.showHuman);
  const setSelectedFurniture = useRoomStore(
    (state) => state.setSelectedFurniture,
  );
  const humanRef = useRef<any>(null);
  const hlRef = useRef<BABYLON.HighlightLayer | null>(null);

  useEffect(() => {
    presentRef.current = present;
  }, [present]);

  const { roomConfig } = present;
  const shadowGenRef = useRef<BABYLON.ShadowGenerator | null>(null);
  const cameraRef = useRef<BABYLON.ArcRotateCamera | null>(null);
  const roomMeshesRef = useRef<{
    walls: BABYLON.Mesh[];
    floorVinyl: BABYLON.Mesh;
    ceiling: BABYLON.Mesh;
    floorBase: BABYLON.Mesh;
  } | null>(null);
  const [debouncedRoomConfig] = useDebounceValue(roomConfig, 150);
  const [debouncedActiveTexture] = useDebounceValue(activeTexture, 150);

  // --- 1. INITIAL SCENE SETUP ---

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    // const engine = new BABYLON.Engine(canvas, true);
    const engine = new BABYLON.Engine(canvas, true, {
      adaptToDeviceRatio: true,
      preserveDrawingBuffer: true,
    });

    // Ambil references dari createScene yang sudah dimodifikasi
    const { scene, shadowGen, camera, hl } = createScene(canvas, engine);

    sceneRef.current = scene;
    hlRef.current = hl;
    scene.onPointerDown = (evt, pickResult) => {
      if (pickResult.hit && pickResult.pickedMesh) {
        const picked = pickResult.pickedMesh as BABYLON.AbstractMesh;

        // Find root furniture mesh robustly: check known furniture roots first
        const furnitureRoots = scene.meshes.filter(
          (m) => m.metadata === "furniture" && !m.parent,
        ) as BABYLON.AbstractMesh[];

        let root: BABYLON.AbstractMesh | null = null;
        for (const r of furnitureRoots) {
          if (r === picked || picked.isDescendantOf(r)) {
            root = r;
            break;
          }
        }

        // Fallback: climb parent chain until metadata === 'furniture'
        if (!root) {
          let targetMesh = picked;
          while (targetMesh.parent && targetMesh.metadata !== "furniture") {
            targetMesh = targetMesh.parent as BABYLON.AbstractMesh;
          }
          if (targetMesh.metadata === "furniture") root = targetMesh;
        }

        const hlLayer = hlRef.current;
        if (root) {
          if (hlLayer) hlLayer.removeAllMeshes();

          // Highlight root and its children
          if (hlLayer) {
            hlLayer.addMesh(
              root as BABYLON.Mesh,
              BABYLON.Color3.FromHexString("#f59e0b"),
            );
          }
          root.getChildMeshes().forEach((m) => {
            if (hlLayer) {
              hlLayer.addMesh(
                m as BABYLON.Mesh,
                BABYLON.Color3.FromHexString("#f59e0b"),
              );
            }
          });

          // Update selected furniture in store
          setSelectedFurniture(root.name);
        } else {
          if (hlLayer) hlLayer.removeAllMeshes();
          setSelectedFurniture(null);
        }
      }
    };
    shadowGenRef.current = shadowGen;
    cameraRef.current = camera as any;

    if (onSceneReady) {
      onSceneReady(scene);
    }

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => {
      if (canvas && engine) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        engine.resize();

        if (camera) {
          camera.getProjectionMatrix(true);
        }
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(canvas);
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      engine.dispose();
    };
  }, [onSceneReady]);

  // human helper
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const handleHuman = async () => {
      if (humanRef.current) {
        humanRef.current.dispose();
        humanRef.current = null;
      }

      if (showHuman) {
        let spawnPos = new BABYLON.Vector3(0, 0, 0);

        const primaryMain = mainMeshesRef.current[0];
        if (primaryMain) {
          const boundingInfo = primaryMain.getHierarchyBoundingVectors(true);
          const width = boundingInfo.max.x - boundingInfo.min.x;
          const depth = boundingInfo.max.z - boundingInfo.min.z;

          spawnPos = primaryMain.position
            .clone()
            .add(new BABYLON.Vector3(width / 2 + 0.6, 0, 0.2));
        }

        const human = await HumanHelper(scene, spawnPos);
        humanRef.current = human;
      }
    };

    handleHuman();
  }, [showHuman]);

  // update room dimension
  useEffect(() => {
    if (!sceneRef.current || !shadowGenRef.current || !cameraRef.current)
      return;

    const scene = sceneRef.current;
    const shadowGen = shadowGenRef.current;
    const camera = cameraRef.current;

    if (roomMeshesRef.current) {
      roomMeshesRef.current.walls.forEach((w) => w.dispose());
      roomMeshesRef.current.floorVinyl.dispose();
      roomMeshesRef.current.ceiling.dispose();
      roomMeshesRef.current.floorBase.dispose();

      shadowGen.removeShadowCaster(roomMeshesRef.current.ceiling);
      roomMeshesRef.current.walls.forEach((w) =>
        shadowGen.removeShadowCaster(w),
      );
    }

    const newRoomMeshes = setupRoom(scene, debouncedRoomConfig);
    scene.executeWhenReady(() => {
      roomMeshesRef.current = newRoomMeshes;

      shadowGen.addShadowCaster(newRoomMeshes.ceiling);
      newRoomMeshes.walls.forEach((w) => shadowGen.addShadowCaster(w));

      setupAutoHideWalls(scene, newRoomMeshes.walls, camera);
      updateRoomDimensions(scene);
    });
  }, [debouncedRoomConfig]);

  // --- 2. SYNC MAIN MODELS ---
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    const syncMainModels = async () => {
      mainMeshesRef.current = mainMeshesRef.current.filter((mesh) => {
        if (!mainModels.includes(mesh.name)) {
          mesh.dispose();
          return false;
        }
        return true;
      });

      for (let i = 0; i < mainModels.length; i++) {
        const uniqueId = mainModels[i];
        const existingMesh = scene.getMeshByName(uniqueId);
        if (!existingMesh) {
          const modelName = extractModelNameFromId(uniqueId);
          const savedTransform =
            presentRef.current.mainModelTransforms[i];
          await loadMainModel(
            modelName,
            activeTexture,
            scene,
            savedTransform,
            uniqueId,
          );
        }
      }

      mainMeshesRef.current = mainModels
        .map((id) => scene.getMeshByName(id) as BABYLON.AbstractMesh)
        .filter(Boolean);
    };

    syncMainModels();
  }, [mainModels]);

  // --- 3. SYNC ADD-ON MODELS (FIX UNTUK UNDO/REDO) ---
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    const syncModels = async () => {
      const currentMeshes = getAdditionalMeshes(scene, mainMeshesRef.current);

      currentMeshes.forEach((mesh) => {
        if (!addOnModels.includes(mesh.name)) {
          mesh.dispose();
        }
      });

      // Load Mesh baru atau Sync Mesh yang hilang
      // Kita iterasi berdasarkan index di additionalModels untuk mencocokkan dengan transforms
      for (let i = 0; i < addOnModels.length; i++) {
        const uniqueId = addOnModels[i];

        // Cek apakah mesh sudah ada di scene
        const existingMesh = scene.getMeshByName(uniqueId);

        if (!existingMesh) {
          // Extract original model name (supports indexed ids)
          const modelName = extractModelNameFromId(uniqueId);

          // AMBIL TRANSFORM DARI STORE BERDASARKAN INDEX
          // Pastikan additionalTransforms di store sinkron dengan additionalModels array
          const savedTransform = presentRef.current.addOnTransforms[i];

          await loadAdditionalModel(
            modelName,
            activeTexture,
            scene,
            mainMeshesRef.current[0] ?? null,
            savedTransform, // <-- Kirim data history
          );
        }
      }
    };
    syncModels();
  }, [addOnModels]); // Trigger saat jumlah berubah

  // --- 4. UPDATE TEXTURE ---
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Build per-mesh texture map from transforms (persisted on transforms)
    const meshTextureMap: Record<string, string> = {};
    present.mainModelTransforms.forEach((t) => {
      if (t && t.texture) {
        meshTextureMap[t.modelName] = t.texture as string;
      }
    });

    present.addOnTransforms.forEach((t, idx) => {
      if (t && t.texture) {
        const key = present.addOnModels[idx] || t.modelName;
        meshTextureMap[key] = t.texture as string;
      }
    });

    updateAllTextures(
      scene,
      debouncedActiveTexture,
      mainMeshesRef.current,
      meshTextureMap,
    );
  }, [
    debouncedActiveTexture,
    present.mainModelTransforms,
    present.addOnTransforms,
    present.addOnModels,
    present.mainModels,
  ]);

  //  --- 5. RESTORE POSITIONS SAAT UNDO/REDO ---
  useEffect(() => {
    if (!sceneRef.current) {
      return;
    }

    // Restore main model transforms
    present.mainModelTransforms.forEach((transform) => {
      const mesh = sceneRef.current!.getMeshByName(transform.modelName);
      if (mesh) {
        if (mesh.rotationQuaternion) {
          mesh.rotationQuaternion = null;
        }
        mesh.position.set(
          transform.position.x,
          transform.position.y,
          transform.position.z,
        );
        mesh.rotation.y = transform.rotation;
      }
    });

    // Restore add-on transforms
    present.addOnTransforms.forEach((transform, index) => {
      const id = present.addOnModels[index] || transform.modelName;
      const mesh = sceneRef.current!.getMeshByName(id);
      if (mesh) {
        if (mesh.rotationQuaternion) {
          mesh.rotationQuaternion = null;
        }
        mesh.position.set(
          transform.position.x,
          transform.position.y,
          transform.position.z,
        );
        mesh.rotation.y = transform.rotation;
      }
    });
    if (hlRef.current) {
      hlRef.current.removeAllMeshes();
    }
  }, [present.mainModelTransforms, present.addOnTransforms, present.addOnModels]);

  return (
    <canvas ref={canvasRef} className="h-full w-full touch-none outline-none" />
  );
};
