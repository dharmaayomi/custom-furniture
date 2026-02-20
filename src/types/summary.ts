export interface SummaryOrderItem {
  id: string;
  name: string;
  sku: string;
  image?: string;
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
  generatedAt: string;
}
