"use client";

import React, { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { HeaderCustom } from "./HeaderCustom";

const CONFIG = {
	rw: 400,
	rd: 400,
	type: "bedroom",
};

export const RoomCanvas = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!canvasRef.current) return;

		const canvas = canvasRef.current;

		// 1. Setup Engine
		const engine = new BABYLON.Engine(canvas, true);

		// 2. Setup Scene
		const createScene = () => {
			const scene = new BABYLON.Scene(engine);
			scene.clearColor = new BABYLON.Color4(0.9, 0.88, 0.85, 1);

			const rw = CONFIG.rw;
			const rd = CONFIG.rd;
			const wallH = 240;
			const wallThick = 6;

			// --- CAMERA ---
			const camera = new BABYLON.ArcRotateCamera(
				"camera",
				-Math.PI / 2,
				Math.PI / 3,
				800,
				new BABYLON.Vector3(0, 80, 0),
				scene
			);
			camera.attachControl(canvas, true);
			camera.wheelPrecision = 1.0;
			camera.lowerBetaLimit = 0.1;
			camera.upperBetaLimit = Math.PI / 2.1;
			camera.lowerRadiusLimit = 200;
			camera.upperRadiusLimit = 1200;

			// --- LIGHTING ---
			const light = new BABYLON.HemisphericLight(
				"light",
				new BABYLON.Vector3(0, 1, 0),
				scene
			);
			light.intensity = 1.3;
			light.groundColor = new BABYLON.Color3(0.2, 0.2, 0.2);

			const pointLight = new BABYLON.PointLight(
				"pointLight",
				new BABYLON.Vector3(0, wallH - 10, 0),
				scene
			);
			pointLight.intensity = 0.5;
			pointLight.diffuse = new BABYLON.Color3(1, 0.98, 0.95);
			pointLight.range = 1000;

			// --- FLOOR ---
			const floorThickness = 10;
			const floor = BABYLON.MeshBuilder.CreateBox(
				"floor",
				{ width: rw, height: floorThickness, depth: rd },
				scene
			);
			floor.position.y = -floorThickness / 2;

			let floorMat = new BABYLON.PBRMaterial("floorMat", scene);
			floorMat.roughness = 0.4;
			floorMat.metallic = 0;

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
				floorMat.albedoTexture = texture;
			}
			floor.material = floorMat;

			// --- WALLS ---
			const walls: BABYLON.Mesh[] = [];
			const wallData = [
				{ name: "back", w: rw, d: wallThick, x: 0, z: rd / 2 },
				{ name: "front", w: rw, d: wallThick, x: 0, z: -rd / 2 },
				{ name: "left", w: wallThick, d: rd, x: -rw / 2, z: 0 },
				{ name: "right", w: wallThick, d: rd, x: rw / 2, z: 0 },
			];

			const wallMat = new BABYLON.StandardMaterial("wallMat", scene);
			wallMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
			wallMat.backFaceCulling = false;

			wallData.forEach((data) => {
				const wall = BABYLON.MeshBuilder.CreateBox(
					"wall_" + data.name,
					{ width: data.w, height: wallH + floorThickness, depth: data.d },
					scene
				);
				let posX = data.x;
				let posZ = data.z;

				if (data.name === "back") posZ += wallThick / 2;
				if (data.name === "front") posZ -= wallThick / 2;
				if (data.name === "left") posX -= wallThick / 2;
				if (data.name === "right") posX += wallThick / 2;

				wall.position.set(posX, wallH / 2 - floorThickness / 2, posZ);
				wall.material = wallMat;
				wall.metadata = { side: data.name };
				walls.push(wall);
			});

			// --- FURNITURE LOADER ---

			let selectedModel = "sofa-1.glb";
			try {
				selectedModel =
					sessionStorage.getItem("selectedFurniture") || "chair-1.glb";
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
							// (Logika rekursif pencarian mesh dipersingkat untuk brevity, tapi logikamu bisa dimasukkan di sini)
							meshes.forEach((mesh) => {
								// Apply simple material override logic
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
					// Cek division by zero
					const targetHeight = 80;
					const scaleFactor = sizeY > 0 ? targetHeight / sizeY : 1;

					furniture.scaling.set(scaleFactor, scaleFactor, scaleFactor);
					furniture.position.y = -boundsInfo.min.y * scaleFactor;
					furniture.position.z = 0; // Center it initially
					furniture.position.x = 0;

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
				null, // onProgress
				(scene, message) => {
					console.error("Error loading mesh:", message);
				}
			);

			// --- GLOBAL INTERACTIONS ---
			scene.onPointerObservable.add((pointerInfo) => {
				if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
					const pick = scene.pick(scene.pointerX, scene.pointerY);
					if (canvas.getAttribute("data-visual-cue") !== "dragged") {
						if (
							pick.hit &&
							pick.pickedMesh &&
							(pick.pickedMesh.metadata === "furniture" ||
								pick.pickedMesh.parent?.metadata === "furniture")
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
					else w.visibility = 1;
				});
			});

			return scene;
		};

		// 3. Init Scene & Render Loop
		const scene = createScene();

		engine.runRenderLoop(() => {
			scene.render();
		});

		// 4. Handle Window Resize
		const handleResize = () => {
			engine.resize();
		};
		window.addEventListener("resize", handleResize);

		// 5. Cleanup saat component unmount (Penting!)
		return () => {
			window.removeEventListener("resize", handleResize);
			engine.dispose();
		};
	}, []); // Empty dependency array = run once on mount

	return (
		<canvas
			ref={canvasRef}
			className="w-full h-full outline-none touch-none" // touch-none penting untuk drag di mobile
		/>
	);
};
