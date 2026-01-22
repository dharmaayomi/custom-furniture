import * as BABYLON from "@babylonjs/core";
import { CONFIG, MATERIAL_CONFIG } from "./RoomConfig";

/**
 * Check if two meshes collide (with their bounding boxes)
 */
export const checkCollision = (
  mesh1: BABYLON.AbstractMesh,
  mesh2: BABYLON.AbstractMesh,
  margin: number = 5,
): boolean => {
  const bounds1 = mesh1.getHierarchyBoundingVectors(true);
  const bounds2 = mesh2.getHierarchyBoundingVectors(true);

  const pos1 = mesh1.position;
  const pos2 = mesh2.position;

  // Calculate actual bounds in world space
  const min1X = pos1.x + bounds1.min.x - margin;
  const max1X = pos1.x + bounds1.max.x + margin;
  const min1Z = pos1.z + bounds1.min.z - margin;
  const max1Z = pos1.z + bounds1.max.z + margin;

  const min2X = pos2.x + bounds2.min.x - margin;
  const max2X = pos2.x + bounds2.max.x + margin;
  const min2Z = pos2.z + bounds2.min.z - margin;
  const max2Z = pos2.z + bounds2.max.z + margin;

  // AABB collision check
  return min1X < max2X && max1X > min2X && min1Z < max2Z && max1Z > min2Z;
};

/**
 * Find nearest furniture and calculate snap position if close enough
 */
export const findSnapPosition = (
  movingMesh: BABYLON.AbstractMesh,
  allFurniture: BABYLON.AbstractMesh[],
  snapDistance: number = 30,
): {
  shouldSnap: boolean;
  position?: { x: number; z: number };
  targetMesh?: BABYLON.AbstractMesh;
} => {
  // No furniture to snap to
  if (allFurniture.length === 0) {
    return { shouldSnap: false };
  }

  // Debug: Log what we're checking
  const movingName = movingMesh.name;

  const movingBounds = movingMesh.getHierarchyBoundingVectors(true);
  const movingWidth = movingBounds.max.x - movingBounds.min.x;
  const movingDepth = movingBounds.max.z - movingBounds.min.z;

  let closestDistance = Infinity;
  let snapPos: { x: number; z: number } | undefined;
  let targetMesh: BABYLON.AbstractMesh | undefined;

  for (const otherMesh of allFurniture) {
    // Skip self and any children
    if (
      otherMesh === movingMesh ||
      otherMesh.parent === movingMesh ||
      movingMesh.parent === otherMesh
    ) {
      continue;
    }

    const otherBounds = otherMesh.getHierarchyBoundingVectors(true);
    const otherWidth = otherBounds.max.x - otherBounds.min.x;
    const otherDepth = otherBounds.max.z - otherBounds.min.z;

    const movingPos = movingMesh.position;
    const otherPos = otherMesh.position;

    // Calculate edges of both meshes
    const movingLeft = movingPos.x - movingWidth / 2;
    const movingRight = movingPos.x + movingWidth / 2;
    const movingFront = movingPos.z - movingDepth / 2;
    const movingBack = movingPos.z + movingDepth / 2;

    const otherLeft = otherPos.x - otherWidth / 2;
    const otherRight = otherPos.x + otherWidth / 2;
    const otherFront = otherPos.z - otherDepth / 2;
    const otherBack = otherPos.z + otherDepth / 2;

    // Check all snap possibilities (side by side)
    const snapOptions = [
      // Snap to right of other (furniture side by side, separated by gap)
      {
        x: otherRight + movingWidth / 2 + 5,
        z: otherPos.z,
        distance: Math.abs(movingLeft - otherRight),
        type: "right",
      },
      // Snap to left of other
      {
        x: otherLeft - movingWidth / 2 - 5,
        z: otherPos.z,
        distance: Math.abs(movingRight - otherLeft),
        type: "left",
      },
      // Snap to back of other
      {
        x: otherPos.x,
        z: otherBack + movingDepth / 2 + 5,
        distance: Math.abs(movingFront - otherBack),
        type: "back",
      },
      // Snap to front of other
      {
        x: otherPos.x,
        z: otherFront - movingDepth / 2 - 5,
        distance: Math.abs(movingBack - otherFront),
        type: "front",
      },
    ];

    // Find closest snap option
    for (const option of snapOptions) {
      // Only consider this snap if within snap distance
      if (option.distance < snapDistance && option.distance < closestDistance) {
        closestDistance = option.distance;
        snapPos = { x: option.x, z: option.z };
        targetMesh = otherMesh;
      }
    }
  }

  // Only return shouldSnap: true if we found a valid snap position
  if (closestDistance < snapDistance && snapPos !== undefined && targetMesh) {
    // Debug log
    console.log(
      "🎯 Snap target found:",
      targetMesh.name,
      "| Distance:",
      closestDistance.toFixed(1),
    );
    return {
      shouldSnap: true,
      position: snapPos,
      targetMesh,
    };
  }

  return { shouldSnap: false };
};
export const applyTextureToMesh = (
  mesh: BABYLON.AbstractMesh,
  texName: string,
  scene: BABYLON.Scene,
) => {
  const texturePath = "/assets/texture/" + texName;
  const newTex = new BABYLON.Texture(texturePath, scene);

  const pbrMat = new BABYLON.PBRMaterial("customMat_" + texName, scene);
  pbrMat.albedoTexture = newTex;
  pbrMat.roughness = MATERIAL_CONFIG.furniture.roughness;
  pbrMat.metallic = MATERIAL_CONFIG.furniture.metallic;
  pbrMat.directIntensity = MATERIAL_CONFIG.furniture.directIntensity;
  pbrMat.environmentIntensity = MATERIAL_CONFIG.furniture.environmentIntensity;
  pbrMat.specularIntensity = MATERIAL_CONFIG.furniture.specularIntensity;
  pbrMat.albedoColor = new BABYLON.Color3(
    MATERIAL_CONFIG.furniture.albedoBoost,
    MATERIAL_CONFIG.furniture.albedoBoost,
    MATERIAL_CONFIG.furniture.albedoBoost,
  );

  mesh.material = pbrMat;
};

