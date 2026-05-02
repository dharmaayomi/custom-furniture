import * as BABYLON from "@babylonjs/core";
import { TrialRoomConfig } from "../core/TrialConfig";

export const createInteriorAnchorHelper = (
  scene: BABYLON.Scene,
  parent: BABYLON.TransformNode,
  name: string,
  localAnchor: BABYLON.Vector3,
) => {
  const markerRoot = new BABYLON.TransformNode(`${name}-anchor-root`, scene);
  markerRoot.parent = parent;
  markerRoot.position.copyFrom(localAnchor);

  const marker = BABYLON.MeshBuilder.CreateSphere(
    `${name}-anchor-point`,
    { diameter: 0.035 },
    scene,
  );
  marker.parent = markerRoot;
  marker.isPickable = false;

  const markerMaterial = new BABYLON.StandardMaterial(
    `${name}-anchor-mat`,
    scene,
  );
  markerMaterial.emissiveColor = new BABYLON.Color3(1, 0.4, 0.1);
  markerMaterial.disableLighting = true;
  marker.material = markerMaterial;

  const axisLength = 0.18;
  const axisDefinitions = [
    {
      suffix: "x",
      points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(axisLength, 0, 0)],
      color: new BABYLON.Color3(1, 0.9, 0.1),
    },
    {
      suffix: "y",
      points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, axisLength, 0)],
      color: new BABYLON.Color3(0.2, 1, 0.3),
    },
    {
      suffix: "z",
      points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, axisLength)],
      color: new BABYLON.Color3(0.2, 0.7, 1),
    },
  ];

  const axisLines = axisDefinitions.map(({ suffix, points, color }) => {
    const line = BABYLON.MeshBuilder.CreateLines(
      `${name}-anchor-axis-${suffix}`,
      { points },
      scene,
    );
    line.parent = markerRoot;
    line.color = color;
    line.isPickable = false;
    return line;
  });

  return {
    dispose: () => {
      axisLines.forEach((line) => line.dispose());
      markerMaterial.dispose();
      marker.dispose();
      markerRoot.dispose();
    },
  };
};

export const createRoomAnchorHelper = (
  scene: BABYLON.Scene,
  roomConfig: TrialRoomConfig,
) => {
  const axisLength = BABYLON.Scalar.Clamp(
    Math.min(roomConfig.width, roomConfig.depth) * 0.12,
    0.2,
    0.45,
  );
  const helperRoot = new BABYLON.TransformNode("trial-room-origin-root", scene);
  helperRoot.position.set(0, roomConfig.floorThickness + 0.01, 0);

  const centerMarker = BABYLON.MeshBuilder.CreateCylinder(
    "trial-room-origin-marker",
    {
      diameter: axisLength * 0.22,
      height: 0.01,
      tessellation: 32,
    },
    scene,
  );
  centerMarker.parent = helperRoot;
  centerMarker.isPickable = false;

  const centerMaterial = new BABYLON.StandardMaterial(
    "trial-room-origin-marker-mat",
    scene,
  );
  centerMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
  centerMaterial.disableLighting = true;
  centerMarker.material = centerMaterial;

  const axisDefinitions: Array<{
    name: string;
    points: BABYLON.Vector3[];
    color: BABYLON.Color3;
  }> = [
    {
      name: "x",
      points: [
        new BABYLON.Vector3(-axisLength, 0, 0),
        new BABYLON.Vector3(axisLength, 0, 0),
      ],
      color: new BABYLON.Color3(1, 0.25, 0.25),
    },
    {
      name: "y",
      points: [
        BABYLON.Vector3.Zero(),
        new BABYLON.Vector3(0, axisLength * 0.9, 0),
      ],
      color: new BABYLON.Color3(0.3, 1, 0.35),
    },
    {
      name: "z",
      points: [
        new BABYLON.Vector3(0, 0, -axisLength),
        new BABYLON.Vector3(0, 0, axisLength),
      ],
      color: new BABYLON.Color3(0.25, 0.7, 1),
    },
  ];

  const axisLines = axisDefinitions.map(({ name, points, color }) => {
    const line = BABYLON.MeshBuilder.CreateLines(
      `trial-room-origin-axis-${name}`,
      { points },
      scene,
    );
    line.parent = helperRoot;
    line.color = color;
    line.isPickable = false;
    return line;
  });

  return {
    dispose: () => {
      axisLines.forEach((line) => line.dispose());
      centerMarker.dispose();
      centerMaterial.dispose();
      helperRoot.dispose();
    },
  };
};

export const createLightSpotHelper = (
  scene: BABYLON.Scene,
  light: BABYLON.SpotLight,
  name: string,
  color: BABYLON.Color3,
) => {
  const mat = new BABYLON.StandardMaterial(`${name}Mat`, scene);
  mat.emissiveColor = color;
  mat.alpha = 0.15;
  mat.wireframe = true;

  const sphere = BABYLON.MeshBuilder.CreateSphere(
    `${name}Sphere`,
    { diameter: 0.18 },
    scene,
  );
  sphere.position = light.position.clone();
  sphere.material = mat;

  const direction = light.direction.normalize();
  const arrowLength = 0.9;
  const arrow = BABYLON.MeshBuilder.CreateCylinder(
    `${name}Arrow`,
    { height: arrowLength, diameter: 0.05 },
    scene,
  );
  arrow.position = light.position.add(direction.scale(arrowLength / 2));
  arrow.material = mat;

  const up = BABYLON.Vector3.Up();
  const angle = Math.acos(BABYLON.Vector3.Dot(up, direction));
  const axis = BABYLON.Vector3.Cross(up, direction).normalize();
  if (axis.length() > 0) {
    const q = BABYLON.Quaternion.RotationAxis(axis, angle);
    arrow.rotationQuaternion = q;
  }

  const coneHeight = 1.2;
  const coneRadius = Math.tan(light.angle / 2) * coneHeight;
  const cone = BABYLON.MeshBuilder.CreateCylinder(
    `${name}Cone`,
    {
      height: coneHeight,
      diameterTop: 0,
      diameterBottom: coneRadius * 2,
      tessellation: 16,
    },
    scene,
  );
  cone.position = light.position.add(direction.scale(coneHeight / 2));
  if (axis.length() > 0) {
    cone.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, angle);
  }
  cone.material = mat;

  return {
    dispose: () => {
      sphere.dispose();
      arrow.dispose();
      cone.dispose();
      mat.dispose();
    },
  };
};

export const createLightHelpers = (
  scene: BABYLON.Scene,
  lights: {
    ceilingLamp: BABYLON.SpotLight;
  },
) => {
  const ceilingHelper = createLightSpotHelper(
    scene,
    lights.ceilingLamp,
    "trialCeilingHelper",
    new BABYLON.Color3(1, 0.9, 0.2),
  );

  return {
    debugDispose: () => {
      ceilingHelper.dispose();
    },
  };
};
