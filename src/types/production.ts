export interface ProductionProgress {
  id: string;
  orderId: string;
  percentage: number;
  photoUrls: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionBillingSummary {
  dpAmount: number;
  targetCumulative: number;
  totalPaid: number;
  remainingToBill: number;
}

export interface ProductionPaymentCreated {
  id: string;
  phase: string;
  amount: number;
  status: string;
  paymentUrl?: string | null;
  token?: string;
  expiresAt?: string | Date | null;
}

export interface CreateProductionProgressResponse {
  progress: ProductionProgress;
  paymentCreated: ProductionPaymentCreated | null;
  billing: ProductionBillingSummary;
}