/**
 * Add drag behavior that keeps mesh against nearest wall and inside room bounds
 * with collision detection and magnetic snap to other furniture
 */
export const addDragBehavior = (
  mesh: BABYLON.AbstractMesh,
  scene: BABYLON.Scene,
) => {
  const { rw, rd } = CONFIG;

  // Get all furniture meshes in scene (excluding self)
  // Only get root furniture meshes, not children
  const getAllFurniture = (): BABYLON.AbstractMesh[] => {
    const allFurniture = scene.meshes.filter(
      (m) =>
        m.metadata === "furniture" &&
        m !== mesh &&
        m.parent !== mesh &&
        !m.parent, // Only root meshes (no parent)
    ) as BABYLON.AbstractMesh[];

    // Debug: Log furniture count
    if (dragCount === 0) {
      console.log("📦 Found", allFurniture.length, "other furniture pieces");
      if (allFurniture.length > 0) {
        console.log("   Names:", allFurniture.map((f) => f.name).join(", "));
      }
    }

    return allFurniture;
  };

  // Get mesh dimensions (bounds already include scaling)
  const getMeshDimensions = () => {
    const boundsInfo = mesh.getHierarchyBoundingVectors(true);
    return {
      width: boundsInfo.max.x - boundsInfo.min.x,
      depth: boundsInfo.max.z - boundsInfo.min.z,
    };
  };

  // Log dimensions once for debugging
  const dims = getMeshDimensions();
  console.log("=== DRAG BEHAVIOR SETUP ===");
  console.log("Mesh dimensions:", {
    width: dims.width.toFixed(1),
    depth: dims.depth.toFixed(1),
  });
  console.log(
    "Room bounds: X=[" +
      -rw / 2 +
      " to +" +
      rw / 2 +
      "], Z=[" +
      -rd / 2 +
      " to +" +
      rd / 2 +
      "]",
  );
  console.log("==========================");

  // Determine which wall the object is currently against
  const getCurrentWall = (position: BABYLON.Vector3) => {
    const { width, depth } = getMeshDimensions();

    const distToBack = Math.abs(position.z - (rd / 2 - depth / 2 - 15));
    const distToFront = Math.abs(position.z - (-rd / 2 + depth / 2 + 15));
    const distToRight = Math.abs(position.x - (rw / 2 - width / 2 - 15));
    const distToLeft = Math.abs(position.x - (-rw / 2 + width / 2 + 15));

    const threshold = 30; // If within 30 units of wall position, consider it "on that wall"

    if (distToBack < threshold) return "back";
    if (distToFront < threshold) return "front";
    if (distToRight < threshold) return "right";
    if (distToLeft < threshold) return "left";

    return "none";
  };

  // Constrain position to stay inside room and along current wall
  const constrainPosition = (
    position: BABYLON.Vector3,
    currentWall: string,
  ) => {
    const { width, depth } = getMeshDimensions();

    let newX = position.x;
    let newZ = position.z;

    // Constrain based on current wall
    if (currentWall === "back") {
      // Against back wall - lock Z, allow X movement
      newZ = rd / 2 - depth / 2 - 15;
      const maxX = rw / 2 - width / 2 - 15;
      newX = Math.max(-maxX, Math.min(maxX, newX));
    } else if (currentWall === "front") {
      // Against front wall - lock Z, allow X movement
      newZ = -rd / 2 + depth / 2 + 15;
      const maxX = rw / 2 - width / 2 - 15;
      newX = Math.max(-maxX, Math.min(maxX, newX));
    } else if (currentWall === "right") {
      // Against right wall - lock X, allow Z movement
      newX = rw / 2 - width / 2 - 15;
      const maxZ = rd / 2 - depth / 2 - 15;
      newZ = Math.max(-maxZ, Math.min(maxZ, newZ));
    } else if (currentWall === "left") {
      // Against left wall - lock X, allow Z movement
      newX = -rw / 2 + width / 2 + 15;
      const maxZ = rd / 2 - depth / 2 - 15;
      newZ = Math.max(-maxZ, Math.min(maxZ, newZ));
    } else {
      // Not on any wall - check which wall is nearest and snap to it
      const distToBack = Math.abs(position.z - rd / 2);
      const distToFront = Math.abs(position.z - -rd / 2);
      const distToRight = Math.abs(position.x - rw / 2);
      const distToLeft = Math.abs(position.x - -rw / 2);

      const minDist = Math.min(
        distToBack,
        distToFront,
        distToRight,
        distToLeft,
      );

      if (distToBack === minDist) {
        newZ = rd / 2 - depth / 2 - 15;
        const maxX = rw / 2 - width / 2 - 15;
        newX = Math.max(-maxX, Math.min(maxX, newX));
      } else if (distToFront === minDist) {
        newZ = -rd / 2 + depth / 2 + 15;
        const maxX = rw / 2 - width / 2 - 15;
        newX = Math.max(-maxX, Math.min(maxX, newX));
      } else if (distToRight === minDist) {
        newX = rw / 2 - width / 2 - 15;
        const maxZ = rd / 2 - depth / 2 - 15;
        newZ = Math.max(-maxZ, Math.min(maxZ, newZ));
      } else {
        newX = -rw / 2 + width / 2 + 15;
        const maxZ = rd / 2 - depth / 2 - 15;
        newZ = Math.max(-maxZ, Math.min(maxZ, newZ));
      }
    }

    return { x: newX, z: newZ };
  };

  // Free drag behavior (can move anywhere)
  const dragBehavior = new BABYLON.PointerDragBehavior({
    dragPlaneNormal: new BABYLON.Vector3(0, 1, 0), // Drag on XZ plane (floor)
  });
  dragBehavior.moveAttached = false; // We'll handle position manually
  dragBehavior.useObjectOrientationForDragging = false;

  let currentWall = "";
  let dragCount = 0;
  let snapIndicator: BABYLON.Mesh | null = null;
  let isSnapped = false; // Track if currently snapped
  let dragStartPosition = new BABYLON.Vector3(); // Store drag start position
  let hasMovedEnough = false; // Track if moved enough to enable snap

  dragBehavior.onDragStartObservable.add(() => {
    currentWall = getCurrentWall(mesh.position);
    dragCount = 0;
    isSnapped = false; // Reset snap state on drag start
    hasMovedEnough = false; // Reset movement flag
    dragStartPosition.copyFrom(mesh.position); // Save start position

    console.log("=== DRAG START ===");
    console.log(
      "Start position:",
      mesh.position.x.toFixed(1),
      mesh.position.z.toFixed(1),
    );
    console.log("Currently on wall:", currentWall);

    // Create snap indicator (preview box)
    const dims = getMeshDimensions();
    snapIndicator = BABYLON.MeshBuilder.CreateBox(
      "snapIndicator",
      { width: dims.width, height: 2, depth: dims.depth },
      scene,
    );
    snapIndicator.position.y = 1;
    snapIndicator.isVisible = false;
    snapIndicator.isPickable = false;

    const snapMat = new BABYLON.StandardMaterial("snapMat", scene);
    snapMat.diffuseColor = new BABYLON.Color3(0, 1, 0);
    snapMat.alpha = 0.3;
    snapIndicator.material = snapMat;

    const canvas = scene.getEngine().getRenderingCanvas();
    if (canvas) {
      canvas.setAttribute("data-visual-cue", "dragged");
      canvas.style.cursor = "grabbing";
    }
  });

  dragBehavior.onDragObservable.add((event) => {
    // Save current position in case we need to revert
    const previousPos = mesh.position.clone();

    // Apply delta directly to current position (accumulate movement)
    const newPos = mesh.position.add(event.delta);

    // Constrain to current wall and room bounds
    const constrained = constrainPosition(newPos, currentWall);

    // Temporarily set new position to check collision
    mesh.position.x = constrained.x;
    mesh.position.z = constrained.z;

    // Check if moved enough from drag start position to enable snap
    const totalMovement = Math.sqrt(
      Math.pow(mesh.position.x - dragStartPosition.x, 2) +
        Math.pow(mesh.position.z - dragStartPosition.z, 2),
    );

    // Enable snap only after moving at least 10 units from start
    if (!hasMovedEnough && totalMovement > 10) {
      hasMovedEnough = true;
      console.log("✓ Movement threshold reached - snap enabled");
    }

    // Check collision with other furniture
    const allFurniture = getAllFurniture();
    let hasCollision = false;

    for (const otherMesh of allFurniture) {
      if (checkCollision(mesh, otherMesh, 0)) {
        hasCollision = true;
        break;
      }
    }

    // If collision, revert to previous position
    if (hasCollision) {
      mesh.position.copyFrom(previousPos);
      if (snapIndicator) snapIndicator.isVisible = false;

      if (dragCount % 20 === 0) {
        console.log("❌ Collision detected");
      }
    } else {
      // Only check snap if moved enough from start position
      if (hasMovedEnough) {
        const snapResult = findSnapPosition(mesh, allFurniture, 25);

        // Calculate movement distance from previous frame
        const frameDist = Math.sqrt(
          Math.pow(mesh.position.x - previousPos.x, 2) +
            Math.pow(mesh.position.z - previousPos.z, 2),
        );

        // Break snap if was snapped and moved > 3 units in one frame
        if (isSnapped && frameDist > 3) {
          isSnapped = false;
          console.log("🔓 Snap broken");
        }

        // Only apply snap if not currently snapped OR very close to snap point
        const shouldApplySnap =
          snapResult.shouldSnap && (!isSnapped || frameDist < 1);

        if (shouldApplySnap && snapResult.position) {
          // Show snap indicator
          if (snapIndicator) {
            snapIndicator.position.x = snapResult.position.x;
            snapIndicator.position.z = snapResult.position.z;
            snapIndicator.isVisible = true;
          }

          // Apply snap position
          const snappedConstrained = constrainPosition(
            new BABYLON.Vector3(
              snapResult.position.x,
              mesh.position.y,
              snapResult.position.z,
            ),
            currentWall,
          );
          mesh.position.x = snappedConstrained.x;
          mesh.position.z = snappedConstrained.z;

          if (!isSnapped) {
            console.log("🧲 SNAPPED at X:", mesh.position.x.toFixed(1));
            isSnapped = true;
          }
        } else {
          if (snapIndicator) snapIndicator.isVisible = false;
        }
      } else {
        // Not moved enough yet - free movement, no snap
        if (snapIndicator) snapIndicator.isVisible = false;
      }

      // Log movement
      if (dragCount % 25 === 0) {
        if (hasMovedEnough && !isSnapped) {
          console.log("→ Free drag X:", mesh.position.x.toFixed(1));
        } else if (!hasMovedEnough) {
          console.log("⏳ Initial movement...");
        }
      }
    }

    dragCount++;
  });

  dragBehavior.onDragEndObservable.add(() => {
    console.log("=== DRAG END ===");
    console.log(
      "Final position: X:",
      mesh.position.x.toFixed(1),
      "Z:",
      mesh.position.z.toFixed(1),
    );
    console.log("================");

    // Remove snap indicator
    if (snapIndicator) {
      snapIndicator.dispose();
      snapIndicator = null;
    }

    const canvas = scene.getEngine().getRenderingCanvas();
    if (canvas) {
      canvas.setAttribute("data-visual-cue", "none");
      canvas.style.cursor = "grab";
    }
  });

  mesh.addBehavior(dragBehavior);
};

