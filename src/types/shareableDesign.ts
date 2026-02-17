export type ShareableDesign = {
  id: number;
  designCode: string;
  configHash: string;
  configuration: unknown;
  expiresAt?: string | null;
  createdAt: string;
};

export type SavedDesign = {
  id: number;
  userId: number;
  designCode: string;
  designName: string;
  configuration: any;
  fileFinalUrl?: string;
  previewUrl?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
};
