import { ProductMaterial } from "./materialProduct";

export interface CustomOrder {
  id: string;
  userId: number;
  userDesignId: number;
  snapShotAddress: unknown;
  status: OrderStatus;

  subtotalPrice?: number | null;
  deliveryType: DeliveryType;
  deliveryDistancce?: number | null;
  deliveryFee?: number | null;
  trackNumber?: string | null;
  totalWeight?: number | null;

  grandTotalPrice: number;

  items: CustomOrderItem[];

  addressId?: number | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

export type DeliveryType = "DELIVERY" | "PICKUP";

export interface CustomOrderItem {
  id: string;
  customOrderId: string;
  productBaseId: string;
  materialId?: string | null;
  material?: ProductMaterial | null;

  lockedBasePrice: number;
  lockedMaterialPrice: number;
  itemTotalPrice: number;

  components: CustomOrderComponent[];
  deletedAt?: string | null;
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
