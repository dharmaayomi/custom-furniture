import { DeliveryType, OrderStatus } from "@/types/customOrder";
import { SummaryOrderItem } from "@/types/summary";

export interface CheckoutOrderSnapshot {
  orderId: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  items: SummaryOrderItem[];
  previewImage?: string;
  createdAt: string;
}

export const CHECKOUT_STORAGE_KEY = "custom-checkout-order";

export const saveCheckoutSnapshot = (payload: CheckoutOrderSnapshot) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(payload));
};

export const loadCheckoutSnapshot = (): CheckoutOrderSnapshot | null => {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CheckoutOrderSnapshot;
  } catch {
    return null;
  }
};
