# 📐 Flow Documentation: WallSnap System (BabylonJS)

> **File yang Didokumentasikan:**
>
> - `MeshUtils_WallSnap_DB.tsx` — Semua utilitas inti: snap, drag, material, AABB
> - `ModelLoader_WallSnap_DB.tsx` — Loader model GLB/DB + placement logic

---

## 📁 Dependency Map

```
ModelLoader_WallSnap_DB.tsx
    └── import dari MeshUtils_WallSnap_DB.tsx:
            ├── addDragBehavior
            ├── applyTextureToMesh
            ├── autoScaleMesh
            ├── cacheOriginalMaterials
            ├── getAllFurniture
            ├── getMeshAABB
            └── updateRoomDimensions
    └── import dari RoomConfig:
            ├── CONFIG (rw, rd)
            └── FLOOR_Y
    └── import dari useRoomStore:
            ├── FurnitureTransform (type)
            └── useRoomStore (Zustand state)
    └── import dari @/lib/price:
            └── extractModelNameFromId

MeshUtils_WallSnap_DB.tsx
    └── import dari @babylonjs/core
    └── import dari RoomConfig:
            ├── CONFIG
            ├── MATERIAL_CONFIG
            └── ROOM_DIMENSIONS
    └── import dari useRoomStore:
            ├── FurnitureTransform (type)
            └── useRoomStore (Zustand state)
```

---

## 🗂️ BAGIAN 1: MeshUtils_WallSnap_DB.tsx

---

### 1.1 Types & Interfaces

#### `BoundingBox`

```ts
interface BoundingBox {
  minX;
  maxX;
  minZ;
  maxZ: number; // batas AABB di sumbu X dan Z
  width;
  depth: number; // ukuran kalkulasi langsung
}
```

Digunakan oleh semua fungsi collision detection. Hanya X dan Z (bukan Y) karena furniture menempel di lantai — tinggi tidak relevan untuk overlap check horizontal.

---

#### `WallSide`

```ts
type WallSide = "back" | "front" | "left" | "right";
```

Enum string untuk keempat dinding ruangan. Dipakai secara konsisten di seluruh sistem snap, drag, dan auto-hide.

---

#### `WallSnapPosition`

```ts
interface WallSnapPosition {
  x: number; // posisi world X
  z: number; // posisi world Z
  wall: WallSide; // dinding mana yang di-snap
  rotation: number; // rotasi Y dalam radian
}
```

Return type dari `getWallSnapPosition`. Berisi semua info yang dibutuhkan untuk menempatkan furniture tepat di dinding.

---

### 1.2 `updateRoomDimensions(scene?)`

**Tujuan:** Sinkronisasi dimensi ruangan dari Zustand store ke `CONFIG` global, lalu re-snap semua furniture ke dinding yang benar ketika ukuran ruangan berubah.

**Flow lengkap:**

```
1. Ambil state dari useRoomStore.getState().present:
   - roomConfig (width, depth)
   - productBaseTransforms, productComponentTransforms
   - productBaseModels, productComponentModels

2. Set CONFIG.rw = roomConfig.width
   Set CONFIG.rd = roomConfig.depth

3. Jika scene diberikan:
   a. getAllFurniture(scene) → ambil semua mesh furniture
   b. Loop setiap mesh:

      [BRANCH A: Ada savedTransform yang cocok]
      ├── Cari mesh di productBaseModels → dapat savedTransform
      ├── Atau cari di productComponentModels → dapat savedTransform
      │
      ├── Hitung normalizedRotation dari savedTransform.rotation
      │   (modulo 2π agar selalu 0–2π)
      │
      ├── Tentukan currentWall dari rotasi (dengan toleransi 45°):
      │   ├── ~π    → "back"
      │   ├── ~0    → "front"
      │   ├── ~π/2  → "left"
      │   ├── ~3π/2 → "right"
      │   └── Fallback: hitung distansi ke tiap dinding, pilih terdekat
      │
      ├── Terapkan rotasi & scale dari savedTransform ke mesh
      ├── computeWorldMatrix(true)
      │
      ├── Panggil getWallSnapPosition(currentWall, mesh, savedPos)
      │   → dapat WallSnapPosition baru (x, z)
      │
      ├── Set mesh.position.x = newPos.x
      │   Set mesh.position.z = newPos.z
      │   Pertahankan mesh.position.y dari savedPos
      │
      └── updateTransformSilent(storeIndex, updatedTransform, isProductBase)
          (update store tanpa trigger undo history)

      [BRANCH B: Tidak ada savedTransform]
      ├── Hitung jarak ke 4 dinding dari posisi mesh saat ini
      ├── Pilih dinding terdekat sebagai currentWall
      ├── Panggil getWallSnapPosition(currentWall, mesh, pos)
      └── Set mesh.position.x/z = hasil snap (Y tidak diubah)
```

---

### 1.3 Material Cache System

#### Mengapa ada cache material?

Tanpa cache, setiap kali texture diubah → material baru dibuat → lighting berubah karena BabylonJS membaca parameter environment ulang. Cache memastikan material yang sama dipakai ulang selama parameter (mesh uniqueId + texName + uScale + vScale) tidak berubah.

---

#### `materialCache`

