"use client";

import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import useGetPaymentAttempts from "@/hooks/api/payment/useGetPaymentAttempts";
import useGetUserPayments from "@/hooks/api/payment/useGetUserPayments";
import { useUser } from "@/providers/UserProvider";
import { useQueryState } from "nuqs";
import { formatPrice } from "@/lib/price";
import {
  getPaymentStatusBadgeClass,
  getPaymentStatusIcon,
  getPaymentStatusLabel,
} from "@/lib/paymentStatus";
import {
  ArrowRight,
  ExternalLink,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CustomOrderPayment, PaymentStatus } from "@/types/customOrder";
import { PaymentAttempt } from "@/types/payment";

const isActivePaymentStatus = (status: PaymentStatus) =>
  status === "WAITING_FOR_PAYMENT" ||
  status === "CHALLENGE" ||
  status === "EXPIRED";

const PHASE_LABEL: Record<string, string> = {
  DP: "Down Payment",
  PROGRESS_1: "Progress 1",
  PROGRESS_2: "Progress 2",
  FINAL: "Final Payment",
};

const PHASE_STEP: Record<string, number> = {
  DP: 1,
  PROGRESS_1: 2,
  PROGRESS_2: 3,
  FINAL: 4,
};

const PAYMENT_VISUAL: Record<
  string,
  { iconPath: string; iconAlt: string; displayName: string }
> = {
  qris: {
    iconPath: "/assets/payment-icons/qris.png",
    iconAlt: "QRIS",
    displayName: "QRIS",
  },
  gopay: {
    iconPath: "/assets/payment-icons/gopay.png",
    iconAlt: "GoPay",
    displayName: "GoPay",
  },
  bca_va: {
    iconPath: "/assets/payment-icons/bca.svg",
    iconAlt: "BCA",
    displayName: "BCA",
  },
  bni_va: {
    iconPath: "/assets/payment-icons/bni.png",
    iconAlt: "BNI",
    displayName: "BNI",
  },
  bri_va: {
    iconPath: "/assets/payment-icons/bri.svg",
    iconAlt: "BRI",
    displayName: "BRI",
  },
  permata_va: {
    iconPath: "/assets/payment-icons/permata.png",
    iconAlt: "Permata",
    displayName: "Permata",
  },
  cimb_va: {
    iconPath: "/assets/payment-icons/cimb.png",
    iconAlt: "CIMB",
    displayName: "CIMB",
  },
  mandiri_bill: {
    iconPath: "/assets/payment-icons/mandiri.webp",
    iconAlt: "Mandiri",
    displayName: "Mandiri",
  },
  bank_transfer: {
    iconPath: "/assets/payment-icons/bca.svg",
    iconAlt: "VA",
    displayName: "Virtual Account",
  },
};

const getPaymentVisualKey = (payment: CustomOrderPayment) => {
  const bank = String(payment.midtransBank ?? "").toLowerCase();
  if (bank === "bca") return "bca_va";
  if (bank === "bni") return "bni_va";
  if (bank === "bri") return "bri_va";
  if (bank === "permata") return "permata_va";
  if (bank === "cimb") return "cimb_va";
  if (bank === "mandiri") return "mandiri_bill";
  const midtransType = String(payment.midtransPaymentType ?? "").toLowerCase();
  if (midtransType === "qris") return "qris";
  if (midtransType === "gopay") return "gopay";
  if (midtransType === "echannel") return "mandiri_bill";
  const paymentType = String(payment.paymentType ?? "").toLowerCase();
  if (paymentType.includes("qris")) return "qris";
  if (paymentType.includes("gopay")) return "gopay";
  if (paymentType.includes("echannel")) return "mandiri_bill";
  if (paymentType.includes("bank_transfer")) return "bank_transfer";
  return "bank_transfer";
};

const PaymentLogo = ({
  payment,
  size = 16,
}: {
  payment: CustomOrderPayment;
  size?: number;
}) => {
  const visual =
    PAYMENT_VISUAL[getPaymentVisualKey(payment)] ??
    PAYMENT_VISUAL.bank_transfer;
  return (
    <span className="inline-flex items-center justify-center rounded border border-zinc-200 bg-white px-1 py-0.5 dark:border-zinc-700 dark:bg-zinc-100">
      <img
        src={visual.iconPath}
        alt={visual.iconAlt}
        style={{ width: size, height: size }}
        className="shrink-0 object-contain"
        loading="lazy"
      />
    </span>
  );
};

