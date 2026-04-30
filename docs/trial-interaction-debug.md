# Trial Interaction Debug Guide

This document explains how selection, drag, and camera input work in the Trial Room after the interaction rewrite.

## Purpose

Use this guide when:

- selection outline appears on the wrong object
- a frame or interior cannot be selected
- drag sometimes moves the camera instead of the product
- click clears selection unexpectedly
- a new interaction bug appears after changing trial scene code

## Current Rules

- The store field `selectedMeshName` currently stores a model `instanceId`, not a Babylon mesh name.
- `TrialModelRegistry` is the source of truth for resolving `instanceId -> loaded model`.
- Real product meshes are used for selection.
- Invisible drag hitboxes are used only for the currently selected product.
- Camera input is detached when model drag starts and reattached when drag ends.
- Interior selection has higher pick priority than frame selection.

## Main Flow

### 1. Model load

File: [src/features/trial/furniture/TrialModelLoader.tsx](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/furniture/TrialModelLoader.tsx)

- Each loaded model gets a stable `instanceId`.
- The root mesh and child meshes become pickable.
- A drag proxy hitbox is created.
- The drag proxy starts as `isPickable = false`.
- The loader returns:
  - `instanceId`
  - `selectionMeshes`
  - `boundingBoxMesh`
  - `dragBehavior`
  - `syncBoundingBox()`

### 2. Drag metadata registration

Files:

- [src/features/trial/furniture/TrialModelUtils.tsx](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/furniture/TrialModelUtils.tsx)
- [src/features/trial/furniture/DragBehavior.tsx](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/furniture/DragBehavior.tsx)

- All render meshes and the drag hitbox receive metadata with:
  - `dragRootInstanceId`
  - `dragBehavior`
  - `dragHitBox`
  - `kind`
- The drag hitbox is only enabled for the selected model.

### 3. Scene registration

File: [src/features/trial/TrialRoomCanvas.tsx](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/TrialRoomCanvas.tsx)

- When a frame or interior is spawned:
  - it is registered in `TrialModelRegistry`
  - it is added to local frame/interior instance arrays
  - drag lifecycle observers are attached

### 4. Selection and pick resolution

File: [src/features/trial/TrialRoomCanvas.tsx](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/TrialRoomCanvas.tsx)

Function to inspect first:

- `resolveInteractionPick()`

This function uses `scene.multiPick()` and scores candidates by priority:

- selected interior mesh
- interior mesh
- selected drag proxy
- selected frame mesh
- frame mesh
- room surface

If selection looks wrong, this function is the first place to debug.

### 5. Pointer ownership and drag start

File: [src/features/trial/TrialRoomCanvas.tsx](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/TrialRoomCanvas.tsx)

Functions to inspect:

- `setCameraInteractionEnabled()`
- `registerDragLifecycle()`
- `prePointerObserver`

Behavior:

- first click on a model selects it
- second click on the same selected model can start drag
- before drag starts, camera input is detached
- when drag ends, camera input is reattached

If camera and drag fight each other, debug these functions first.

### 6. Outline sync

Files:

- [src/features/trial/TrialRoomCanvas.tsx](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/TrialRoomCanvas.tsx)
- [src/features/trial/furniture/TrialModelRegistry.ts](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/furniture/TrialModelRegistry.ts)

Function to inspect:

- `syncSelectionOutline()`

Behavior:

- store selected id -> registry lookup -> model selection meshes -> outline layer
- the same selection change also updates which drag proxy is pickable

If outline is wrong but clicking seems correct, debug this function.

## File Map

### Selection bugs

Edit:

- [src/features/trial/TrialRoomCanvas.tsx](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/TrialRoomCanvas.tsx)
- [src/features/trial/furniture/TrialModelRegistry.ts](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/furniture/TrialModelRegistry.ts)

Check:

- `resolveInteractionPick()`
- `syncSelectionOutline()`
- registry registration and unregistering

### Drag bugs

Edit:

- [src/features/trial/furniture/DragBehavior.tsx](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/furniture/DragBehavior.tsx)
- [src/features/trial/furniture/TrialModelUtils.tsx](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/furniture/TrialModelUtils.tsx)
- [src/features/trial/TrialRoomCanvas.tsx](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/TrialRoomCanvas.tsx)

Check:

- `getTrialResolvedDragTarget()`
- `tryStartTrialDragFromPick()`
- `registerDragLifecycle()`
- hitbox `isPickable` state
- `syncBoundingBox()`

### Camera interaction bugs

Edit:

- [src/features/trial/core/TrialCameraSetup.tsx](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/core/TrialCameraSetup.tsx)
- [src/features/trial/TrialRoomCanvas.tsx](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/TrialRoomCanvas.tsx)

Check:

- `camera.attachControl()`
- `camera.detachControl()`
- `setCameraInteractionEnabled()`
- pointer observer ordering

### Interior placement or fit bugs

Edit:

- [src/features/trial/TrialRoomCanvas.tsx](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/TrialRoomCanvas.tsx)
- [src/features/trial/CabinetConfig.ts](/abs/path/c:/Users/User/Documents/CODE/custom-furniture/src/features/trial/CabinetConfig.ts)

Check:

- `spawnInterior()`
- `getHierarchyBoundsInLocalSpace()`
- anchor calculation
- fit checks and scaling rules

## Fast Debug Checklist

When a bug appears, inspect in this order:

1. Did the click resolve to the correct `instanceId`?
2. Is the registry entry present for that `instanceId`?
3. Is the selected model's drag proxy the only pickable proxy?
4. Did camera input detach before drag started?
5. Did drag end reattach camera input?
6. Did selection clear because the click resolved to empty space or room geometry?

## Recommended Temporary Logs

Add logs only while debugging, then remove them.

### Pick resolution

Add inside `resolveInteractionPick()`:

```ts
console.log("[trial-pick]", {
  selected: useTrialRoomStore.getState().selectedMeshName,
  candidates: scoredPicks.map((candidate) => ({
    instanceId: candidate.instanceId,
    priority: candidate.priority,
    distance: candidate.pick.distance,
    mesh: candidate.mesh.name,
  })),
});
```

### Drag lifecycle

Add inside `registerDragLifecycle()`:

```ts
console.log("[trial-drag-start]", result.instanceId);
console.log("[trial-drag-end]", result.instanceId);
```

### Selection sync

Add inside `syncSelectionOutline()`:

```ts
console.log("[trial-selection]", {
  selected: selectedInstanceId,
  resolved: selectedModel?.rootMesh.name ?? null,
});
```

## Common Failure Patterns

### Interior cannot be selected

Likely causes:

- frame proxy became pickable when it should not be
- pick priority favors frame mesh over interior mesh
- interior was not registered or selection id points to stale model

### Frame is selected but drag still moves camera

Likely causes:

- drag did not start from the resolved pick
- camera did not detach before drag start
- drag lifecycle observer did not attach

### Selection outline disappears

Likely causes:

- selected id is null
- registry entry missing
- `selectionMeshes` empty
- selection changed but `syncSelectionOutline()` did not run

## Safe Refactor Advice

If you need to change interaction behavior, prefer this order:

1. Adjust pick priority in `resolveInteractionPick()`
2. Adjust proxy pickability in `syncDragProxyPickability()`
3. Adjust drag start rules in `prePointerObserver`
4. Adjust drag math in `DragBehavior.tsx`
5. Adjust camera behavior only after the above is confirmed correct

This keeps interaction bugs localized and easier to reason about.
