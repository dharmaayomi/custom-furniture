"use client";

import React, { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

const CONFIG = {
  rw: 600,
  rd: 500,
  type: "kitchen",
};
interface RoomCanvasProps {
  mainModel: string;
  activeTexture: string;
  additionalModels: string[];
}

export const RoomCanvas = ({
  mainModel,
  activeTexture,
  additionalModels,
}: RoomCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const mainMeshRef = useRef<BABYLON.AbstractMesh | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = () => {
      const scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(1, 1, 1, 1);
      scene.environmentIntensity = 1.3;

      scene.imageProcessingConfiguration.exposure = 2.2;
      scene.imageProcessingConfiguration.contrast = 1.05;
      scene.imageProcessingConfiguration.toneMappingEnabled = true;
      scene.imageProcessingConfiguration.toneMappingType =
        BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
      const rw = CONFIG.rw;
      const rd = CONFIG.rd;
      const wallH = 300;
      const wallThick = 10;

      // --- CAMERA ---
      const camera = new BABYLON.ArcRotateCamera(
        "camera",
        -Math.PI / 2,
        // angle
        Math.PI / 2.1,
        600,
        // middle number, set the height
        new BABYLON.Vector3(0, 140, 0),
        scene,
      );
      camera.attachControl(canvas, true);
      camera.wheelPrecision = 1.0;
      camera.lowerBetaLimit = 0.1;
      camera.upperBetaLimit = Math.PI / 2.1;
      camera.lowerRadiusLimit = 100;
      camera.upperRadiusLimit = 1500;
      const zoomInAnimation = new BABYLON.Animation(
        "cameraZoomIn",
        "radius",
        60,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
      );

      const keyFrames = [
        { frame: 0, value: 600 },
        { frame: 90, value: 150 },
      ];

      zoomInAnimation.setKeys(keyFrames);

      const easingFunction = new BABYLON.CubicEase();
      easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
      zoomInAnimation.setEasingFunction(easingFunction);

      camera.animations.push(zoomInAnimation);

      scene.beginAnimation(camera, 0, 90, false);

      // --- LIGHTING
      const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 1, 0),
        scene,
      );
      light.intensity = 1.3;
      light.groundColor = new BABYLON.Color3(0.2, 0.2, 0.2);

      const pointLight = new BABYLON.PointLight(
        "pointLight",
        new BABYLON.Vector3(0, wallH - 10, 0),
        scene,
      );
      pointLight.intensity = 0.5;
      pointLight.diffuse = new BABYLON.Color3(1, 0.98, 0.95);
      pointLight.range = 1000;
      // const ambientLight = new BABYLON.HemisphericLight(
      //   "ambient",
      //   new BABYLON.Vector3(0, 1, 0),
      //   scene,
      // );
      // ambientLight.intensity = 0.8;
      // ambientLight.diffuse = new BABYLON.Color3(1, 0.95, 0.85);
      // ambientLight.groundColor = new BABYLON.Color3(0.6, 0.55, 0.45);

      // const ceilingLamp = new BABYLON.PointLight(
      //   "ceilingLamp",
      //   new BABYLON.Vector3(0, wallH - 40, 0),
      //   scene,
      // );
      // ceilingLamp.intensity = 5.5; // Increased from 3.5
      // ceilingLamp.diffuse = new BABYLON.Color3(1, 0.92, 0.78); // Warmer orange tone
      // ceilingLamp.range = 2000;

      // // Additional ceiling lights for even illumination
      // const ceilingLamp2 = new BABYLON.PointLight(
      //   "ceilingLamp2",
      //   new BABYLON.Vector3(-rw / 4, wallH - 50, rd / 4),
      //   scene,
      // );
      // ceilingLamp2.intensity = 3.0;
      // ceilingLamp2.diffuse = new BABYLON.Color3(1, 0.93, 0.8);
      // ceilingLamp2.range = 1200;

      // const ceilingLamp3 = new BABYLON.PointLight(
      //   "ceilingLamp3",
      //   new BABYLON.Vector3(rw / 4, wallH - 50, -rd / 4),
      //   scene,
      // );
      // ceilingLamp3.intensity = 3.0;
      // ceilingLamp3.diffuse = new BABYLON.Color3(1, 0.93, 0.8);
      // ceilingLamp3.range = 1200;

      // const fillLight = new BABYLON.DirectionalLight(
      //   "fillLight",
      //   new BABYLON.Vector3(0, -0.5, 0.2),
      //   scene,
      // );
      // fillLight.intensity = 0.2;
      // fillLight.diffuse = new BABYLON.Color3(1, 0.95, 0.88); // Warm fill

      // const mainSpot = new BABYLON.SpotLight(
      //   "mainSpot",
      //   new BABYLON.Vector3(0, wallH - 30, 0),
      //   new BABYLON.Vector3(0, -1, 0),
      //   Math.PI / 2.5,
      //   2,
      //   scene,
      // );
      // mainSpot.intensity = 8.0;
      // mainSpot.diffuse = new BABYLON.Color3(1, 0.95, 0.85);
      // mainSpot.range = 800;

      // // Spotlight tambahan
      // const spot2 = new BABYLON.SpotLight(
      //   "spot2",
      //   new BABYLON.Vector3(-rw / 3, wallH - 40, rd / 3),
      //   new BABYLON.Vector3(0.2, -1, 0),
      //   Math.PI / 3,
      //   3,
      //   scene,
      // );
      // spot2.intensity = 4.5;
      // spot2.diffuse = new BABYLON.Color3(1, 0.93, 0.8);
      // spot2.range = 600;

      // const spot3 = new BABYLON.SpotLight(
      //   "spot3",
      //   new BABYLON.Vector3(rw / 3, wallH - 40, -rd / 3),
      //   new BABYLON.Vector3(-0.2, -1, 0),
      //   Math.PI / 3,
      //   3,
      //   scene,
      // );
      // spot3.intensity = 4.5;
      // spot3.diffuse = new BABYLON.Color3(1, 0.93, 0.8);
      // spot3.range = 600;

      // --- FLOOR

      const floorThickness = 9;
      const vinylThickness = 1;

      const floorBase = BABYLON.MeshBuilder.CreateBox(
        "floorBase",
        { width: rw, height: floorThickness - vinylThickness, depth: rd },
        scene,
      );
      floorBase.position.y = (floorThickness - vinylThickness) / 2;

      const floorBaseMat = new BABYLON.PBRMaterial("floorBaseMat", scene);
      floorBaseMat.albedoColor = new BABYLON.Color3(0.75, 0.65, 0.55);
      floorBaseMat.roughness = 0.7;
      floorBaseMat.metallic = 0;
      floorBase.material = floorBaseMat;

      const floorVinyl = BABYLON.MeshBuilder.CreateBox(
        "floorVinyl",
        { width: rw, height: vinylThickness, depth: rd },
        scene,
      );
      floorVinyl.position.y = floorThickness - vinylThickness / 2;

      const floorVinylMat = new BABYLON.PBRMaterial("floorVinylMat", scene);
      floorVinylMat.roughness = 0.5;
      floorVinylMat.metallic = 0;

      let texturePath = "";
      if (CONFIG.type === "bathroom") {
        texturePath = "/assets/texture/fine-wood-texture.jpg";
      } else if (CONFIG.type === "kitchen") {
        texturePath = "/assets/texture/wood-texture.jpg";
      } else {
        texturePath = "/assets/texture/light-wood-texture.jpg";
      }

      if (texturePath !== "") {
        const texture = new BABYLON.Texture(texturePath, scene);
        texture.uScale = rw / 100;
        texture.vScale = rd / 100;
        floorVinylMat.albedoTexture = texture;
      } else {
        floorVinylMat.albedoColor = new BABYLON.Color3(0.85, 0.75, 0.65);
      }

      floorVinyl.material = floorVinylMat;

      // --- CEILING ---
      const ceiling = BABYLON.MeshBuilder.CreateBox(
        "ceiling",
        { width: rw, height: floorThickness, depth: rd },
        scene,
      );
      ceiling.position.y = wallH - floorThickness / 2;

      const ceilingMat = new BABYLON.PBRMaterial("ceilingMat", scene);
      ceilingMat.albedoColor = new BABYLON.Color3(0.96, 0.96, 0.96);
      ceilingMat.roughness = 0.95;
      ceilingMat.metallic = 0;
      ceiling.material = ceilingMat;
      ceiling.metadata = { side: "ceiling" };

      // --- WALLS
      const interiorColor = new BABYLON.Color3(0.95, 0.94, 0.92);

      const wallMat = new BABYLON.PBRMaterial("wallMat", scene);
      wallMat.albedoColor = interiorColor;
      wallMat.roughness = 0.9;
      wallMat.metallic = 0;
      wallMat.backFaceCulling = false;

      const walls: BABYLON.Mesh[] = [];

      // back wall
      const backWall = BABYLON.MeshBuilder.CreateBox(
        "wall_back",
        { width: rw + wallThick * 2, height: wallH, depth: wallThick },
        scene,
      );
      backWall.position.set(0, wallH / 2, rd / 2 + wallThick / 2);
      backWall.material = wallMat;
      backWall.metadata = { side: "back" };
      walls.push(backWall);

      // Front wall
      const frontWall = BABYLON.MeshBuilder.CreateBox(
        "wall_front",
        { width: rw + wallThick * 2, height: wallH, depth: wallThick },
        scene,
      );
      frontWall.position.set(0, wallH / 2, -rd / 2 - wallThick / 2);
      frontWall.material = wallMat;
      frontWall.metadata = { side: "front" };
      walls.push(frontWall);

      // Left wall
      const leftWall = BABYLON.MeshBuilder.CreateBox(
        "wall_left",
        { width: wallThick, height: wallH, depth: rd },
        scene,
      );
      leftWall.position.set(-rw / 2 - wallThick / 2, wallH / 2, 0);
      leftWall.material = wallMat;
      leftWall.metadata = { side: "left" };
      walls.push(leftWall);

      // Right wall
      const rightWall = BABYLON.MeshBuilder.CreateBox(
        "wall_right",
        { width: wallThick, height: wallH, depth: rd },
        scene,
      );
      rightWall.position.set(rw / 2 + wallThick / 2, wallH / 2, 0);
      rightWall.material = wallMat;
      rightWall.metadata = { side: "right" };
      walls.push(rightWall);

      walls.push(ceiling);

      // --- SHADOW SETUP ---
      // const shadowGen = new BABYLON.ShadowGenerator(2048, ceilingLamp);
      // shadowGen.useBlurExponentialShadowMap = true;
      // shadowGen.blurKernel = 64;
      // shadowGen.setDarkness(0.35);

      // shadowGen.addShadowCaster(ceiling);

      // walls.forEach((wall) => {
      //   wall.receiveShadows = true;
      // });
      // ceiling.receiveShadows = true;
      // floorVinyl.receiveShadows = true;

      // --- FURNITURE LOADER ---
      let selectedModel = "wine_cabinet.glb";
      try {
        selectedModel =
          sessionStorage.getItem("selectedFurniture") || "wine_cabinet.glb";
      } catch (e) {
        console.log("Session storage not available");
      }

      BABYLON.SceneLoader.ImportMesh(
        "",
        "/assets/3d/",
        selectedModel,
        scene,
        function (meshes) {
          if (meshes.length === 0) return;
          const furniture = meshes[0];

          // ---  GANTI TEKSTUR FURNITURE ---
          let savedFurnitureTexture = "";
          try {
            savedFurnitureTexture =
              sessionStorage.getItem("selectedFurnitureTexture") || "";
          } catch (e) {}

          if (savedFurnitureTexture && savedFurnitureTexture.trim() !== "") {
            const texturePath = "/assets/" + savedFurnitureTexture;
            const newTex = new BABYLON.Texture(texturePath, scene);

            const applyTextureToFurniture = () => {
              meshes.forEach((mesh) => {
                const pbrMat = new BABYLON.PBRMaterial("customMat", scene);
                pbrMat.albedoTexture = newTex;
                pbrMat.roughness = 0.7;
                mesh.material = pbrMat;
              });
            };

            setTimeout(applyTextureToFurniture, 100);
          }

          furniture.getChildMeshes().forEach((m) => {
            m.metadata = "furniture";
          });

          // Scaling & Positioning logic
          const boundsInfo = furniture.getHierarchyBoundingVectors(true);
          const sizeY = boundsInfo.max.y - boundsInfo.min.y;
          const targetHeight = 80;
          const scaleFactor = sizeY > 0 ? targetHeight / sizeY : 1;

          furniture.scaling.set(scaleFactor, scaleFactor, scaleFactor);
          furniture.position.y = -boundsInfo.min.y * scaleFactor;
          furniture.position.z = 217;
          furniture.position.x = 40;

          // Drag Behavior
          const dragBehavior = new BABYLON.PointerDragBehavior({
            dragPlaneNormal: new BABYLON.Vector3(0, 1, 0),
          });
          dragBehavior.moveAttached = true;

          // Visual Cue Events
          dragBehavior.onDragStartObservable.add(() => {
            canvas.setAttribute("data-visual-cue", "dragged");
          });
          dragBehavior.onDragEndObservable.add(() => {
            canvas.setAttribute("data-visual-cue", "none");
          });

          // Anti-Tembus Logic
          const clampToRoom = () => {
            const b = furniture.getHierarchyBoundingVectors(true);
            const margin = 2;
            const limitX = rw / 2 - margin;
            const limitZ = rd / 2 - margin;

            if (b.max.x > limitX) furniture.position.x -= b.max.x - limitX;
            if (b.min.x < -limitX) furniture.position.x += -limitX - b.min.x;
            if (b.max.z > limitZ) furniture.position.z -= b.max.z - limitZ;
            if (b.min.z < -limitZ) furniture.position.z += -limitZ - b.min.z;
          };

          dragBehavior.onDragObservable.add(clampToRoom);
          furniture.addBehavior(dragBehavior);
        },
        null,
        (scene, message) => {
          console.error("Error loading mesh:", message);
        },
      );

      // --- GLOBAL INTERACTIONS ---
      scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
          const pick = scene.pick(scene.pointerX, scene.pointerY);
          if (canvas.getAttribute("data-visual-cue") !== "dragged") {
            if (
              pick.hit &&
              pick.pickedMesh &&
              pick.pickedMesh?.metadata === "furniture"
            ) {
              canvas.style.cursor = "grab";
            } else {
              canvas.style.cursor = "default";
            }
          }
        }
      });

      // Auto-Hide Walls logic
      scene.registerBeforeRender(() => {
        walls.forEach((w) => {
          if (!w.metadata) return;
          const cam = camera.position;

          if (w.metadata.side === "back" && cam.z > w.position.z)
            w.visibility = 0;
          else if (w.metadata.side === "front" && cam.z < w.position.z)
            w.visibility = 0;
          else if (w.metadata.side === "left" && cam.x < w.position.x)
            w.visibility = 0;
          else if (w.metadata.side === "right" && cam.x > w.position.x)
            w.visibility = 0;
          else if (w.metadata.side === "ceiling" && cam.y > w.position.y)
            w.visibility = 0;
          else w.visibility = 1;
        });
      });

      return scene;
    };

    const scene = createScene();
    sceneRef.current = scene; // Simpan scene ke Ref global

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      engine.resize();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !mainModel) return;
    const scene = sceneRef.current;

    // Hapus mesh utama sebelumnya jika ada
    if (mainMeshRef.current) {
      mainMeshRef.current.dispose();
      mainMeshRef.current = null;
    }

    BABYLON.SceneLoader.ImportMesh(
      "",
      "/assets/3d/",
      mainModel, // Pakai prop mainModel
      scene,
      function (meshes) {
        if (meshes.length === 0) return;
        const rootMesh = meshes[0];
        mainMeshRef.current = rootMesh; // Simpan ke ref

        // Setup dasar mesh (scale, posisi) sama seperti code lamamu
        rootMesh.getChildMeshes().forEach((m) => {
          m.metadata = "furniture"; // Tagging
          // Cek jika ada texture aktif, langsung apply
          if (activeTexture) applyTextureToMesh(m, activeTexture, scene);
        });

        // Auto Scaling Logic
        const boundsInfo = rootMesh.getHierarchyBoundingVectors(true);
        const sizeY = boundsInfo.max.y - boundsInfo.min.y;
        const targetHeight = 80; // Sesuaikan
        const scaleFactor = sizeY > 0 ? targetHeight / sizeY : 1;
        rootMesh.scaling.set(scaleFactor, scaleFactor, scaleFactor);
        rootMesh.position.set(40, -boundsInfo.min.y * scaleFactor, 0); // Posisi default tengah

        // Add Drag Behavior
        addDragBehavior(rootMesh, scene);
      },
    );
  }, [mainModel]); // Dependency: mainModel

  // --- 3. EFFECT: LOAD ADDITIONAL MODELS (Jalan tiap user klik Tambahan) ---
  useEffect(() => {
    if (!sceneRef.current || additionalModels.length === 0) return;
    const scene = sceneRef.current;

    // Ambil item terakhir yg ditambahkan array
    const lastAddedModel = additionalModels[additionalModels.length - 1];

    BABYLON.SceneLoader.ImportMesh(
      "",
      "/assets/3d/",
      lastAddedModel,
      scene,
      (meshes) => {
        const rootMesh = meshes[0];
        rootMesh.position.x = Math.random() * 100 - 50; // Random posisi biar gak numpuk

        rootMesh.getChildMeshes().forEach((m) => {
          m.metadata = "furniture";
          if (activeTexture) applyTextureToMesh(m, activeTexture, scene);
        });

        // Scaling standard
        rootMesh.scaling.set(1, 1, 1); // Sesuaikan scaling logic
        addDragBehavior(rootMesh, scene);
      },
    );
  }, [additionalModels.length]); // Dependency: panjang array berubah

  // --- 4. EFFECT: CHANGE TEXTURE (Jalan tiap user pilih Warna) ---
  useEffect(() => {
    if (!sceneRef.current || !activeTexture) return;
    const scene = sceneRef.current;

    // Strategi: Apply texture ke SEMUA mesh yang punya metadata="furniture"
    // Atau kamu bisa cuma apply ke yg diselect (perlu logic selection manager tambahan)
    // Untuk sekarang: Apply ke Main Mesh dulu.

    if (mainMeshRef.current) {
      mainMeshRef.current.getChildMeshes().forEach((m) => {
        applyTextureToMesh(m, activeTexture, scene);
      });
    }

    // Apply juga ke additional items (bisa diimprove dgn simpan ref array)
    scene.meshes.forEach((mesh) => {
      if (
        mesh.metadata === "furniture" &&
        mesh.parent !== mainMeshRef.current
      ) {
        applyTextureToMesh(mesh, activeTexture, scene);
      }
    });
  }, [activeTexture]);

  // --- HELPER FUNCTIONS ---
  const applyTextureToMesh = (
    mesh: BABYLON.AbstractMesh,
    texName: string,
    scene: BABYLON.Scene,
  ) => {
    const texturePath = "/assets/texture/" + texName;
    const newTex = new BABYLON.Texture(texturePath, scene);
    const pbrMat = new BABYLON.PBRMaterial("customMat_" + texName, scene);
    pbrMat.albedoTexture = newTex;
    pbrMat.roughness = 0.7;
    mesh.material = pbrMat;
  };

  const addDragBehavior = (
    mesh: BABYLON.AbstractMesh,
    scene: BABYLON.Scene,
  ) => {
    const dragBehavior = new BABYLON.PointerDragBehavior({
      dragPlaneNormal: new BABYLON.Vector3(0, 1, 0),
    });
    dragBehavior.moveAttached = true;
    mesh.addBehavior(dragBehavior);
  };

  return (
    <canvas ref={canvasRef} className="h-full w-full touch-none outline-none" />
  );
};
