import { ProductMaterial } from "./materialProduct";
import { ProductBase } from "./product";

export interface SnapshotAddress {
  label?: string | null;
  recipientName?: string | null;
  phoneNumber?: string | null;
  line1?: string | null;
  line2?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  city?: string | null;
  province?: string | null;
  provinceCode?: string | null;
  cityCode?: string | null;
  jneCityCode?: string | null;
  districtCode?: string | null;
  subdistrictCode?: string | null;
  komerceSubdistrictId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  country?: string | null;
  postalCode?: string | null;
  type?: string | null;
  note?: string | null;
}

export interface DesignSnapshot {
  previewImage?: string;
  previewUrl?: string;
  [key: string]: unknown;
}

export interface CustomOrder {
  id: string;
  orderNumber?: string | null;
  userId: number;
  userDesignId?: number | null;
  designSnapShot?: DesignSnapshot | null;
  previewUrl?: string | null;
  snapShotAddress?: SnapshotAddress | null;
  status: OrderStatus;
  currentPaymentPhase?: PaymentPhase | null;
  currentPaymentStatus?: PaymentStatus | null;

  subtotalPrice?: number | null;
  deliveryType: DeliveryType;
  deliveryDistance?: number | null;
  deliveryDistancce?: number | null;
  deliveryFee?: number | null;
  trackNumber?: string | null;
  totalWeight?: number | null;

  grandTotalPrice: number;

  items: CustomOrderItem[];
  payments?: CustomOrderPayment[];
  user?: CustomOrderUser | null;

  addressId?: number | null;
  notes?: string | null;
  totalPaid?: number | null;
  remaining?: number | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "AWAITING_PRODUCTION"
  | "IN_PRODUCTION"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

export type DeliveryType = "DELIVERY" | "PICKUP" | "STORE_DELIVERY";

export type PaymentPhase = "DP" | "PROGRESS_1" | "PROGRESS_2" | "FINAL";

export type PaymentStatus =
  | "WAITING_FOR_PAYMENT"
  | "PAID"
  | "CHALLENGE"
  | "DENIED"
  | "EXPIRED"
  | "CANCELLED"
  | "FAILED";

export interface CustomOrderItem {
  id: string;
  customOrderId: string;
  productBaseId: string;
  materialId?: string | null;
  material?: ProductMaterial | null;
  productBase?: ProductBase | null;

  lockedBasePrice: number;
  lockedMaterialPrice: number;
  itemTotalPrice: number;

  components: CustomOrderComponent[];
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomOrderUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CustomOrderPayment {
  id: string;
  orderId?: string;
  phase: PaymentPhase;
  status: PaymentStatus;
  amount: number;
  paymentType?: string | null;
  midtransPaymentType?: string | null;
  midtransBank?: string | null;
  midtransReference?: string | null;
  paymentUrl?: string | null;
  paidAt?: string | null;
  expiresAt?: string | null;
  order?: {
    id: string;
    orderNumber?: string | null;
    status: OrderStatus;
    grandTotalPrice: number;
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CustomOrderComponent {
  id: string;
  customOrderItemId: string;
  componentId: string;
  quantity: number;
  lockedPricePerUnit: number;
  lockedSubTotal: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
