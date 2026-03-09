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
import { ExternalLink, ReceiptText } from "lucide-react";
import { useRouter } from "next/navigation";
import { CustomOrderPayment, PaymentStatus } from "@/types/customOrder";
import { PaymentAttempt } from "@/types/payment";

const isActivePaymentStatus = (status: PaymentStatus) =>
  status === "WAITING_FOR_PAYMENT" ||
  status === "CHALLENGE" ||
  status === "EXPIRED";

const PHASE_LABEL: Record<string, string> = {
  DP: "DP Payment",
  PROGRESS_1: "Progress 1 Payment",
  PROGRESS_2: "Progress 2 Payment",
  FINAL: "Final Payment",
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
    iconAlt: "Bank BCA",
    displayName: "Bank BCA",
  },
  bni_va: {
    iconPath: "/assets/payment-icons/bni.png",
    iconAlt: "Bank BNI",
    displayName: "Bank BNI",
  },
  bri_va: {
    iconPath: "/assets/payment-icons/bri.svg",
    iconAlt: "Bank BRI",
    displayName: "Bank BRI",
  },
  permata_va: {
    iconPath: "/assets/payment-icons/permata.png",
    iconAlt: "Bank Permata",
    displayName: "Bank Permata",
  },
  cimb_va: {
    iconPath: "/assets/payment-icons/cimb.png",
    iconAlt: "Bank CIMB",
    displayName: "Bank CIMB",
  },
  mandiri_bill: {
    iconPath: "/assets/payment-icons/mandiri.webp",
    iconAlt: "Bank Mandiri",
    displayName: "Bank Mandiri",
  },
  bank_transfer: {
    iconPath: "/assets/payment-icons/bca.svg",
    iconAlt: "Virtual Account",
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
  size = 18,
}: {
  payment: CustomOrderPayment;
  size?: number;
}) => {
  const visual = PAYMENT_VISUAL[getPaymentVisualKey(payment)] ?? PAYMENT_VISUAL.bank_transfer;
  return (
    <span className="inline-flex items-center justify-center rounded-sm border border-zinc-200 bg-white px-1 py-0.5 dark:border-zinc-700 dark:bg-zinc-100">
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
    month: "long",
    year: "numeric",
  });
};

type BillingPaymentHistoryItem = CustomOrderPayment & { attemptId: string };

