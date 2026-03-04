export interface SummaryOrderItem {
  id: string;
  name: string;
  sku: string;
  image?: string;
  materialId?: string;
  materialName?: string;
  materialSku?: string;
  materialUrl?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface SummaryOrderPayload {
  items: SummaryOrderItem[];
  subtotal: number;
  totalItems: number;
  currency: "IDR";
  previewImage?: string;
  previewUrl?: string;
  designCode?: string;
  configuration?: Record<string, unknown>;
  generatedAt: string;
}
