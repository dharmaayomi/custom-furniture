import * as BABYLON from "@babylonjs/core";
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
    const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(
      "/assets/3d/",
      "human-model.glb",
      scene,
    );

    container.addAllToScene();

    const rootMesh = container.meshes[0];

    // Scaling
    const boundingInfo = rootMesh.getHierarchyBoundingVectors(true);
    const modelHeight = boundingInfo.max.y - boundingInfo.min.y;

    const targetHeight = 170;
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
      10 - scaledBounding.min.y,
      position.z,
    );

    const floorY = 10;

    // ✨ GARIS TINGGI - Lebih tipis
    const heightLine = BABYLON.MeshBuilder.CreateLines(
      "heightLine",
      {
        points: [
          new BABYLON.Vector3(position.x + 10, floorY, position.z), // Offset ke samping
          new BABYLON.Vector3(
            position.x + 10,
            floorY + actualHeight,
            position.z,
          ),
        ],
      },
      scene,
    );
    heightLine.color = new BABYLON.Color3(0.2, 0.2, 0.2); // ✨ Abu-abu gelap
    heightLine.parent = rootMesh;

    // ✨ TICK MARKS - Lebih kecil dan subtle
    const createTick = (yOffset: number) => {
      const tick = BABYLON.MeshBuilder.CreateLines(
        `tick_${yOffset}`,
        {
          points: [
            new BABYLON.Vector3(position.x + 8, floorY + yOffset, position.z),
            new BABYLON.Vector3(position.x + 12, floorY + yOffset, position.z),
          ],
        },
        scene,
      );
      tick.color = new BABYLON.Color3(0.2, 0.2, 0.2); // ✨ Abu-abu gelap
      tick.parent = rootMesh;
      return tick;
    };

    createTick(0);
    createTick(actualHeight);

    // ✨ LABEL TINGGI - Lebih kecil dan subtle
    const planeWidth = 30;
    const planeHeight = 15;
    const heightLabel = BABYLON.MeshBuilder.CreatePlane(
      "heightLabel",
      { width: planeWidth, height: planeHeight },
      scene,
    );
    heightLabel.position = new BABYLON.Vector3(
      position.x + 25, // Lebih jauh dari garis
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
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)"; // ✨ Putih semi-transparent
    ctx.fillRect(10, 30, 236, 68);

    // Border
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 30, 236, 68);

    // Text
    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "#333333"; // ✨ Abu-abu gelap
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(actualHeight)} cm`, 128, 64);

    dynamicTexture.update();

    const labelMat = new BABYLON.StandardMaterial("labelMat", scene);
    labelMat.diffuseTexture = dynamicTexture;
    labelMat.emissiveTexture = dynamicTexture;
    labelMat.opacityTexture = dynamicTexture;
    labelMat.backFaceCulling = false;
    heightLabel.material = labelMat;

    // ✨ HAPUS ARROW - Ini yang bikin "corong kuning" mengganggu!
    // createArrow(actualHeight + 4, 1);
    // createArrow(-4, -1);

    // Cast shadow
    rootMesh.getChildMeshes().forEach((mesh) => {
      mesh.receiveShadows = true;
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
    -roomConfig.width / 2 + 50,
    0,
    roomConfig.depth / 2 - 50,
  );

  const human = await HumanHelper(scene, humanPosition);

  return human;
};
