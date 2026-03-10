import { type StatusTone } from "@/lib/statusStyles";
import { cn } from "@/lib/utils";
import { type OrderStatus } from "@/types/customOrder";

type OrderStatusMeta = {
  label: string;
  tone: StatusTone;
  badgeClassName: string;
  pillClassName: string;
  dotClassName: string;
};

const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  PENDING_PAYMENT: {
    label: "Waiting Payment",
    tone: "warning",
    badgeClassName:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
    pillClassName:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300",
    dotClassName: "bg-amber-500 dark:bg-amber-300",
  },
  AWAITING_PRODUCTION: {
    label: "Awaiting Production",
    tone: "warning",
    badgeClassName:
      "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
    pillClassName:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-300",
    dotClassName: "bg-orange-500 dark:bg-orange-300",
  },
  IN_PRODUCTION: {
    label: "In Production",
    tone: "info",
    badgeClassName:
      "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
    pillClassName:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300",
    dotClassName: "bg-blue-500 dark:bg-blue-300",
  },
  READY_TO_SHIP: {
    label: "Ready to Ship",
    tone: "info",
    badgeClassName:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300",
    pillClassName:
      "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300",
    dotClassName: "bg-indigo-500 dark:bg-indigo-300",
  },
  SHIPPED: {
    label: "Shipped",
    tone: "info",
    badgeClassName:
      "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
    pillClassName:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300",
    dotClassName: "bg-violet-500 dark:bg-violet-300",
  },
  COMPLETED: {
    label: "Completed",
    tone: "success",
    badgeClassName:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
    pillClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300",
    dotClassName: "bg-emerald-500 dark:bg-emerald-300",
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "danger",
    badgeClassName:
      "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300",
    pillClassName:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300",
    dotClassName: "bg-red-500 dark:bg-red-300",
  },
};

export const getOrderStatusConfig = (status: OrderStatus) =>
  ORDER_STATUS_META[status];

export const getOrderStatusLabel = (status: OrderStatus) =>
  ORDER_STATUS_META[status].label;

export const getOrderStatusBadgeClass = (status: OrderStatus) =>
  cn(
    "rounded-full px-2.5 py-1 text-xs font-medium",
    ORDER_STATUS_META[status].badgeClassName,
  );

export const getOrderStatusPillClass = (status: OrderStatus) =>
  cn(
    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
    ORDER_STATUS_META[status].pillClassName,
  );

export const getOrderStatusDotClass = (status: OrderStatus) =>
  cn("h-1.5 w-1.5 rounded-full", ORDER_STATUS_META[status].dotClassName);