```ts
const materialCache = new Map<string, BABYLON.PBRMaterial>();
```

Key: `furnitureMat_{uniqueId}_{texName}_{uScale}_{vScale}`
Value: Instance `PBRMaterial` yang sudah dikonfigurasi.

---

#### `originalMaterialCache`

```ts
const originalMaterialCache = new Map<string, BABYLON.Material | null>();
```

Key: `original_{uniqueId}`
Value: Clone material asli sebelum texture override. Dipakai saat user me-reset texture.

---

#### `cacheOriginalMaterials(mesh)`

**Flow:**

```
1. Definisikan fungsi storeFor(m):
   a. Buat cacheKey = "original_{m.uniqueId}"
   b. Jika sudah ada di cache → skip (jangan overwrite)
   c. Ambil material asli (m.material ?? null)
   d. Coba clone material → simpan ke originalMaterialCache
      Jika gagal clone → simpan reference langsung

2. Panggil storeFor(mesh) untuk root mesh
3. Panggil storeFor(c) untuk setiap child mesh
```

Dipanggil **sekali saat model pertama di-load**, sebelum texture apapun diterapkan.

---

#### `getTexturePath(texName) → string`

```
Jika texName dimulai dengan:
  "http://", "https://", "data:", atau "/"
  → return texName apa adanya (URL absolut)
Selainnya:
  → return "/assets/texture/" + texName (path relatif)
```

---

#### `getTextureTiling(mesh) → { uScale, vScale }`

**Flow:**

```
1. computeWorldMatrix(true) + refreshBoundingInfo(true, true)
2. getHierarchyBoundingVectors → bounds (hanya node visible)
3. Hitung:
   width  = |bounds.max.x - bounds.min.x|  (min 0.001)
   height = |bounds.max.y - bounds.min.y|  (min 0.001)
   depth  = |bounds.max.z - bounds.min.z|  (min 0.001)
4. uScale = max(1, max(width, depth) / TEXTURE_TILE_SIZE_METERS)
   vScale = max(1, height / TEXTURE_TILE_SIZE_METERS)
   (TEXTURE_TILE_SIZE_METERS = 1)
```

Tujuan: Texture di-tile sesuai ukuran fisik mesh, sehingga 1 unit texture = 1 meter dunia nyata. Ini mencegah texture terlihat stretch/compress.

---

#### `getOrCreateMaterial(mesh, texName, scene) → PBRMaterial`

**Flow:**

```
1. Hitung { uScale, vScale } dari getTextureTiling(mesh)
2. Buat cacheKey = "furnitureMat_{uniqueId}_{texName}_{uScale}_{vScale}"
3. Cek materialCache:
   └── Jika ada DAN masih di scene yang sama → return cached material

4. Jika cache miss:
   a. Resolve path via getTexturePath(texName)
   b. Buat BABYLON.Texture baru:
      - uScale, vScale sesuai kalkulasi
      - wrapU = wrapV = WRAP_ADDRESSMODE (texture tile berulang)
   c. Buat PBRMaterial baru:
      - albedoTexture = texture baru
      - roughness, metallic, directIntensity, environmentIntensity,
        specularIntensity → dari MATERIAL_CONFIG.furniture
      - albedoColor = Color3(albedoBoost, albedoBoost, albedoBoost)
   d. Simpan ke materialCache
   e. Return material baru
```

---

### 1.4 AABB Utilities

#### `getMeshAABB(mesh) → BoundingBox`

**Flow (urutan penting):**

```
1. mesh.computeWorldMatrix(true)
   → Paksa recalculate transformasi world (scale, rotate, translate)

2. mesh.refreshBoundingInfo(true, true)
   → Paksa refresh bounding info root mesh

3. Loop semua child mesh:
   child.computeWorldMatrix(true)
   child.refreshBoundingInfo(true, true)
   → Pastikan semua children juga up-to-date

4. mesh.getHierarchyBoundingVectors(true, node => node.isVisible)
   → Ambil AABB world yang mencakup SEMUA node visible dalam hierarki

5. Return BoundingBox:
   { minX, maxX, minZ, maxZ, width, depth }
```

> ⚠️ **Urutan langkah 1-3 sangat penting!** Jika tidak di-refresh dulu, bounding box bisa return nilai stale dari frame sebelumnya — menyebabkan collision detection salah.

---

#### `checkAABBOverlap(box1, box2) → boolean`

```
Overlap terjadi jika:
  box1.minX < box2.maxX - ε  AND
  box1.maxX > box2.minX + ε  AND
  box1.minZ < box2.maxZ - ε  AND
  box1.maxZ > box2.minZ + ε

ε = 0.005 (epsilon untuk menghindari false positive pada batas tepat menempel)
```

AABB overlap standar di sumbu X dan Z. Menggunakan epsilon kecil agar furniture yang tepat bersebelahan (tanpa gap) tidak dianggap overlap.

---

#### `getAllFurniture(scene, excludeMesh?) → AbstractMesh[]`

```
Filter scene.meshes di mana:
  - m.metadata === "furniture"   → hanya mesh yang ditandai furniture
  - m !== excludeMesh            → kecuali mesh yang sedang di-drag/check
  - !m.parent                    → hanya root mesh (bukan children)
```

