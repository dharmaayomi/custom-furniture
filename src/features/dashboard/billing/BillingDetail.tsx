"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Stepper } from "@/components/ui/stepper";
import {
  PaymentInstruction,
  PaymentInstructionValue,
} from "@/features/dashboard/billing/components/PaymentInstruction";
import useCreateSnapPayment from "@/hooks/api/payment/useCreateSnapPayment";
import useGetAttemptDetail from "@/hooks/api/payment/useGetAttemptDetail";
import useGetOrder from "@/hooks/api/order/useGetOrder";
import { getApiErrorMessage } from "@/lib/api-error";
import { PaymentInstructionMethod } from "@/lib/bankInstruction";
import { formatPrice } from "@/lib/price";
import {
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
} from "@/lib/orderStatus";
import {
  getPaymentStatusBadgeClass,
  getPaymentStatusIcon,
  getPaymentStatusLabel,
} from "@/lib/paymentStatus";
import {
  CustomOrderPayment,
  OrderStatus,
  PaymentPhase,
  PaymentStatus,
} from "@/types/customOrder";
import { PaymentAttempt } from "@/types/payment";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const useGetPaymentAttemptByPayment = useGetAttemptDetail;

export type StepState = "completed" | "current" | "upcoming";

export type PhaseStep = {
  phase: PaymentPhase;
  label: string;
  amount: number;
  state: StepState;
};

export const PHASE_LABEL: Record<PaymentPhase, string> = {
  DP: "DP",
  PROGRESS_1: "Termin 1",
  PROGRESS_2: "Termin 2",
  FINAL: "Pelunasan",
};

export const phaseOrder: PaymentPhase[] = [
  "DP",
  "PROGRESS_1",
  "PROGRESS_2",
  "FINAL",
];

const isRetryActivePaymentStatus = (status?: string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  return (
    normalized === "WAITING_FOR_PAYMENT" ||
    normalized === "CHALLENGE" ||
    normalized === "EXPIRED"
  );
};

const isLivePendingPaymentStatus = (status?: string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  return normalized === "WAITING_FOR_PAYMENT" || normalized === "CHALLENGE";
};

export const inferPhaseFromStatus = (status: OrderStatus): PaymentPhase => {
  if (status === "PENDING_PAYMENT") return "DP";
  if (status === "AWAITING_PRODUCTION") return "PROGRESS_1";
  if (status === "IN_PRODUCTION") return "PROGRESS_1";
  if (status === "READY_TO_SHIP") return "PROGRESS_2";
  return "FINAL";
};

export const getDefaultPhaseAmounts = (totalPrice: number) => {
  const normalizedTotal = Math.max(0, Math.ceil(totalPrice));
  const quarter = Math.floor(normalizedTotal / 4);
  const finalPortion = normalizedTotal - quarter * 3;

  return {
    DP: quarter,
    PROGRESS_1: quarter,
    PROGRESS_2: quarter,
    FINAL: finalPortion,
  } satisfies Record<PaymentPhase, number>;
};

export const buildPhaseSteps = (params: {
  amountsByPhase: Record<PaymentPhase, number>;
  paidPhaseSet: Set<PaymentPhase>;
  currentPhase: PaymentPhase;
  allPaymentsDone: boolean;
}): PhaseStep[] => {
  return phaseOrder.map((phase) => {
    let state: StepState = "upcoming";

    if (params.allPaymentsDone || params.paidPhaseSet.has(phase)) {
      state = "completed";
    } else if (phase === params.currentPhase) {
      state = "current";
    }

    return {
      phase,
      label: PHASE_LABEL[phase],
      amount: params.amountsByPhase[phase],
      state,
    };
  });
};

type CorePaymentMethod =
  | "qris"
  | "gopay"
  | "bca_va"
  | "bni_va"
  | "bri_va"
  | "mandiri_bill"
  | "permata_va"
  | "cimb_va";

const corePaymentMethodLabel: Record<CorePaymentMethod, string> = {
  qris: "QRIS",
  gopay: "GoPay",
  bca_va: "Virtual Account BCA",
  bni_va: "Virtual Account BNI",
  bri_va: "Virtual Account BRI",
  mandiri_bill: "Pembayaran Mandiri Bill",
  permata_va: "Virtual Account Permata",
  cimb_va: "Virtual Account CIMB",
};

const buildCorePayload = (method: CorePaymentMethod) => {
  switch (method) {
    case "gopay":
      return { payment_type: "gopay" };
    case "qris":
      return { payment_type: "qris" };
    case "permata_va":
      return {
        payment_type: "bank_transfer",
        bank_transfer: { bank: "permata" },
      };
    case "mandiri_bill":
      return {
        payment_type: "echannel",
        echannel: {
          bill_info1: "Payment:",
          bill_info2: "Order",
        },
      };
    case "cimb_va":
      return {
        payment_type: "bank_transfer",
        bank_transfer: { bank: "cimb" },
      };
    case "bca_va":
      return {
        payment_type: "bank_transfer",
        bank_transfer: { bank: "bca" },
      };
    case "bni_va":
      return {
        payment_type: "bank_transfer",
        bank_transfer: { bank: "bni" },
      };
    case "bri_va":
      return {
        payment_type: "bank_transfer",
        bank_transfer: { bank: "bri" },
      };
    default:
      return { payment_type: "qris" };
  }
};