const getPaymentDisplayName = (payment: CustomOrderPayment) =>
  (PAYMENT_VISUAL[getPaymentVisualKey(payment)] ?? PAYMENT_VISUAL.bank_transfer)
    .displayName;

const formatHistoryDate = (value?: string | null) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

type BillingPaymentHistoryItem = CustomOrderPayment & { attemptId: string };

const mapAttemptToPaymentHistoryItem = (
  attempt: PaymentAttempt,
): BillingPaymentHistoryItem | null => {
  const payment = attempt.payment;
  if (!payment?.id || !payment.phase) return null;
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
    attemptId: attempt.id,
  };
};

/* ── Skeleton ─────────────────────────────────────────────────── */
const renderSkeletonList = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-card rounded-xl border p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ── Empty / Error state ──────────────────────────────────────── */
const EmptyState = ({ message }: { message: string }) => (
  <div className="border-border bg-card flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-14 text-center">
    <div className="bg-muted mb-4 rounded-full p-4">
      <ReceiptText className="text-muted-foreground h-8 w-8" />
    </div>
    <h3 className="text-foreground font-semibold">No payment data</h3>
    <p className="text-muted-foreground mt-1 text-sm">{message}</p>
  </div>
);

const ErrorState = () => (
  <div className="border-border bg-card flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-14 text-center">
    <p className="text-sm font-medium">Failed to load payment data</p>
    <p className="text-muted-foreground text-sm">
      Please refresh and try again.
    </p>
  </div>
);

