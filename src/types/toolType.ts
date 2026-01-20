export type ToolType =
  | "paint"
  | "lighting"
  | "grid"
  | "furniture"
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