---

### 1.5 Wall Determination & Snap Logic

#### `determineClosestWall(position) → WallSide`

```
1. Ambil roomConfig.width (rw) dan roomConfig.depth (rd) dari store
2. Hitung jarak posisi ke 4 dinding:
   distToBack  = |position.z - rd/2|   (tembok belakang di +Z)
   distToFront = |position.z + rd/2|   (tembok depan di -Z)
   distToRight = |position.x - rw/2|   (tembok kanan di +X)
   distToLeft  = |position.x + rw/2|   (tembok kiri di -X)
3. Sort ascending berdasarkan jarak
4. Return wall dengan jarak terkecil
```

> Fungsi ini murni berbasis jarak. Tidak ada threshold — selalu return wall terdekat tanpa memandang seberapa jauh dari dinding.

---

#### `getWallSnapPosition(wall, mesh, pointerPos, fixedDims?) → WallSnapPosition`

Ini adalah **inti dari sistem wall snap**. Menghitung posisi exact di mana furniture harus diletakkan agar menempel ke dinding yang ditentukan.

**Flow lengkap:**

```
INPUT:
  wall       → dinding target ("back"/"front"/"left"/"right")
  mesh       → AbstractMesh yang akan di-snap
  pointerPos → posisi pointer/target di world space
  fixedDims  → { width, depth } opsional (dari cache saat drag)

STEP 1 — TENTUKAN ROTASI TARGET:
  back  → π      (180°, model menghadap ke depan/kamera)
  front → 0      (0°, model menghadap ke belakang)
  right → -π/2   (-90°)
  left  → +π/2   (+90°)

STEP 2 — TENTUKAN DIMENSI:
  Jika fixedDims diberikan:
    worldWidth = fixedDims.width
    worldDepth = fixedDims.depth
  Jika tidak:
    computeWorldMatrix(true)
    getHierarchyBoundingVectors(true)
    worldWidth = |bounds.max.x - bounds.min.x|
    worldDepth = |bounds.max.z - bounds.min.z|

STEP 3 — MAPPING DIMENSI KE WALL:
  Untuk back/front (tembok horizontal di Z):
    dimParallel     = worldWidth  (bergerak sepanjang X)
    dimPerpendicular = worldDepth (menonjol ke dalam ruangan di Z)

  Untuk left/right (tembok vertikal di X):
    dimParallel     = worldDepth  (bergerak sepanjang Z)
    dimPerpendicular = worldWidth (menonjol ke dalam ruangan di X)

STEP 4 — HITUNG POSISI FINAL:

  WALL_OFFSET = 0 (bisa diubah untuk jarak dari tembok)

  back:
    finalZ = rd/2 - dimPerpendicular/2 - WALL_OFFSET
    finalX = clamp(pointerPos.x, -(rw/2)+dimParallel/2, rw/2-dimParallel/2)

  front:
    finalZ = -rd/2 + dimPerpendicular/2 + WALL_OFFSET
    finalX = clamp(pointerPos.x, -(rw/2)+dimParallel/2, rw/2-dimParallel/2)

  right:
    finalX = rw/2 - dimPerpendicular/2 - WALL_OFFSET
    finalZ = clamp(pointerPos.z, -(rd/2)+dimParallel/2, rd/2-dimParallel/2)

  left:
    finalX = -rw/2 + dimPerpendicular/2 + WALL_OFFSET
    finalZ = clamp(pointerPos.z, -(rd/2)+dimParallel/2, rd/2-dimParallel/2)

OUTPUT: { x: finalX, z: finalZ, wall, rotation: targetRotation }
```

> **Clamp** digunakan agar furniture tidak keluar dari batas ruangan saat di-drag di dekat sudut.

---

### 1.6 Auto Snap (Adjacent) — `findAutoSnapPosition`

**Tujuan:** Ketika model baru ditambahkan, cari posisi otomatis di sebelah furniture yang sudah ada (`targetFurniture`), di dinding yang sama.

**Flow:**

```
INPUT:
  targetFurniture → mesh referensi (furniture yang sudah ada)
  newMeshWidth    → lebar model baru
  newMeshDepth    → kedalaman model baru
  allFurniture    → semua furniture existing di scene

1. Ambil AABB dari targetFurniture (targetBox)
2. Tentukan targetWall dari posisi targetFurniture (determineClosestWall)
3. Tentukan rotasi untuk wall tersebut

4. Buat 2 kandidat posisi (kanan dan kiri dari targetFurniture):

   Untuk back/front wall:
     kandidat1 = { x: targetBox.maxX + newMeshWidth/2 + gap, z: target.position.z }
     kandidat2 = { x: targetBox.minX - newMeshWidth/2 - gap, z: target.position.z }

   Untuk left/right wall:
     kandidat1 = { x: target.position.x, z: targetBox.maxZ + newMeshWidth/2 + gap }
     kandidat2 = { x: target.position.x, z: targetBox.minZ - newMeshWidth/2 - gap }

5. Loop setiap kandidat:
   a. Validasi batas ruangan:
      back/front: x ± newMeshWidth/2 harus dalam ±rw/2
      left/right: z ± newMeshWidth/2 harus dalam ±rd/2
   b. Buat testBox (BoundingBox untuk posisi kandidat)
   c. Cek overlap dengan semua furniture via checkAABBOverlap
   d. Jika tidak ada collision → return posisi ini

6. Return null jika semua kandidat invalid/collision
```

