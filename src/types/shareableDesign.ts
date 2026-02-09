export type ShareableDesign = {
  id: number;
  designCode: string;
  configHash: string;
  configuration: unknown;
  expiresAt?: string | null;
  createdAt: string;
};