const inferInstructionMethodFromPayment = (
  payment?: Pick<
    CustomOrderPayment,
    "paymentType" | "midtransPaymentType" | "midtransBank"
  > | null,
): PaymentInstructionMethod => {
  const bank = String(payment?.midtransBank ?? "").toLowerCase();
  if (bank === "bca") return "bca_va";
  if (bank === "bni") return "bni_va";
  if (bank === "bri") return "bri_va";
  if (bank === "permata") return "permata_va";
  if (bank === "cimb") return "cimb_va";
  if (bank === "mandiri") return "mandiri_bill";

  const midtransType = String(payment?.midtransPaymentType ?? "").toLowerCase();
  if (midtransType === "qris") return "qris";
  if (midtransType === "gopay") return "gopay";
  if (midtransType === "echannel") return "mandiri_bill";

  const paymentType = String(payment?.paymentType ?? "").toLowerCase();
  if (paymentType.includes("qris")) return "qris";
  if (paymentType.includes("gopay")) return "gopay";
  if (paymentType.includes("echannel")) return "mandiri_bill";

  return "qris";
};

const PAYMENT_FALLBACK: Record<
  string,
  { label: string; color: string; bg: string; iconPath?: string }
> = {
  qris: {
    label: "QRIS",
    color: "#E31937",
    bg: "#fff0f0",
    iconPath: "/assets/payment-icons/qris.png",
  },
  gopay: {
    label: "GP",
    color: "#00AED6",
    bg: "#f0faff",
    iconPath: "/assets/payment-icons/gopay.png",
  },
  bca_va: {
    label: "BCA",
    color: "#003F88",
    bg: "#f0f4ff",
    iconPath: "/assets/payment-icons/bca.svg",
  },
  bni_va: {
    label: "BNI",
    color: "#FF6600",
    bg: "#fff5f0",
    iconPath: "/assets/payment-icons/bni.png",
  },
  bri_va: {
    label: "BRI",
    color: "#003087",
    bg: "#f0f3ff",
    iconPath: "/assets/payment-icons/bri.svg",
  },
  permata_va: {
    label: "PRM",
    color: "#B0181B",
    bg: "#fff0f0",
    iconPath: "/assets/payment-icons/permata.png",
  },
  mandiri_bill: {
    label: "MDR",
    color: "#c89300",
    bg: "#fffbf0",
    iconPath: "/assets/payment-icons/mandiri.webp",
  },
  cimb_va: {
    label: "CMB",
    color: "#CC0000",
    bg: "#fff0f0",
    iconPath: "/assets/payment-icons/cimb.png",
  },
  bank_transfer: { label: "VA", color: "#0063A8", bg: "#f0f7ff" },
  echannel: {
    label: "MDR",
    color: "#c89300",
    bg: "#fffbf0",
    iconPath: "/assets/payment-icons/mandiri.webp",
  },
};

export const PAYMENT_PHASE_LABEL: Record<PaymentPhase, string> = {
  DP: "Uang Muka",
  PROGRESS_1: "Termin 1",
  PROGRESS_2: "Termin 2",
  FINAL: "Pelunasan",
};

const ORDER_STATUS_LABEL_ID: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Menunggu Pembayaran",
  AWAITING_PRODUCTION: "Menunggu Produksi",
  IN_PRODUCTION: "Dalam Produksi",
  READY_TO_SHIP: "Siap Dikirim",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const getPaymentStatusLabelId = (status?: string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized === "WAITING_FOR_PAYMENT") return "Menunggu Pembayaran";
  if (normalized === "CHALLENGE") return "Perlu Verifikasi";
  if (normalized === "EXPIRED") return "Kedaluwarsa";
  if (normalized === "PAID") return "Lunas";
  if (normalized === "CANCELLED") return "Dibatalkan";
  if (normalized === "DENIED") return "Ditolak";
  if (normalized === "FAILED") return "Gagal";
  return getPaymentStatusLabel(normalized);
};

const getPaymentLogoKey = (payment: CustomOrderPayment) => {
  const bank = String(payment.midtransBank ?? "").toLowerCase();
  if (bank === "bca") return "bca_va";
  if (bank === "bni") return "bni_va";
  if (bank === "bri") return "bri_va";
  if (bank === "permata") return "permata_va";
  if (bank === "cimb") return "cimb_va";

  const midtransType = String(payment.midtransPaymentType ?? "").toLowerCase();
  if (midtransType === "qris") return "qris";
  if (midtransType === "gopay") return "gopay";
  if (midtransType === "echannel") return "mandiri_bill";

  const paymentType = String(payment.paymentType ?? "").toLowerCase();
  if (paymentType === "qris") return "qris";
  if (paymentType === "gopay") return "gopay";
  if (paymentType === "echannel") return "mandiri_bill";
  return paymentType || "bank_transfer";
};

const formatPaymentDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

type ParsedPaymentReference = {
  va_numbers?: Array<{ va_number?: string; bank?: string }>;
  permata_va_number?: string;
  bill_key?: string;
  biller_code?: string;
  qr_string?: string;
};

const parsePaymentReference = (value?: string | null) => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as ParsedPaymentReference;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

const buildInstructionFromPayment = (
  payment: CustomOrderPayment,
): PaymentInstructionValue | null => {
  const parsedReference = parsePaymentReference(payment.midtransReference);
  const vaNumbers = Array.isArray(parsedReference?.va_numbers)
    ? parsedReference.va_numbers
        .filter((item) => item?.va_number)
        .map((item) => ({
          bank: String(item.bank ?? payment.midtransBank ?? "bank"),
          va_number: String(item.va_number),
        }))
    : [];

  const next: PaymentInstructionValue = {
    method: inferInstructionMethodFromPayment(payment),
    vaNumbers,
    permataVaNumber: parsedReference?.permata_va_number ?? null,
    qrString: parsedReference?.qr_string ?? null,
    billerCode: parsedReference?.biller_code ?? null,
    billKey: parsedReference?.bill_key ?? null,
  };

  const hasInstruction =
    next.vaNumbers.length > 0 ||
    Boolean(next.permataVaNumber) ||
    Boolean(next.qrString) ||
    Boolean(next.billKey) ||
    Boolean(next.billerCode);

  return hasInstruction ? next : null;
};

const copyToClipboard = async (value: string, label: string) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Failed to copy ${label}`);
  }
};

const mapAttemptToPayment = (
  attempt: PaymentAttempt,
): CustomOrderPayment | null => {
  const payment = attempt.payment;
  if (!payment?.id || !payment.phase) {
    return null;
  }

  return {
    id: payment.id,
    orderId: payment.orderId,
    phase: payment.phase,
    status: attempt.status as PaymentStatus,
    amount: Number(payment.amount ?? 0),
    paymentType: attempt.paymentType ?? null,
    midtransPaymentType: attempt.midtransPaymentType ?? null,
    midtransBank: attempt.midtransBank ?? null,
    midtransReference: attempt.midtransReference ?? null,
    paymentUrl: attempt.paymentUrl ?? null,
    paidAt: attempt.paidAt ?? null,
    expiresAt: attempt.expiresAt ?? null,
    order: payment.order
      ? {
          id: payment.order.id,
          orderNumber: payment.order.orderNumber,
          status: payment.order.status,
          grandTotalPrice: payment.order.grandTotalPrice,
          createdAt: attempt.createdAt,
          updatedAt: attempt.updatedAt,
        }
      : undefined,
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt,
  };
};

function PaymentLogo({ payment }: { payment: CustomOrderPayment }) {
  const key = getPaymentLogoKey(payment);
  const fallback = PAYMENT_FALLBACK[key] ?? PAYMENT_FALLBACK.bank_transfer;
  return (
    <div className="inline-flex h-6 w-14 shrink-0 items-center justify-center rounded-sm border border-zinc-200 bg-white px-1 py-0.5 dark:border-zinc-700 dark:bg-zinc-100">
      {fallback.iconPath ? (
        <img
          src={fallback.iconPath}
          alt={key}
          className="h-5 w-12 object-contain"
          loading="lazy"
        />
      ) : (
        <span
          className="text-[10px] font-bold tracking-tight"
          style={{ color: fallback.color }}
        >
          {fallback.label}
        </span>
      )}
    </div>
  );
}

function MetaItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-xs text-zinc-600 dark:text-zinc-300",
          highlight && "font-semibold text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PaymentHistoryCard({ payment }: { payment: CustomOrderPayment }) {
  const normalizedStatus = String(payment.status ?? "").toUpperCase();
  const Icon = getPaymentStatusIcon(normalizedStatus);
  const phaseLabel = PAYMENT_PHASE_LABEL[payment.phase] ?? payment.phase;
  const paymentId = payment.id;
  const parsedReference = parsePaymentReference(payment.midtransReference);
  const vaNumbers = Array.isArray(parsedReference?.va_numbers)
    ? parsedReference.va_numbers.filter((item) => item?.va_number)
    : [];
  const billerCode = parsedReference?.biller_code;
  const billKey = parsedReference?.bill_key;
  const permataVaNumber = parsedReference?.permata_va_number;
  const hasStructuredReference =
    vaNumbers.length > 0 ||
    Boolean(permataVaNumber) ||
    Boolean(billerCode) ||
    Boolean(billKey);
  const fallbackReference = String(payment.midtransReference ?? payment.id);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/70">
      <div className="flex items-center gap-3 p-4 pb-3">
        <PaymentLogo payment={payment} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <p className="text-sm leading-tight font-semibold text-zinc-900 dark:text-zinc-100">
              {phaseLabel}
            </p>
            <span className="text-sm text-zinc-300 dark:text-zinc-600">-</span>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatPrice(Number(payment.amount ?? 0))}
            </p>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-zinc-400 dark:text-zinc-500">
            {payment.midtransBank ??
              payment.midtransPaymentType ??
              payment.paymentType ??
              "-"}
            <span className="mx-1.5 text-zinc-200 dark:text-zinc-700">|</span>
            <span className="font-mono">ID Pembayaran: {paymentId}</span>
          </p>
        </div>
        <span
          className={cn(
            "shrink-0",
            getPaymentStatusBadgeClass(normalizedStatus),
          )}
        >
          <Icon size={11} />
          {getPaymentStatusLabelId(normalizedStatus)}
        </span>
      </div>

      <div className="mx-4 border-t border-dashed border-zinc-100 dark:border-zinc-800" />

      <div className="grid grid-cols-3 gap-x-4 gap-y-1 px-4 py-3">
        <MetaItem label="Dibuat" value={formatPaymentDate(payment.createdAt)} />
        <MetaItem
          label="Dibayar"
          value={formatPaymentDate(payment.paidAt)}
          highlight={Boolean(payment.paidAt)}
        />
        <MetaItem
          label="Kedaluwarsa"
          value={formatPaymentDate(payment.expiresAt)}
        />
      </div>

      <div className="space-y-2 px-4 pb-3">
        <p className="text-[10px] font-medium tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
          Referensi
        </p>

        {vaNumbers.length > 0
          ? vaNumbers.map((item, index) => {
              const bankLabel = String(item.bank ?? "Bank").toUpperCase();
              const vaNumber = String(item.va_number ?? "");
              return (
                <div
                  key={`${payment.id}-va-${index}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {bankLabel} VA
                    </p>
                    <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {vaNumber}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => copyToClipboard(vaNumber, `${bankLabel} VA`)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })
          : null}

        {permataVaNumber ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
            <div className="min-w-0">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Permata VA
              </p>
              <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {permataVaNumber}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() =>
                copyToClipboard(String(permataVaNumber), "Permata VA")
              }
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}

        {billerCode ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
            <div className="min-w-0">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Kode Biller Mandiri
              </p>
              <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {billerCode}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() =>
                copyToClipboard(String(billerCode), "Kode Biller Mandiri")
              }
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}

        {billKey ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
            <div className="min-w-0">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Kunci Tagihan Mandiri
              </p>
              <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {billKey}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() =>
                copyToClipboard(String(billKey), "Kunci Tagihan Mandiri")
              }
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}

        {!hasStructuredReference ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
            <p className="truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">
              {fallbackReference}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => copyToClipboard(fallbackReference, "Referensi")}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}
      </div>

      <div className="px-4 pb-3.5">
        <h4 className="text-sm leading-6 font-medium text-zinc-900 dark:text-zinc-100">
          Pembayaran
        </h4>
      </div>

      {payment.paymentUrl ? (
        <div className="px-4 pb-3.5">
          <a
            href={payment.paymentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[11px] font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-white"
          >
            <ExternalLink size={11} />
            Buka Halaman Pembayaran
          </a>
        </div>
      ) : null}
    </div>
  );
}

