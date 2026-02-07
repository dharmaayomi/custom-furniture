export type SharableDesign = {
  id: number;
  designCode: String;
  configHash: String;
  configuration: JSON;
  expiresAt: Date;
  createdAt: Date;
};