/**
 * Calculate position for additional models (beside main model or random)
 */
export const calculateAdditionalModelPosition = (
  meshWidth: number,
  meshDepth: number,
  mainMeshRef: BABYLON.AbstractMesh | null,
): { x: number; z: number } => {
  // Default to back wall, INSIDE the room
  // Back wall is at +rd/2, so inner position is rd/2 - meshDepth/2 - offset
  const backWallInnerZ = CONFIG.rd / 2 - meshDepth / 2 - 15;

  let posX = 0;

  if (mainMeshRef) {
    const mainBounds = mainMeshRef.getHierarchyBoundingVectors(true);
    const mainWidth = mainBounds.max.x - mainBounds.min.x;

    // Place on the right side of main model
    posX = mainMeshRef.position.x + mainWidth / 2 + meshWidth / 2 + 20;

    // If outside room, place on left side
    const maxX = CONFIG.rw / 2 - meshWidth / 2 - 15;
    if (posX > maxX) {
      posX = mainMeshRef.position.x - mainWidth / 2 - meshWidth / 2 - 20;
    }

    // If still outside, random position in middle
    if (Math.abs(posX) > maxX) {
      posX = (Math.random() - 0.5) * (CONFIG.rw - meshWidth - 30);
    }

    // Final constraint
    posX = Math.max(-maxX, Math.min(maxX, posX));
  } else {
    // Fallback: random but inside room
    const maxX = CONFIG.rw / 2 - meshWidth / 2 - 15;
    posX = (Math.random() - 0.5) * (CONFIG.rw - meshWidth - 30);
    posX = Math.max(-maxX, Math.min(maxX, posX));
  }

  console.log("Additional model position - X:", posX, "Z:", backWallInnerZ);
  console.log("Room bounds: X=±", CONFIG.rw / 2, "Z=±", CONFIG.rd / 2);

  return { x: posX, z: backWallInnerZ };
};

