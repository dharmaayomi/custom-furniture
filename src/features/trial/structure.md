└── trial/
├── core/ # Fondasi Scene & Engine
│ ├── Config.ts # Konstanta & Tipe Data
│ ├── Scene.ts # Inisialisasi Engine & Camera
│ ├── Room.ts # Inisialisasi Room Geometry
│ └── Lighting.ts # Setup Lighting & Shadows
│
├── store/ # State Management (Zustand)
│ ├── slices/
│ │ ├── furnitureSlice.ts # Data posisi & OBB
│ │ ├── selectionSlice.ts # State barang terpilih
│ │ ├── spawnSlice.ts # Antrean spawn barang[cite: 8, 9]
│ │ └── historySlice.ts # Undo/Redo stack[cite: 8, 9]
│ └── useTrialStore.ts # Main Store (Merger Slices)[cite: 9]
│
├── systems/ # Logika Mandiri (Pure TS/Babylon)
│ ├── CollisionSystem.ts # Cek overlap AABB
│ ├── WallSnapSystem.ts # Kalkulasi tempel dinding
│ ├── SelectionManager.ts # Kelola Outline[cite: 8]
│ └── SpawnListener.ts # Penghubung Store & Loader[cite: 8]
│
├── furniture/ # Pengelolaan Model 3D
│ ├── TrialModelLoader.ts # Loader GLB & Setup Mesh[cite: 1, 8]
│ ├── TrialModelUtils.ts # Kalkulasi OBB & Matrix[cite: 8, 11]
│ └── behaviors/
│ ├── FrameDrag.ts # Drag khusus lemari[cite: 3, 5]
│ └── InteriorDrag.ts # Drag khusus aksesoris[cite: 3, 5]
│
└── TrialRoomCanvas.tsx # React Entry Point (Hanya Canvas)[cite: 8]