/* ── History card ─────────────────────────────────────────────── */
const HistoryCard = ({
  payment,
  onClick,
}: {
  payment: BillingPaymentHistoryItem;
  onClick: () => void;
}) => {
  const PaymentStatusIcon = getPaymentStatusIcon(payment.status);
  const orderRef = payment.order?.orderNumber?.trim() || "-";
  const phaseLabel = PHASE_LABEL[payment.phase] ?? `${payment.phase} Payment`;
  const phaseStep = PHASE_STEP[payment.phase] ?? null;
  const displayName = getPaymentDisplayName(payment);
  const dateStr = formatHistoryDate(payment.paidAt ?? payment.createdAt);

  return (
    <div
      className="bg-card hover:bg-muted/30 border-border group cursor-pointer rounded-xl border transition-all hover:shadow-sm"
      onClick={onClick}
    >
      {/* Top strip: order identifier */}
      <div className="border-border/60 flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            Order
          </span>
          <span className="text-foreground font-mono text-sm font-bold">
            {orderRef}
          </span>
        </div>
        {phaseStep ? (
          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
            Step {phaseStep}
          </span>
        ) : null}
      </div>

      {/* Main body */}
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        {/* Left: phase + method */}
        <div className="min-w-0 space-y-1.5">
          <p className="text-foreground text-sm leading-tight font-bold">
            {phaseLabel}
          </p>
          <div className="flex items-center gap-1.5">
            <PaymentLogo payment={payment} size={14} />
            <span className="text-muted-foreground text-xs">{displayName}</span>
          </div>
          {payment.paymentUrl ? (
            <a
              href={payment.paymentUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
            >
              Lihat tagihan <ExternalLink size={10} />
            </a>
          ) : null}
        </div>

        {/* Right: status + amount + date */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={getPaymentStatusBadgeClass(payment.status)}>
            <PaymentStatusIcon className="h-3 w-3" />
            {getPaymentStatusLabel(payment.status)}
          </span>
          <p className="text-foreground text-sm font-bold tabular-nums">
            {formatPrice(Number(payment.amount ?? 0))}
          </p>
          {dateStr ? (
            <p className="text-muted-foreground text-[11px]">{dateStr}</p>
          ) : null}
        </div>
      </div>

      {/* Hover affordance */}
      <div className="border-border/40 flex items-center justify-end border-t px-4 py-2 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="text-primary flex items-center gap-1 text-xs font-medium">
          View detail <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
};

/* ── Active card ──────────────────────────────────────────────── */
const ActiveCard = ({
  payment,
  onClick,
}: {
  payment: CustomOrderPayment;
  onClick: () => void;
}) => {
  const PaymentStatusIcon = getPaymentStatusIcon(payment.status);
  const orderRef = payment.order?.orderNumber?.trim() || "-";
  const phaseLabel = PHASE_LABEL[payment.phase] ?? `${payment.phase} Payment`;
  const phaseStep = PHASE_STEP[payment.phase] ?? null;
  const dateStr = formatHistoryDate(payment.paidAt ?? payment.createdAt);

  return (
    <div
      className="bg-card hover:bg-muted/30 border-border group cursor-pointer rounded-xl border transition-all hover:shadow-sm"
      onClick={onClick}
    >
      <div className="border-border/60 flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            Order
          </span>
          <span className="text-foreground font-mono text-sm font-bold">
            {orderRef}
          </span>
        </div>
        {phaseStep ? (
          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
            Step {phaseStep}
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0 space-y-1">
          <p className="text-foreground text-sm font-bold">{phaseLabel}</p>
          {dateStr ? (
            <p className="text-muted-foreground text-xs">{dateStr}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={getPaymentStatusBadgeClass(payment.status)}>
            <PaymentStatusIcon className="h-3 w-3" />
            {getPaymentStatusLabel(payment.status)}
          </span>
          <p className="text-foreground text-sm font-bold tabular-nums">
            {formatPrice(Number(payment.amount ?? 0))}
          </p>
        </div>
      </div>

      <div className="border-border/40 flex items-center justify-end border-t px-4 py-2 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="text-primary flex items-center gap-1 text-xs font-medium">
          View detail <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
};

/* ── Main page ────────────────────────────────────────────────── */
export const BillingPage = () => {
  const router = useRouter();
  const [tabParam, setTabParam] = useQueryState("tab");
  const currentTab =
    tabParam === "payment-history" ? "payment-history" : "active-payment";
  const { userId } = useUser();

  const {
    data: paymentAttempts = [],
    isLoading: isHistoryLoading,
    isError: isHistoryError,
  } = useGetPaymentAttempts();
  const {
    data: activePaymentsSource = [],
    isLoading: isActiveLoading,
    isError: isActiveError,
  } = useGetUserPayments(userId);

  const historyPayments = useMemo<BillingPaymentHistoryItem[]>(() => {
    return paymentAttempts.reduce<BillingPaymentHistoryItem[]>(
      (acc, attempt) => {
        const mapped = mapAttemptToPaymentHistoryItem(attempt);
        if (mapped) acc.push(mapped);
        return acc;
      },
      [],
    );
  }, [paymentAttempts]);

  const activePayments = useMemo(
    () =>
      [...activePaymentsSource]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .filter((item) => isActivePaymentStatus(item.status)),
    [activePaymentsSource],
  );

  const sortedHistoryPayments = [...historyPayments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <section className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2.5">
            <div className="bg-primary/10 rounded-lg p-2">
              <WalletCards className="text-primary h-5 w-5" />
            </div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight">
              Billing
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Track active payments and payment history.
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs
        value={currentTab}
        onValueChange={(value) => {
          if (value === "active-payment" || value === "payment-history") {
            setTabParam(value);
          }
        }}
        className="w-full"
      >
        <TabsList className="mb-5 grid w-full grid-cols-2">
          <TabsTrigger value="active-payment">
            Active Payment
            {activePayments.length > 0 && (
              <span className="bg-primary text-primary-foreground ml-2 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold">
                {activePayments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="payment-history">
            Payment History
            {sortedHistoryPayments.length > 0 && (
              <span className="bg-muted text-muted-foreground ml-2 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold">
                {sortedHistoryPayments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active-payment" className="space-y-3">
          {isActiveLoading ? (
            renderSkeletonList()
          ) : isActiveError ? (
            <ErrorState />
          ) : activePayments.length === 0 ? (
            <EmptyState message="There are no active payments right now." />
          ) : (
            activePayments.map((payment) => (
              <ActiveCard
                key={payment.id}
                payment={payment}
                onClick={() => {
                  const orderId = payment.orderId ?? payment.order?.id;
                  if (!orderId) return;
                  router.push(
                    `/dashboard/billing/${orderId}?paymentId=${payment.id}`,
                  );
                }}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="payment-history" className="space-y-3">
          {isHistoryLoading ? (
            renderSkeletonList()
          ) : isHistoryError ? (
            <ErrorState />
          ) : sortedHistoryPayments.length === 0 ? (
            <EmptyState message="There are no payment history logs yet." />
          ) : (
            sortedHistoryPayments.map((payment) => (
              <HistoryCard
                key={payment.attemptId}
                payment={payment}
                onClick={() => {
                  const orderId = payment.orderId ?? payment.order?.id;
                  if (!orderId) return;
                  router.push(
                    `/dashboard/billing/${orderId}?paymentId=${payment.id}&attemptId=${payment.attemptId}`,
                  );
                }}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
};
