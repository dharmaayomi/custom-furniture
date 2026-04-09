import { DeliveryType } from "@/types/customOrder";

export const getDeliveryTypeLabel = (
  value: DeliveryType | null | undefined,
): string => {
  switch (value) {
    case "PICKUP":
      return "Pickup";
    case "STORE_DELIVERY":
      return "Store Delivery";
    case "DELIVERY":
    default:
      return "Delivery";
  }
};

export const deliveryTypeUsesAddress = (
  value: DeliveryType | null | undefined,
): boolean => value !== "PICKUP";

export const formatDeliveryDistance = (
  deliveryType: DeliveryType | null | undefined,
  distance: number | null | undefined,
): string => {
  if (deliveryType === "PICKUP") return "-";
  if (distance === null || distance === undefined || Number.isNaN(distance)) {
    return "-";
  }
  return `${distance} km`;
};