---

### 1.7 `applyTextureToMesh(mesh, texName, scene)`

**Flow:**

```
1. Hapus rotationQuaternion jika ada (paksa pakai Euler rotation)

2. Jika texName kosong/null:
   └── Restore dari originalMaterialCache
       - Jika ada original material → set mesh.material = originalMat
       - Jika tidak ada cache → biarkan material sekarang (jangan set null!)
   └── Return (early exit)

3. Jika texName valid:
   a. Cek originalMaterialCache untuk mesh ini
      Jika belum ada:
        - Clone material asli
        - Simpan ke originalMaterialCache
        - Jika gagal clone → simpan reference langsung + console.warn

   b. Panggil getOrCreateMaterial(mesh, texName, scene)
      → Dapat PBRMaterial (dari cache atau baru)

   c. Set mesh.material = material
```

---

### 1.8 `autoScaleMesh(mesh, maxHeightLimit?) → scaleFactor`

**Tujuan:** Fix unit mismatch otomatis (mm vs cm vs meter) dan pastikan furniture tidak menembus plafon.

**Flow:**

```
1. Ambil roomHeight dari roomConfig.height (Zustand store)

2. Hitung tinggi mesh saat ini:
   boundsInfo = getHierarchyBoundingVectors(true)
   currentY = boundsInfo.max.y - boundsInfo.min.y
   Jika currentY === 0 → return 1 (mesh tidak punya tinggi)

3. scaleFactor = 1

LOGIC 1 — DETEKSI UNIT SALAH:

  Kasus A: Model RAKSASA (currentY > roomHeight × 2)
    → Bagi scaleFactor dengan 10 berulang sampai currentY ≤ roomHeight × 1.5
    (Fix: MM diimport ke scene Meter → model 3000x terlalu besar)

  Kasus B: Model MIKRO (currentY < roomHeight × 0.05)
    → Kali scaleFactor dengan 10 berulang sampai currentY ≥ roomHeight × 0.2
    (Fix: Meter diimport ke scene CM → model 100x terlalu kecil)

LOGIC 2 — HARD LIMIT (PLAFON):
  projectedHeight = currentY × scaleFactor
  limit = maxHeightLimit || roomHeight
  Jika projectedHeight > limit:
    fitRatio = limit / projectedHeight
    scaleFactor *= fitRatio × 0.98  (beri gap 2% dari plafon)

4. mesh.scaling.set(scaleFactor, scaleFactor, scaleFactor)
   (Uniform scale — tidak distorsi)

5. Return scaleFactor
```

---

### 1.9 `addDragBehavior(mesh, scene)`

Ini adalah **sistem drag interaktif** yang paling kompleks. Menggunakan `BABYLON.PointerDragBehavior` dengan custom plane.

#### Setup Awal:

```
- dragBehavior = PointerDragBehavior({ dragPlaneNormal: Y-axis })
- moveAttached = false        → posisi tidak diset otomatis oleh BabylonJS
- validateDrag = () => true   → selalu boleh drag
- useObjectOrientationForDragging = false → drag di world space
- detachCameraControls = true → nonaktifkan kamera saat drag

- mesh.isPickable = true
- Semua children.isPickable = true
- mesh.addBehavior(dragBehavior)
```

#### FIX Children Drag:

```
Tambahkan observer di scene.onPointerObservable:
  Saat POINTERDOWN + button kiri:
    Jika pickedMesh adalah descendant dari mesh (bukan mesh itu sendiri):
      → dragBehavior.startDrag(pointerId)

Ini fix agar klik di bagian child model (seperti kaki kursi) tetap trigger drag
pada root mesh parent.
```

#### State Variables:

```
previousValidPosition → Vector3 (backup posisi valid terakhir)
previousValidRotation → number  (backup rotasi valid terakhir)
currentWall           → WallSide | null (dinding saat ini)
lastDragPlanePoint    → Vector3 | null (titik drag frame sebelumnya)
DRAG_SENSITIVITY = 0.3  (gerakan diperhalus 30% dari raw pointer)
DRAG_MAX_STEP = 0.35    (max pergerakan per frame dalam meter)
```

---

#### `onDragStartObservable`:

```
1. computeWorldMatrix + refreshBoundingInfo
2. updateRoomDimensions() → sinkron dimensi ruangan terkini
3. Hitung dragPlaneY = bounds.min.y + furnitureHeight / 2
   (drag plane di tengah furniture, bukan di lantai)
4. Override dragBehavior.currentDraggingPlane ke plane custom ini
5. Highlight mesh dengan warna amber (#f59e0b) via HighlightLayer "hl1"
6. Konversi rotationQuaternion → Euler jika ada
7. Backup previousValidPosition & previousValidRotation
8. Reset lastDragPlanePoint = null
9. captureCurrentState() → buat snapshot Zustand untuk undo
10. Tentukan currentWall dari posisi mesh saat ini (distansi ke 4 dinding)
11. Set canvas cursor = "grabbing"
```

---

#### `onDragObservable` (setiap frame drag):

