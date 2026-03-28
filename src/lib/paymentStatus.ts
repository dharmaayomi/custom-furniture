import { cn } from "@/lib/utils";
import { type PaymentStatus } from "@/types/customOrder";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  type LucideIcon,
  XCircle,
} from "lucide-react";

type PaymentStatusMeta = {
  label: string;
  badgeClassName: string;
  icon: LucideIcon;
};

const PAYMENT_STATUS_META: Record<PaymentStatus, PaymentStatusMeta> = {
  WAITING_FOR_PAYMENT: {
    label: "Waiting Payment",
    icon: Clock,
    badgeClassName:
      "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40",
  },
  PAID: {
    label: "Paid",
    icon: CheckCircle2,
    badgeClassName:
      "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40",
  },
  CHALLENGE: {
    label: "Challenge",
    icon: AlertCircle,
    badgeClassName:
      "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40",
  },
  DENIED: {
    label: "Denied",
    icon: AlertCircle,
    badgeClassName:
      "bg-rose-50 text-rose-500 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40",
  },
  EXPIRED: {
    label: "Expired",
    icon: XCircle,
    badgeClassName:
      "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    badgeClassName:
      "bg-rose-50 text-rose-500 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40",
  },
  FAILED: {
    label: "Failed",
    icon: AlertCircle,
    badgeClassName:
      "bg-rose-50 text-rose-500 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40",
  },
};

const FALLBACK_PAYMENT_STATUS_META: PaymentStatusMeta = {
  label: "Unknown",
  icon: AlertCircle,
  badgeClassName:
    "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800",
};

const isPaymentStatus = (status: string): status is PaymentStatus =>
  status in PAYMENT_STATUS_META;

export const getPaymentStatusConfig = (status?: string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  if (isPaymentStatus(normalized)) {
    return PAYMENT_STATUS_META[normalized];
  }
  return FALLBACK_PAYMENT_STATUS_META;
};

export const getPaymentStatusLabel = (status?: string | null) =>
  getPaymentStatusConfig(status).label;

export const getPaymentStatusIcon = (status?: string | null) =>
  getPaymentStatusConfig(status).icon;

export const getPaymentStatusBadgeClass = (status?: string | null) =>
  cn(
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
    getPaymentStatusConfig(status).badgeClassName,
  );