// ─── Payment method groups ───────────────────────────────────────────────────

type PaymentGroup = {
  label: string;
  methods: {
    code: CorePaymentMethod;
    displayName: string;
    iconPath: string;
    iconAlt: string;
  }[];
};

const paymentGroups: PaymentGroup[] = [
  {
    label: "Dompet Digital",
    methods: [
      {
        code: "qris",
        displayName: "QRIS",
        iconPath: "/assets/payment-icons/qris.png",
        iconAlt: "QRIS logo",
      },
      {
        code: "gopay",
        displayName: "GoPay",
        iconPath: "/assets/payment-icons/gopay.png",
        iconAlt: "GoPay logo",
      },
    ],
  },
  {
    label: "Virtual Account",
    methods: [
      {
        code: "bca_va",
        displayName: "Virtual Account BCA",
        iconPath: "/assets/payment-icons/bca.svg",
        iconAlt: "BCA logo",
      },
      {
        code: "bni_va",
        displayName: "Virtual Account BNI",
        iconPath: "/assets/payment-icons/bni.png",
        iconAlt: "BNI logo",
      },
      {
        code: "bri_va",
        displayName: "Virtual Account BRI",
        iconPath: "/assets/payment-icons/bri.svg",
        iconAlt: "BRI logo",
      },
      {
        code: "permata_va",
        displayName: "Virtual Account Permata",
        iconPath: "/assets/payment-icons/permata.png",
        iconAlt: "Permata Bank logo",
      },
      {
        code: "mandiri_bill",
        displayName: "Pembayaran Mandiri Bill",
        iconPath: "/assets/payment-icons/mandiri.webp",
        iconAlt: "Bank Mandiri logo",
      },
      {
        code: "cimb_va",
        displayName: "Virtual Account CIMB",
        iconPath: "/assets/payment-icons/cimb.png",
        iconAlt: "CIMB logo",
      },
    ],
  },
];