```
1. Ambil event.dragPlanePoint (posisi pointer di drag plane)

2. SMOOTHING:
   Jika lastDragPlanePoint ada:
     delta = pointerPos - lastDragPlanePoint
     Jika |delta| > DRAG_MAX_STEP → cap delta ke DRAG_MAX_STEP
     pointerPos = lastDragPlanePoint + delta × DRAG_SENSITIVITY
     Update lastDragPlanePoint
   Jika tidak:
     lastDragPlanePoint = pointerPos.clone()

3. Ambil roomConfig dari store

4. HITUNG JARAK KE 4 TEMBOK dari pointerPos
   Sort ascending → nearestWall = yang terdekat
   minDist = jarak ke nearestWall

5. HYSTERESIS (Anti-goyang):
   SWITCH_THRESHOLD = min(rw, rd) × 0.01  (1% dari dimensi terkecil)
   HYSTERESIS = 1.5

   Jika currentWall belum ada → set ke nearestWall
   Jika nearestWall ≠ currentWall AND minDist < threshold/HYSTERESIS:
     → Pindah ke nearestWall (hanya kalau user benar-benar mendekati dinding baru)

6. targetWall = currentWall

7. TENTUKAN ROTASI TARGET sesuai targetWall

8. SIMPAN posisi & rotasi sekarang (savedPosition, savedRotation)

9. SIMULASI:
   Set mesh.rotation.y = targetRotation
   computeWorldMatrix(true)
   snapPos = getWallSnapPosition(targetWall, mesh, pointerPos)
   Simpan originalY
   Set mesh.position = (snapPos.x, originalY, snapPos.z)
   computeWorldMatrix(true)

10. CEK COLLISION:
    allFurniture = getAllFurniture(scene, mesh)  (exclude mesh ini sendiri)
    myBox = getMeshAABB(mesh)
    Loop semua furniture:
      Jika checkAABBOverlap(myBox, otherAABB) → hasCollision = true, break

11. HASIL:
    Jika collision:
      → Rollback ke savedPosition & savedRotation
    Jika tidak:
      → Update previousValidPosition & previousValidRotation
```

---

#### `onDragEndObservable`:

```
1. CEK COLLISION FINAL di posisi saat ini:
   allFurniture = getAllFurniture(scene, mesh)
   myBox = getMeshAABB(mesh)

   Jika collision:
     → mesh.position = previousValidPosition
     → mesh.rotation.y = previousValidRotation
     → computeWorldMatrix(true)

2. Jika tidak ada collision → SAVE TRANSFORM KE HISTORY:
   Buat FurnitureTransform = {
     modelName, position {x,y,z}, rotation, scale {x,y,z}
   }

   Cek apakah mesh ada di productBaseModels:
     → saveTransformToHistory(productBaseIndex, transform, true)
   Atau di productComponentModels:
     → saveTransformToHistory(productComponentIndex, transform, false)

3. Hapus highlight dari HighlightLayer "hl1"
4. Set canvas cursor = "grab"
```

---

### 1.10 `setupPointerInteractions(scene, canvas)`

**Tujuan:** Ubah cursor mouse menjadi "grab" saat hover furniture.

```
Tambahkan observer di scene.onPointerObservable:
  Saat POINTERMOVE:
    1. Jika canvas data-visual-cue === "dragged" → skip (jangan override cursor drag)
    2. Pick mesh di posisi pointer saat ini
    3. Traverse parent hierarchy dari pickedMesh:
       Berhenti jika metadata === "furniture"
    4. Jika root adalah furniture:
       → canvas.style.cursor = "grab"
       → canvas.setAttribute("data-visual-cue", "hover")
    5. Jika bukan furniture:
       → cursor = "default"
       → data-visual-cue = "none"
```

---

### 1.11 `setupAutoHideWalls(scene, walls, camera) → Observer`

**Tujuan:** Sembunyikan dinding yang berada di antara kamera dan interior ruangan.

```
Tambahkan observer di scene.onBeforeRenderObservable (setiap frame):
  Loop setiap wall mesh:
    1. Skip jika tidak ada metadata

    2. Untuk back/front wall:
       isViewedFromFrontBack = |cam.z| > |cam.x|
       isViewedFromLeftRight = |cam.x| > |cam.z|
       Jika salah satu true:
         w.scaling.x = rw / (rw + wallThickness × 2)
         (Crop dinding agar tidak overlap dengan side wall)

    3. VISIBILITY RULES:
       back wall   → sembunyi jika cam.z > wall.position.z + offset
       front wall  → sembunyi jika cam.z < wall.position.z - offset
       left wall   → sembunyi jika cam.x < wall.position.x - offset
       right wall  → sembunyi jika cam.x > wall.position.x + offset
       ceiling     → sembunyi jika cam.y > wall.position.y
       Else        → visibility = 1 (tampilkan)
```

---

---

## 🗂️ BAGIAN 2: ModelLoader_WallSnap_DB.tsx

---

### 2.1 Helper Functions

#### `getBaseModelName(modelName) → string`

```
Hapus ekstensi ".glb" dari modelName (case-insensitive).
"sofa.glb" → "sofa"
"sofa"     → "sofa"
```

---

