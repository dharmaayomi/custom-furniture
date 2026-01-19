export type ToolType =
  | "paint"
  | "lighting"
  | "grid"
  | "bed"
  | "tambahan"
  | "chair"
  | "door"
  | null;

export interface Tool {
  id: ToolType;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  category: string;
}
