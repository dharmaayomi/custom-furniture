import { OrderStatus, PaymentPhase, PaymentStatus } from "./customOrder";

export interface PaymentAttemptOrderSummary {
  id: string;
  orderNumber?: string | null;
  status: OrderStatus;
  grandTotalPrice: number;
}

export interface PaymentAttemptPaymentSummary {
  id: string;
  orderId: string;
  phase: PaymentPhase;
  amount: number;
  status: PaymentStatus | string;
  order?: PaymentAttemptOrderSummary | null;
}

export interface PaymentAttempt {
  id: string;
  paymentId: string;
  midtransOrderId?: string | null;
  progressPercentageSnapshot?: number | null;
  status: PaymentStatus | string;
  paymentUrl?: string | null;
  paymentType?: string | null;
  midtransPaymentType?: string | null;
  midtransBank?: string | null;
  midtransReference?: string | null;
  rawResponse?: unknown;
  paidAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  payment?: PaymentAttemptPaymentSummary | null;
}
