import * as BABYLON from "@babylonjs/core";
import { FLOOR_Y } from "./RoomConfig";
import "@babylonjs/loaders/glTF";

interface HumanHelperResult {
  rootMesh: BABYLON.AbstractMesh;
  heightLabel: BABYLON.Mesh;
  heightLine: BABYLON.LinesMesh;
  dispose: () => void;
}

export const HumanHelper = async (
  scene: BABYLON.Scene,
  position: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0),
): Promise<HumanHelperResult | null> => {
  try {
    const container = await BABYLON.LoadAssetContainerAsync(
      "/assets/3d/" + "man-human-helper.glb",
      scene,
    );

    container.addAllToScene();

    const rootMesh = container.meshes[0];

    // Scaling
    const boundingInfo = rootMesh.getHierarchyBoundingVectors(true);
    const modelHeight = boundingInfo.max.y - boundingInfo.min.y;

    const targetHeight = 1.7;
    const scaleFactor = targetHeight / modelHeight;
    rootMesh.scaling = new BABYLON.Vector3(
      scaleFactor,
      scaleFactor,
      scaleFactor,
    );

    // Update bounding setelah scale
    rootMesh.computeWorldMatrix(true);
    const scaledBounding = rootMesh.getHierarchyBoundingVectors(true);
    const actualHeight = scaledBounding.max.y - scaledBounding.min.y;

    // POSISI SAMA SEPERTI FURNITURE
    rootMesh.position = new BABYLON.Vector3(
      position.x,
      FLOOR_Y - scaledBounding.min.y,
      position.z,
    );

    const floorY = FLOOR_Y;

    // ✨ GARIS TINGGI - Lebih tipis
    const heightLine = BABYLON.MeshBuilder.CreateLines(
      "heightLine",
      {
        points: [
          new BABYLON.Vector3(position.x + 0.1, floorY, position.z), // Offset ke samping
          new BABYLON.Vector3(
            position.x + 0.1,
            floorY + actualHeight,
            position.z,
          ),
        ],
      },
      scene,
    );
    heightLine.color = new BABYLON.Color3(0.2, 0.2, 0.2);
    heightLine.parent = rootMesh;

    const createTick = (yOffset: number) => {
      const tick = BABYLON.MeshBuilder.CreateLines(
        `tick_${yOffset}`,
        {
          points: [
            new BABYLON.Vector3(position.x + 0.08, floorY + yOffset, position.z),
            new BABYLON.Vector3(position.x + 0.12, floorY + yOffset, position.z),
          ],
        },
        scene,
      );
      tick.color = new BABYLON.Color3(0.2, 0.2, 0.2);
      tick.parent = rootMesh;
      return tick;
    };

    createTick(0);
    createTick(actualHeight);

    const planeWidth = 0.3;
    const planeHeight = 0.15;
    const heightLabel = BABYLON.MeshBuilder.CreatePlane(
      "heightLabel",
      { width: planeWidth, height: planeHeight },
      scene,
    );
    heightLabel.position = new BABYLON.Vector3(
      position.x + 0.25, // Lebih jauh dari garis
      floorY + actualHeight / 2,
      position.z,
    );
    heightLabel.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    heightLabel.parent = rootMesh;

    // Dynamic texture untuk text
    const dynamicTexture = new BABYLON.DynamicTexture(
      "heightText",
      { width: 256, height: 128 },
      scene,
      false,
    );
    dynamicTexture.hasAlpha = true;

    const ctx = dynamicTexture.getContext() as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, 256, 128);

    // Background lebih subtle
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillRect(10, 30, 236, 68);

    // Border
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 30, 236, 68);

    // Text
    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "#333333";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${actualHeight.toFixed(2)} m`, 128, 64);

    dynamicTexture.update();

    const labelMat = new BABYLON.StandardMaterial("labelMat", scene);
    labelMat.diffuseTexture = dynamicTexture;
    labelMat.emissiveTexture = dynamicTexture;
    labelMat.opacityTexture = dynamicTexture;
    labelMat.backFaceCulling = false;
    heightLabel.material = labelMat;

    // Cast shadow
    rootMesh.getChildMeshes().forEach((mesh) => {
      mesh.receiveShadows = false;
    });

    const dispose = () => {
      container.dispose();
      heightLine.dispose();
      heightLabel.dispose();
      dynamicTexture.dispose();
      labelMat.dispose();
    };

    return {
      rootMesh,
      heightLabel,
      heightLine,
      dispose,
    };
  } catch (error) {
    console.error("Error loading human model:", error);
    return null;
  }
};

export const setupHumanInRoom = async (
  scene: BABYLON.Scene,
  roomConfig: { width: number; depth: number },
) => {
  const humanPosition = new BABYLON.Vector3(
    -roomConfig.width / 2 + 0.5,
    0,
    roomConfig.depth / 2 - 0.5,
  );

  const human = await HumanHelper(scene, humanPosition);

  return human;
};