// ─── Payment Method Selector ──────────────────────────────────────────────────

function PaymentMethodSelector({
  value,
  onChange,
  disabled,
}: {
  value: CorePaymentMethod;
  onChange: (v: CorePaymentMethod) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      {paymentGroups.map((group) => (
        <div key={group.label} className="space-y-1.5">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
            {group.label}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {group.methods.map((method) => {
              const isSelected = value === method.code;
              return (
                <button
                  key={method.code}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(method.code)}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
                    "disabled:pointer-events-none disabled:opacity-50",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-background hover:border-primary/40 hover:bg-muted/40",
                  )}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <span className="text-primary absolute top-1.5 right-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <span className="inline-flex h-6 w-14 shrink-0 items-center justify-center rounded-sm border border-zinc-200 bg-white px-1 py-0.5 dark:border-zinc-700 dark:bg-zinc-100">
                    <img
                      src={method.iconPath}
                      alt={method.iconAlt}
                      className="h-5 w-12 object-contain"
                      loading="lazy"
                    />
                  </span>
                  {/* Label */}
                  <span
                    className={cn(
                      "truncate leading-none font-medium",
                      isSelected ? "text-primary" : "text-foreground",
                    )}
                  >
                    {method.displayName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type BillingDetailProps = {
  orderId: string;
  paymentId?: string;
  paymentAttemptId?: string;
};

export const BillingDetail = ({
  orderId,
  paymentId,
  paymentAttemptId,
}: BillingDetailProps) => {
  const router = useRouter();
  const [waitingPaymentParam, setWaitingPaymentParam] =
    useQueryState("waiting-payment");
  const { data: order, isLoading, isError } = useGetOrder(orderId);
  const { data: selectedAttemptDetail } =
    useGetPaymentAttemptByPayment(paymentAttemptId);
  const { mutateAsync: createSnapPayment, isPending: isCreatingSnapPayment } =
    useCreateSnapPayment();
  const [paymentMethod, setPaymentMethod] = useState<CorePaymentMethod>("qris");
  const [paymentInstruction, setPaymentInstruction] =
    useState<PaymentInstructionValue | null>(null);
  const [paymentRedirectUrl, setPaymentRedirectUrl] = useState<string | null>(
    null,
  );

  const orderRef = order?.orderNumber?.trim() || order?.id || orderId;
  const grandTotalAmount = Number(order?.grandTotalPrice ?? 0);
  const totalPaidAmount = Number(order?.totalPaid ?? 0);
  const remainingAmount = Number(order?.remaining ?? 0);
  const isSettledByAmount =
    remainingAmount <= 0 ||
    (grandTotalAmount > 0 && totalPaidAmount >= grandTotalAmount);
  const isSettledByStatus =
    order?.status === "READY_TO_SHIP" ||
    order?.status === "SHIPPED" ||
    order?.status === "COMPLETED";
  const allPaymentsDone = isSettledByAmount || isSettledByStatus;

  const defaultPhaseAmounts = getDefaultPhaseAmounts(grandTotalAmount);
  const latestPaymentByPhase = useMemo(() => {
    const map = new Map<
      PaymentPhase,
      {
        amount: number;
        status: string;
        createdAt: number;
      }
    >();
    for (const payment of order?.payments ?? []) {
      const phase = payment.phase;
      if (!phaseOrder.includes(phase)) continue;
      const createdAtTs = new Date(payment.createdAt).getTime();
      const existing = map.get(phase);
      if (!existing || createdAtTs > existing.createdAt) {
        map.set(phase, {
          amount: Number(payment.amount ?? 0),
          status: String(payment.status ?? ""),
          createdAt: createdAtTs,
        });
      }
    }
    return map;
  }, [order?.payments]);

  const phaseAmounts = useMemo(() => {
    const next = { ...defaultPhaseAmounts };
    for (const phase of phaseOrder) {
      const latest = latestPaymentByPhase.get(phase);
      if (latest && Number.isFinite(latest.amount) && latest.amount > 0) {
        next[phase] = latest.amount;
      }
    }
    return next;
  }, [defaultPhaseAmounts, latestPaymentByPhase]);

  const paidPhaseSet = useMemo(() => {
    const set = new Set<PaymentPhase>();
    for (const phase of phaseOrder) {
      const latest = latestPaymentByPhase.get(phase);
      if (latest?.status.toUpperCase() === "PAID") {
        set.add(phase);
      }
    }
    if (allPaymentsDone) {
      phaseOrder.forEach((phase) => set.add(phase));
    }
    return set;
  }, [allPaymentsDone, latestPaymentByPhase]);

  const currentPhase = useMemo(() => {
    if (allPaymentsDone) return "FINAL" as PaymentPhase;
    const nextUnpaid = phaseOrder.find((phase) => !paidPhaseSet.has(phase));
    if (nextUnpaid) return nextUnpaid;
    return (
      order?.currentPaymentPhase ??
      inferPhaseFromStatus(order?.status ?? "PENDING_PAYMENT")
    );
  }, [
    allPaymentsDone,
    order?.currentPaymentPhase,
    order?.status,
    paidPhaseSet,
  ]);

  const steps = useMemo(
    () =>
      buildPhaseSteps({
        amountsByPhase: phaseAmounts,
        paidPhaseSet,
        currentPhase,
        allPaymentsDone,
      }),
    [allPaymentsDone, currentPhase, paidPhaseSet, phaseAmounts],
  );

  const payableAmount = Math.max(
    0,
    latestPaymentByPhase.get(currentPhase)?.amount ??
      phaseAmounts[currentPhase] ??
      remainingAmount,
  );
  const isPayable =
    !allPaymentsDone &&
    order?.status !== "CANCELLED" &&
    order?.status !== "COMPLETED" &&
    payableAmount > 0;

  const paymentHistory = useMemo(
    () =>
      [...(order?.payments ?? [])].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [order?.payments],
  );
  const activePendingPayment = useMemo(
    () =>
      paymentHistory.find((payment) => {
        return isRetryActivePaymentStatus(payment.status);
      }),
    [paymentHistory],
  );
  const livePendingPayment = useMemo(
    () =>
      paymentHistory.find((payment) =>
        isLivePendingPaymentStatus(payment.status),
      ),
    [paymentHistory],
  );
  const activePendingIsSnap = useMemo(() => {
    if (!livePendingPayment) return false;
    const paymentType = String(
      livePendingPayment.paymentType ?? "",
    ).toUpperCase();
    const paymentUrl = String(
      livePendingPayment.paymentUrl ?? "",
    ).toLowerCase();
    return paymentType.includes("SNAP") || paymentUrl.includes("/snap/");
  }, [livePendingPayment]);
  const selectedPaymentById = useMemo(
    () =>
      paymentId
        ? (paymentHistory.find((payment) => payment.id === paymentId) ?? null)
        : null,
    [paymentHistory, paymentId],
  );
  const selectedAttemptPayment = useMemo(
    () =>
      selectedAttemptDetail ? mapAttemptToPayment(selectedAttemptDetail) : null,
    [selectedAttemptDetail],
  );
  const selectedHistoryPayment = selectedAttemptPayment ?? selectedPaymentById;
  const currentPaymentDetail =
    selectedHistoryPayment ??
    activePendingPayment ??
    paymentHistory.find((payment) => payment.phase === currentPhase) ??
    paymentHistory[0] ??
    null;
  const isSelectedPaymentActive = useMemo(() => {
    return isRetryActivePaymentStatus(selectedHistoryPayment?.status);
  }, [selectedHistoryPayment?.status]);
  const isHistoryView = Boolean(
    selectedHistoryPayment && !isSelectedPaymentActive,
  );
  const historyFocusPhase = selectedHistoryPayment?.phase;
  const historyViewMeta = useMemo(() => {
    if (!isHistoryView || !selectedHistoryPayment) return null;
    const status = String(selectedHistoryPayment.status ?? "").toUpperCase();
    const phase =
      PAYMENT_PHASE_LABEL[selectedHistoryPayment.phase] ??
      selectedHistoryPayment.phase;

    if (status === "PAID") {
      return {
        title: "Riwayat pembayaran",
        description: `Pembayaran untuk tahap ${phase} sudah berhasil pada ${formatPaymentDate(selectedHistoryPayment.paidAt)}.`,
        className:
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300",
      };
    }
    if (status === "EXPIRED") {
      return {
        title: "Tagihan kedaluwarsa",
        description: `Tagihan untuk tahap ${phase} kedaluwarsa pada ${formatPaymentDate(selectedHistoryPayment.expiresAt)} dan belum dibayar.`,
        className:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300",
      };
    }
    if (status === "CANCELLED") {
      return {
        title: "Tagihan dibatalkan",
        description: `Tagihan untuk tahap ${phase} sudah dibatalkan dan tidak dapat digunakan untuk pembayaran.`,
        className:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300",
      };
    }

    return {
      title: `Pembayaran ${getPaymentStatusLabelId(status).toLowerCase()}`,
      description: `Ini adalah riwayat pembayaran untuk tahap ${phase} dengan status ${getPaymentStatusLabelId(status)}.`,
      className:
        "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300",
    };
  }, [isHistoryView, selectedHistoryPayment]);
  const stepsToRender = useMemo(() => {
    if (!isHistoryView || !historyFocusPhase) return steps;
    const focusIndex = phaseOrder.indexOf(historyFocusPhase);
    if (focusIndex < 0) return steps;

    return phaseOrder.map((phase, index) => ({
      phase,
      label: PHASE_LABEL[phase],
      amount: phaseAmounts[phase],
      state:
        index < focusIndex
          ? ("completed" as StepState)
          : index === focusIndex
            ? ("current" as StepState)
            : ("upcoming" as StepState),
    }));
  }, [historyFocusPhase, isHistoryView, phaseAmounts, steps]);
  const paymentStepperItems = useMemo(
    () =>
      stepsToRender.map((step) => ({
        id: step.phase,
        title: step.label,
          description:
            step.state === "completed" || step.state === "current"
              ? formatPrice(step.amount)
              : "Berikutnya",
      })),
    [stepsToRender],
  );
  const currentStepperPhase = useMemo<PaymentPhase>(() => {
    const current = stepsToRender.find((step) => step.state === "current");
    if (current) {
      return current.phase;
    }
    const lastCompleted = [...stepsToRender]
      .reverse()
      .find((step) => step.state === "completed");
    if (lastCompleted) {
      return lastCompleted.phase;
    }
    return stepsToRender[0]?.phase ?? "DP";
  }, [stepsToRender]);

  useEffect(() => {
    if (!paymentInstruction && waitingPaymentParam !== "true") return;
    if (allPaymentsDone || currentPaymentDetail?.status === "PAID") {
      setPaymentInstruction(null);
      void setWaitingPaymentParam(null);
    }
  }, [
    allPaymentsDone,
    currentPaymentDetail?.status,
    paymentInstruction,
    setWaitingPaymentParam,
    waitingPaymentParam,
  ]);

  useEffect(() => {
    if (paymentInstruction) return;
    if (waitingPaymentParam !== "true" && !livePendingPayment) return;
    const nextInstruction = livePendingPayment
      ? buildInstructionFromPayment(livePendingPayment)
      : null;
    if (!nextInstruction) return;
    setPaymentInstruction(nextInstruction);
    if (waitingPaymentParam !== "true") {
      void setWaitingPaymentParam("true");
    }
  }, [
    livePendingPayment,
    paymentInstruction,
    setWaitingPaymentParam,
    waitingPaymentParam,
  ]);

  useEffect(() => {
    const pendingUrl = livePendingPayment?.paymentUrl?.trim() || "";
    if (!pendingUrl) return;
    if (activePendingIsSnap) return;
    if (paymentRedirectUrl) return;
    setPaymentRedirectUrl(pendingUrl);
  }, [activePendingIsSnap, livePendingPayment?.paymentUrl, paymentRedirectUrl]);

  const shouldShowPaymentMethodSelector =
    !isHistoryView && !paymentInstruction && !allPaymentsDone;

  if (isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </section>
    );
  }

  if (isError || !order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detail Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">Pesanan tidak ditemukan.</p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/billing")}
          >
            Kembali
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handlePayNow = async () => {
    if (!isPayable) {
      toast.info("Pesanan ini tidak dapat dibayar.");
      return;
    }
    const pendingUrl = livePendingPayment?.paymentUrl?.trim() || "";
    if (pendingUrl && !activePendingIsSnap) {
      setPaymentRedirectUrl(pendingUrl);
      toast.info(
        "Anda sudah memiliki tagihan pembayaran aktif. Selesaikan terlebih dahulu.",
      );
      return;
    }
    if (activePendingIsSnap) {
      toast.error(
        "Masih ada tagihan Snap lama yang pending. Selesaikan atau batalkan terlebih dahulu sebelum membuat pembayaran Core baru.",
      );
      return;
    }

    try {
      const payment = await createSnapPayment({
        orderId: order.id,
        channel: "CORE",
        corePayload: buildCorePayload(paymentMethod),
      });
      const paymentUrl =
        payment?.paymentUrl?.trim() ??
        payment?.actions?.find((item) => item?.url)?.url?.trim() ??
        "";
      if (!paymentUrl) {
        const hasInstruction =
          (payment?.vaNumbers?.length ?? 0) > 0 ||
          Boolean(payment?.permataVaNumber) ||
          Boolean(payment?.qrString) ||
          Boolean(payment?.billKey) ||
          Boolean(payment?.billerCode);

        if (!hasInstruction) {
          toast.error("URL pembayaran tidak tersedia.");
          return;
        }

        setPaymentInstruction({
          method: paymentMethod,
          vaNumbers: payment?.vaNumbers ?? [],
          permataVaNumber: payment?.permataVaNumber ?? null,
          qrString: payment?.qrString ?? null,
          billKey: payment?.billKey ?? null,
          billerCode: payment?.billerCode ?? null,
        });
        void setWaitingPaymentParam("true");
        toast.success("Instruksi pembayaran berhasil dibuat.");
        return;
      }
      if ((payment?.vaNumbers?.length ?? 0) > 0 || payment?.qrString) {
        setPaymentInstruction({
          method: paymentMethod,
          vaNumbers: payment?.vaNumbers ?? [],
          permataVaNumber: payment?.permataVaNumber ?? null,
          qrString: payment?.qrString ?? null,
          billKey: payment?.billKey ?? null,
          billerCode: payment?.billerCode ?? null,
        });
        void setWaitingPaymentParam("true");
      }
      toast.info("Mengarahkan ke halaman pembayaran...");
      window.location.assign(paymentUrl);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Gagal membuat transaksi pembayaran.",
      );
      if (message.includes("No invoice available for this phase yet")) {
        toast.error(
          "Invoice tahap ini belum tersedia. Tunggu update progress produksi dari admin.",
        );
        return;
      }
      if (
        message.includes("status code: 406") ||
        message.toLowerCase().includes("conflict with the current state")
      ) {
        toast.error(
          "Tagihan pembayaran aktif sudah ada. Lanjutkan pembayaran yang sudah tersedia terlebih dahulu.",
        );
        return;
      }
      toast.error(message);
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/billing")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Kembali
        </Button>
        <Badge className={getOrderStatusBadgeClass(order.status)}>
          {ORDER_STATUS_LABEL_ID[order.status] ?? getOrderStatusLabel(order.status)}
        </Badge>
      </div>

      {/* Order Summary */}
      <Card className="py-4">
        <CardHeader className="space-y-4">
          <CardTitle>Pesanan {orderRef}</CardTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bg-muted/40 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Total Tagihan</p>
              <p className="font-semibold">
                {formatPrice(Number(order.grandTotalPrice ?? 0))}
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Total Dibayar</p>
              <p className="font-semibold">
                {formatPrice(Number(order.totalPaid ?? 0))}
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Sisa Pembayaran</p>
              <p className="font-semibold">{formatPrice(remainingAmount)}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Payment Stepper */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Tahapan Pembayaran</p>
            <Stepper
              steps={paymentStepperItems}
              currentStep={currentStepperPhase}
              orientation="horizontal"
            />
            {historyViewMeta ? (
              <div
                className={cn(
                  "rounded-xl border p-3",
                  historyViewMeta.className,
                )}
              >
                <p className="text-sm font-semibold">{historyViewMeta.title}</p>
                <p className="mt-1 text-xs">{historyViewMeta.description}</p>
              </div>
            ) : null}
          </div>

          <Separator />

          {/* Payment Method */}
          {!isHistoryView ? (
            <>
              <div className="space-y-3">
                {allPaymentsDone ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-700">
                      Semua pembayaran sudah selesai
                    </p>
                    <p className="mt-1 text-xs text-emerald-700/90">
                      Pembayaran Anda sudah lunas. Silakan tunggu proses produksi atau pengiriman berikutnya.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                    <div className="w-full space-y-3 xl:basis-5/12">
                      <p className="text-sm font-semibold">
                        Detail Pembayaran Saat Ini
                      </p>
                      {!currentPaymentDetail ? (
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                            <Clock
                              size={20}
                              className="text-zinc-400 dark:text-zinc-500"
                            />
                          </div>
                          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-300">
                            Belum ada detail pembayaran
                          </p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            Detail pembayaran akan muncul di sini setelah instruksi pembayaran dibuat.
                          </p>
                        </div>
                      ) : (
                        <PaymentHistoryCard payment={currentPaymentDetail} />
                      )}
                    </div>

                    {/* payment method field and instruction */}
                    <div className="w-full space-y-3 xl:basis-7/12">
                      {shouldShowPaymentMethodSelector ? (
                        <>
                          <p className="pb-2 text-sm font-semibold">
                            Metode Pembayaran
                          </p>
                          <PaymentMethodSelector
                            value={paymentMethod}
                            onChange={(v) => {
                              setPaymentMethod(v);
                            }}
                            disabled={isCreatingSnapPayment}
                          />
                        </>
                      ) : null}

                      <div>
                        {!isHistoryView ? (
                          <>
                            {/* Payment Instruction (VA / QR result) */}
                            {paymentInstruction && (
                              <PaymentInstruction value={paymentInstruction} />
                            )}

                            {paymentRedirectUrl ? (
                              <Button
                                variant="outline"
                                className="w-full"
                              onClick={() =>
                                  window.open(paymentRedirectUrl, "_blank")
                                }
                              >
                                Buka Halaman Pembayaran
                              </Button>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                      <div className="space-y-3">
                        {/* Summary row */}
                        {isPayable && shouldShowPaymentMethodSelector && (
                          <div className="bg-muted/40 flex items-center justify-between rounded-lg px-3 py-2 text-sm">
                            <span className="text-muted-foreground">
                              {PAYMENT_PHASE_LABEL[currentPhase]} melalui{" "}
                              {corePaymentMethodLabel[paymentMethod]}
                            </span>
                            <span className="font-semibold">
                              {formatPrice(payableAmount)}
                            </span>
                          </div>
                        )}

                        {allPaymentsDone ? (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700">
                            Semua pembayaran sudah selesai. Silakan tunggu proses berikutnya.
                          </div>
                        ) : (
                          <>
                            {!paymentInstruction ? (
                              <Button
                                className="w-full"
                                onClick={handlePayNow}
                                disabled={!isPayable || isCreatingSnapPayment}
                              >
                                {isCreatingSnapPayment ? (
                                  "Membuat instruksi pembayaran..."
                                ) : (
                                  <>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Buat Instruksi Pembayaran
                                  </>
                                )}
                              </Button>
                            ) : null}

                            {!isPayable && (
                              <p className="text-muted-foreground text-center text-xs">
                                Pesanan ini sudah tidak dapat dibayar.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />
            </>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
};
