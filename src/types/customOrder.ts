import { ProductMaterial } from "./materialProduct";

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
  country?: string | null;
  postalCode?: string | null;
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
  snapShotAddress?: SnapshotAddress | null;
  status: OrderStatus;

  subtotalPrice?: number | null;
  deliveryType: DeliveryType;
  deliveryDistance?: number | null;
  deliveryDistancce?: number | null;
  deliveryFee?: number | null;
  trackNumber?: string | null;
  totalWeight?: number | null;

  grandTotalPrice: number;

  items: CustomOrderItem[];

  addressId?: number | null;
  notes?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "IN_PRODUCTION"
  | "READY_TO_SHIP"
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