#### `DbModelUrlResolver` (type)

```ts
type DbModelUrlResolver = (modelName: string) => string | undefined;
```

Callback untuk resolve URL model dari database eksternal. Diterima sebagai parameter opsional di fungsi load.

---

#### `resolveModelSource(modelName, resolveModelUrl?) → string | undefined`

```
1. extracted = extractModelNameFromId(modelName)
   (Parsing nama dari format ID — misalnya "product_chair_001" → "chair_001")

2. dbUrl = resolveModelUrl?.(extracted) ?? resolveModelUrl?.(modelName)
   Coba resolve dari DB: pertama dengan nama extracted, fallback ke modelName asli

3. Jika dbUrl ditemukan → return dbUrl

4. Jika modelName berekstensi .glb:
   → return "/assets/3d/" + modelName

5. Selainnya → return undefined (model tidak ditemukan)
```

---

### 2.2 `loadProductBaseModel(...)` — Load Model Utama

**Signature:**

```ts
loadProductBaseModel(
  modelName: string,
  activeTexture: string,
  scene: BABYLON.Scene,
  savedTransform?: FurnitureTransform,
  uniqueId?: string,
  resolveModelUrl?: DbModelUrlResolver
): Promise<AbstractMesh | null>
```

**Flow Lengkap:**

```
TRY:

1. updateRoomDimensions()
   → Sinkron CONFIG.rw & CONFIG.rd dari store

2. resolveModelSource(modelName, resolveModelUrl)
   → Dapat URL/path model
   Jika tidak ada → return null

3. BABYLON.LoadAssetContainerAsync(modelSource, scene)
   → Load GLB sebagai AssetContainer

4. container.addAllToScene()
   → Tambahkan semua mesh, material, animasi ke scene

5. CLEANUP LIGHTING:
   container.lights.forEach(l => l.dispose())
   container.cameras.forEach(c => c.dispose())
   → Hapus light & camera bawaan GLB (mencegah double lighting)

   scene.lights
     .filter(l => !allowedLightIds.includes(l.uniqueId))
     .forEach(l => l.dispose())
   → Safety net: hapus semua light yang bukan "allowed"

6. Ambil meshes[0] sebagai rootMesh
   → Jika tidak ada mesh → return null

7. NAMING:
   baseName = getBaseModelName(modelName)
   rootMesh.name = savedTransform?.modelName ?? uniqueId ?? `${baseName}_0`
   rootMesh.metadata = "furniture"

8. cacheOriginalMaterials(rootMesh)
   → Simpan material asli sebelum texture override

9. autoScaleMesh(rootMesh)
   → Fix unit mismatch, limit ke plafon

10. Set semua children:
    m.isPickable = true
    m.computeWorldMatrix(true)
    m.refreshBoundingInfo(true, true)

11. rootMesh.computeWorldMatrix(true)
    rootMesh.refreshBoundingInfo(true, true)

12. Hitung boundsInfo = getHierarchyBoundingVectors(true)
    Hitung box = getMeshAABB(rootMesh)
    (Console.log debug info: bounds min/max, width × depth, Y calculation)

13. CEK isValidHistory:
    savedTransform && !(pos.x===0 && pos.y===0 && pos.z===0)
    (Posisi (0,0,0) dianggap bukan history valid — model baru)

═══════════════════════════════════
CASE 1: isValidHistory = true (UNDO/REDO)
═══════════════════════════════════

  rootMesh.position.set(savedTransform.position.x/y/z)
  rootMesh.rotation.y = savedTransform.rotation
  Jika savedTransform.scale ada:
    rootMesh.scaling.set(scale.x/y/z)
  rootMesh.computeWorldMatrix(true)

═══════════════════════════════════
CASE 2: isValidHistory = false (MODEL BARU)
═══════════════════════════════════

  "Smart Snap" — Cari slot kosong di dinding:

  a. allFurniture = getAllFurniture(scene, rootMesh)

  b. Tentukan dimensi model:
     width = |bounds.max.x - bounds.min.x|
     depth = |bounds.max.z - bounds.min.z|

  c. wallsToTry = ["back", "right", "front", "left"]
     (Urutan prioritas penempatan)

  d. Konstanta:
     snapGap = 0.001
     wallPadding = 0.02
     MAX_CANDIDATES_PER_WALL = max(30, furniture.length × 6)
     MAX_COLLISION_CHECKS = max(500, furniture.length × MAX_CANDIDATES_PER_WALL)

  e. LOOP setiap wall:
     currentWall = wall
     isHorizontal = (wall === "back" || wall === "front")

     occupiesWallLength = width   (lebar furniture sepanjang tembok)
     protrudesIntoRoom  = depth   (kedalaman menonjol ke ruangan)

     wallLengthTotal = isHorizontal ? CONFIG.rw : CONFIG.rd
     limit = wallLengthTotal/2 - occupiesWallLength/2 - wallPadding

     GENERATE CANDIDATES:
       furnitureOnThisWall = filter furniture yang berada di wall ini
                             (toleransi posisi: 1.5 unit dari dinding)

       Untuk setiap furniture existing di wall:
         b = getHierarchyBoundingVectors(true)
         isHorizontal → scan X: minPoint = b.min.x, maxPoint = b.max.x
         isVertical   → scan Z: minPoint = b.min.z, maxPoint = b.max.z

         Push: minPoint - snapGap - occupiesWallLength/2  (sisi kiri furniture)
         Push: maxPoint + snapGap + occupiesWallLength/2  (sisi kanan furniture)

       Tambah candidates tepi: -limit, +limit
       Tambah 0 untuk back wall (tengah)

       Filter: hanya kandidat dalam range [-limit-0.01, limit+0.01]
       Deduplicate + rounding ke 3 desimal

       SORTING (agar flow penempatan konsisten):
         back  → abs ascending (tengah ke luar)
         right → descending (dari +Z ke -Z, nyambung dari back)
         front → descending (dari +X ke -X, nyambung dari right)
         left  → ascending (dari -Z ke +Z, nyambung dari front)

       Trim ke MAX_CANDIDATES_PER_WALL

     CEK COLLISION setiap kandidat:
       Buat test AABB:
         isHorizontal:
           centerX = pos (kandidat)
           centerZ = ±rd/2 ∓ protrudesIntoRoom/2 (sesuai wall)
           testMinX/MaxX/MinZ/MaxZ dengan buffer 0.002

         isVertical:
           centerZ = pos (kandidat)
           centerX = ±rw/2 ∓ protrudesIntoRoom/2 (sesuai wall)
           testMinX/MaxX/MinZ/MaxZ dengan buffer 0.002

       Loop semua furniture:
         Jika test AABB overlap dengan furniture.bounds → collision = true
         Jika collisionChecks > MAX_COLLISION_CHECKS → break (safety)

       Jika tidak collision:
         Hitung finalX, finalZ, finalRot sesuai wall
         Set finalPosition → break dari candidates loop

     Jika finalPosition ditemukan → break dari walls loop

  f. Jika finalPosition tidak ditemukan:
     console.warn("⛔ Room is full!")
     window.alert("Ruangan penuh!")
     rootMesh.dispose()
     return null

  g. yPosition = FLOOR_Y - boundsInfo.min.y
     (Angkat mesh agar bagian bawahnya tepat di lantai)

  h. rootMesh.rotationQuaternion = null
     rootMesh.position.set(finalPosition.x, yPosition, finalPosition.z)
     rootMesh.rotation.y = finalPosition.rotation
     rootMesh.computeWorldMatrix(true)

  i. updateTransformSilent(productBaseIndex, initialTransform, true)
     (Simpan transform ke store tanpa undo history)

14. addDragBehavior(rootMesh, scene)
    → Tambahkan sistem drag interaktif

15. return rootMesh

CATCH:
  console.error → return null
```