const mapAttemptToPaymentHistoryItem = (
  attempt: PaymentAttempt,
): BillingPaymentHistoryItem | null => {
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
    attemptId: attempt.id,
  };
};

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
    return paymentAttempts.reduce<BillingPaymentHistoryItem[]>((acc, attempt) => {
      const mapped = mapAttemptToPaymentHistoryItem(attempt);
      if (mapped) {
        acc.push(mapped);
      }
      return acc;
    }, []);
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

  const renderSkeletonList = () => (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-card rounded-lg border p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderHistoryList = (items: BillingPaymentHistoryItem[]) => {
    if (isHistoryLoading) {
      return renderSkeletonList();
    }

    if (isHistoryError) {
      return (
        <div className="border-border bg-card mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12 lg:max-w-full">
          <p className="text-sm font-medium">Failed to load payment data</p>
          <p className="text-muted-foreground text-sm">
            Please refresh this page and try again.
          </p>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="border-border bg-card mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12 lg:max-w-full">
          <ReceiptText className="text-muted-foreground/40 mb-3 h-12 w-12" />
          <h3 className="text-foreground mb-2 text-lg font-medium">
            No payment data
          </h3>
          <p className="text-muted-foreground text-sm">
            There are no payment history logs in this tab yet.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((payment) => {
          const PaymentStatusIcon = getPaymentStatusIcon(payment.status);
          const orderId = payment.orderId ?? payment.order?.id;
          const orderRef = payment.order?.orderNumber?.trim() || "-";
          const phaseTitle = PHASE_LABEL[payment.phase] ?? `${payment.phase} Payment`;
          const displayName = getPaymentDisplayName(payment);
          const dateStr = formatHistoryDate(payment.paidAt ?? payment.createdAt);

          return (
            <div
              key={payment.attemptId}
              className="bg-card hover:bg-muted/35 border-border cursor-pointer rounded-md border p-3 transition sm:p-4"
              onClick={() => {
                if (!orderId) return;
                router.push(
                  `/dashboard/billing/${orderId}?paymentId=${payment.id}&attemptId=${payment.attemptId}`,
                );
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1 rounded-md p-1 sm:p-2">
                  <p className="text-sm font-bold sm:text-base">{phaseTitle}</p>
                  <p className="text-muted-foreground text-xs">Order {orderRef}</p>
                  <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <PaymentLogo payment={payment} size={18} />
                    {displayName}
                  </span>
                  {payment.paymentUrl ? (
                    <a
                      href={payment.paymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="text-primary mt-0.5 inline-flex items-center gap-1 text-xs hover:underline"
                    >
                      Lihat tagihan
                      <ExternalLink size={11} />
                    </a>
                  ) : null}
                </div>

                <div className="flex flex-col items-end gap-1 p-1 sm:p-2">
                  <span className={getPaymentStatusBadgeClass(payment.status)}>
                    <PaymentStatusIcon className="h-3.5 w-3.5" />
                    {getPaymentStatusLabel(payment.status)}
                  </span>
                  <p className="text-sm font-semibold sm:text-base">
                    {formatPrice(Number(payment.amount ?? 0))}
                  </p>
                  {dateStr ? (
                    <p className="text-muted-foreground text-xs italic">{dateStr}</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderActiveList = (items: CustomOrderPayment[]) => {
    if (isActiveLoading) {
      return renderSkeletonList();
    }

    if (isActiveError) {
      return (
        <div className="border-border bg-card mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12 lg:max-w-full">
          <p className="text-sm font-medium">Failed to load payment data</p>
          <p className="text-muted-foreground text-sm">
            Please refresh this page and try again.
          </p>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="border-border bg-card mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12 lg:max-w-full">
          <ReceiptText className="text-muted-foreground/40 mb-3 h-12 w-12" />
          <h3 className="text-foreground mb-2 text-lg font-medium">
            No payment data
          </h3>
          <p className="text-muted-foreground text-sm">
            There are no active payments in this tab.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((payment) => {
          const PaymentStatusIcon = getPaymentStatusIcon(payment.status);
          const orderId = payment.orderId ?? payment.order?.id;
          const orderRef = payment.order?.orderNumber?.trim() || "-";
          const dateStr = formatHistoryDate(payment.paidAt ?? payment.createdAt);

          return (
            <div
              key={payment.id}
              className="bg-card hover:bg-muted/35 hover:border-border cursor-pointer rounded-lg border p-4 shadow-sm transition"
              onClick={() => {
                if (!orderId) return;
                router.push(`/dashboard/billing/${orderId}?paymentId=${payment.id}`);
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-foreground truncate text-sm font-semibold sm:text-base">
                    {payment.phase} payment - {formatPrice(Number(payment.amount ?? 0))}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                    Order: {orderRef}
                  </p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Payment ID: {payment.id}
                  </p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Date: {dateStr || "-"}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                  <span className={getPaymentStatusBadgeClass(payment.status)}>
                    <PaymentStatusIcon className="h-3.5 w-3.5" />
                    {getPaymentStatusLabel(payment.status)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section>
      <div className="bg-muted/60 mb-8 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
          Billing
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Track active payments and payment history.
        </p>
      </div>

      <div className="bg-muted/50 rounded-md p-3 sm:p-4">
        <div className="mx-auto px-1 py-3 sm:px-4 sm:py-4 lg:px-2 lg:py-2">
          <Tabs
            value={currentTab}
            onValueChange={(value) => {
              if (value === "active-payment" || value === "payment-history") {
                setTabParam(value);
              }
            }}
            className="w-full"
          >
            <TabsList className="mb-4 grid w-full grid-cols-2 sm:mb-6">
              <TabsTrigger value="active-payment">
                Active Payment ({activePayments.length})
              </TabsTrigger>
              <TabsTrigger value="payment-history">
                Payment History ({sortedHistoryPayments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active-payment">
              {renderActiveList(activePayments)}
            </TabsContent>
            <TabsContent value="payment-history">
              {renderHistoryList(sortedHistoryPayments)}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};