/**
 * Auto-scale mesh to target height
 */
export const autoScaleMesh = (
  mesh: BABYLON.AbstractMesh,
  targetHeight: number = 80,
): number => {
  const boundsInfo = mesh.getHierarchyBoundingVectors(true);
  const sizeY = boundsInfo.max.y - boundsInfo.min.y;
  const scaleFactor = sizeY > 0 ? targetHeight / sizeY : 1;
  mesh.scaling.set(scaleFactor, scaleFactor, scaleFactor);
  return scaleFactor;
};

/**
 * Setup pointer interactions (cursor changes)
 */
export const setupPointerInteractions = (
  scene: BABYLON.Scene,
  canvas: HTMLCanvasElement,
) => {
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
      const pick = scene.pick(scene.pointerX, scene.pointerY);
      if (canvas.getAttribute("data-visual-cue") !== "dragged") {
        if (pick.hit && pick.pickedMesh) {
          // Check if picked mesh or its parent is furniture
          const isFurniture =
            pick.pickedMesh.metadata === "furniture" ||
            (pick.pickedMesh.parent &&
              pick.pickedMesh.parent.metadata === "furniture");

          if (isFurniture) {
            canvas.style.cursor = "grab";
          } else {
            canvas.style.cursor = "default";
          }
        } else {
          canvas.style.cursor = "default";
        }
      }
    }
  });
};

/**
 * Setup auto-hide walls based on camera position
 */
export const setupAutoHideWalls = (
  scene: BABYLON.Scene,
  walls: BABYLON.Mesh[],
  camera: BABYLON.ArcRotateCamera,
) => {
  scene.registerBeforeRender(() => {
    walls.forEach((w) => {
      if (!w.metadata) return;
      const cam = camera.position;

      if (w.metadata.side === "back" && cam.z > w.position.z) w.visibility = 0;
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
};