---

### 2.3 `loadAdditionalModel(...)` — Load Model Tambahan (Component)

**Signature:**

```ts
loadAdditionalModel(
  modelName: string,
  activeTexture: string,
  scene: BABYLON.Scene,
  mainMeshRef: AbstractMesh | null,
  savedTransform?: FurnitureTransform,
  resolveModelUrl?: DbModelUrlResolver
): Promise<void>
```

**Perbedaan vs `loadProductBaseModel`:**

| Aspek                | loadProductBaseModel             | loadAdditionalModel      |
| -------------------- | -------------------------------- | ------------------------ |
| Return               | `AbstractMesh \| null`           | `void`                   |
| uniqueId             | Dari parameter atau `baseName_0` | Auto-counter dari store  |
| Store target         | `productBaseModels`              | `productComponentModels` |
| `isProductBase` flag | `true`                           | `false`                  |
| Placement flow       | Identik (Smart Snap)             | Identik (Smart Snap)     |

**Auto-Generate uniqueId untuk Additional Model:**

```
baseName = getBaseModelName(modelName)
count = productComponentModels.filter(id => {
  parsed = id.split("_")
  Jika bagian terakhir adalah angka:
    return parsed.slice(0,-1).join("_") === baseName
}).length

uniqueId = `${baseName}_${count + 1}`
```

Misalnya: model "chair.glb" yang sudah ada `chair_1`, `chair_2` → uniqueId = `chair_3`

**Flow selanjutnya identik dengan `loadProductBaseModel`**, termasuk:

- Load + cleanup GLB
- cacheOriginalMaterials
- autoScaleMesh
- isValidHistory check
- Smart Snap algorithm (sama persis)
- addDragBehavior

> ⚠️ **Bug kecil:** `addDragBehavior(rootMesh, scene)` dipanggil **dua kali** — sekali di dalam blok `else` (new model), dan sekali lagi di akhir fungsi di luar blok `if/else`. Behavior drag akan terduplikasi untuk model baru.

---

### 2.4 `updateAllTextures(scene, mainMeshes, meshTextureMap?)`

**Tujuan:** Terapkan texture ke semua furniture mesh berdasarkan peta `meshName → textureName`.

**Flow:**

