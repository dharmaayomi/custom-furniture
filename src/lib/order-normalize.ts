import { CustomOrder } from "@/types/customOrder";

const toNumberOrNull = (value: unknown): number | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

export const normalizeCustomOrder = (order: CustomOrder): CustomOrder => {
  const raw = order as CustomOrder & {
    totalAmountPaid?: unknown;
    remainingAmount?: unknown;
    totalPaid?: unknown;
    remaining?: unknown;
  };

  const totalPaidValue =
    toNumberOrNull(raw.totalPaid) ?? toNumberOrNull(raw.totalAmountPaid);
  const remainingValue =
    toNumberOrNull(raw.remaining) ?? toNumberOrNull(raw.remainingAmount);

  return {
    ...order,
    ...(totalPaidValue !== undefined ? { totalPaid: totalPaidValue } : {}),
    ...(remainingValue !== undefined ? { remaining: remainingValue } : {}),
  };
};

export const normalizeCustomOrderList = (orders: CustomOrder[]): CustomOrder[] =>
  orders.map(normalizeCustomOrder);