```
1. Jika meshTextureMap kosong atau undefined:
   → return (tidak ada yang diubah)

2. Definisikan getTextureForMesh(meshName):
   → return meshTextureMap[meshName] jika ada (exact match only)
   Hanya exact match untuk mencegah texture satu instance mempengaruhi instance lain.

3. Loop setiap mainMesh di mainMeshes:
   mainTex = getTextureForMesh(mainMesh.name)
   Jika undefined → skip (return early)

   applyTextureToMesh(mainMesh, mainTex, scene)

   Loop setiap child mesh:
     childTex = getTextureForMesh(child.name) ?? mainTex
     (Child punya texture sendiri, fallback ke parent texture)
     applyTextureToMesh(child, childTex, scene)

4. Loop semua scene.meshes:
   Jika mesh.metadata === "furniture"
   DAN tidak ada di mainMeshes
   DAN parent-nya tidak ada di mainMeshes:
     tex = getTextureForMesh(mesh.name)
     Jika undefined → skip
     applyTextureToMesh(mesh, tex, scene)
     Loop children: childTex = getTextureForMesh(child.name) ?? tex
```

---

## 🔄 End-to-End Flow: Penambahan Furniture Baru

```
User klik "Tambah Furniture"
         │
         ▼
loadProductBaseModel() atau loadAdditionalModel()
         │
         ├── updateRoomDimensions()         [Sinkron CONFIG dari store]
         │
         ├── resolveModelSource()           [Resolve URL/path GLB]
         │
         ├── LoadAssetContainerAsync()      [Load file GLB async]
         │         │
         │         └── container.addAllToScene()
         │             + dispose lights/cameras
         │
         ├── Set rootMesh.name & .metadata  [Tag sebagai "furniture"]
         │
         ├── cacheOriginalMaterials()       [Backup material asli]
         │
         ├── autoScaleMesh()               [Fix unit, limit plafon]
         │
         ├── computeWorldMatrix()           [Update bounds]
         │
         ├── isValidHistory?
         │      │
         │      ├── YES → Restore posisi/rotasi/scale dari savedTransform
         │      │
         │      └── NO  → Smart Snap Algorithm
         │                    Loop walls: back → right → front → left
         │                    Generate candidates dari furniture existing
         │                    Sort candidates (center-out / directional flow)
         │                    AABB collision test setiap kandidat
         │                    Pilih kandidat pertama yang clear
         │                    Set posisi + rotasi + simpan ke store
         │
         ├── addDragBehavior()              [Attach drag system]
         │
         └── return rootMesh
```

---

## 🔄 End-to-End Flow: Drag Furniture

```
User MOUSEDOWN di furniture
         │
         ▼
onDragStartObservable
  ├── Hitung drag plane di tengah furniture
  ├── Highlight amber
  ├── Backup posisi valid
  ├── captureCurrentState() (undo snapshot)
  └── Detect current wall

         │ (mouse move)
         ▼
onDragObservable (setiap frame)
  ├── Smooth pointer position (DRAG_SENSITIVITY + DRAG_MAX_STEP)
  ├── Hitung nearest wall
  ├── Hysteresis: ubah wall hanya jika "niat banget"
  ├── Simulasi: set rotasi + snap position
  ├── AABB collision check
  └── Jika collision → rollback; jika clean → update valid backup

         │ (mouse up)
         ▼
onDragEndObservable
  ├── Final collision check
  ├── Jika collision → rollback ke valid backup
  └── Jika clean → saveTransformToHistory() (Zustand dengan undo)
```

---

## 📌 Catatan Penting & Gotchas

| #   | Poin                         | Detail                                                                                                                                                   |
| --- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Order worldMatrix update** | Selalu `computeWorldMatrix` → `refreshBoundingInfo` → `getHierarchyBoundingVectors` secara berurutan. Melewati salah satu step menyebabkan bounds stale. |
| 2   | **WALL_OFFSET = 0**          | Konstanta di `getWallSnapPosition` yang mengatur jarak furniture dari dinding. Saat ini 0 (menempel).                                                    |
| 3   | **Hysteresis drag**          | `HYSTERESIS = 1.5` mencegah wall switching yang tidak sengaja. User harus mendekati dinding baru hingga `threshold/1.5` untuk pindah wall.               |
| 4   | **Material cache key**       | Include `uScale` dan `vScale` dalam key agar mesh yang di-scale berbeda tidak berbagi material yang sama.                                                |
| 5   | **DRAG_SENSITIVITY**         | `0.3` berarti furniture bergerak 30% dari gerakan pointer mentah. Nilai lebih kecil = lebih halus tapi terasa lambat.                                    |
| 6   | **Smart Snap sorting**       | Back wall: center-out. Right/Front/Left: directional agar placement berasa "mengalir" mengelilingi ruangan.                                              |
| 7   | **addDragBehavior dua kali** | Di `loadAdditionalModel`, drag behavior dipanggil dua kali untuk model baru (sekali di dalam `else`, sekali di akhir fungsi).                            |
| 8   | **allowedLightIds**          | Scene menyimpan list ID light yang boleh ada. Saat load GLB, semua light yang bukan di list ini langsung di-dispose.                                     |
| 9   | **isValidHistory check**     | Posisi `(0,0,0)` dianggap bukan history valid karena merupakan default position BabylonJS, bukan posisi tersimpan yang bermakna.                         |
| 10  | **fixedDims parameter**      | `getWallSnapPosition` mendukung dimensi pre-computed (`fixedDims`) untuk performa drag. Tanpa ini, bounds harus dihitung ulang setiap frame.             |
