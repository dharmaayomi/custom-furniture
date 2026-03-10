"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentInstruction } from "@/features/dashboard/billing/components/PaymentInstruction";
import useGetAttemptDetail from "@/hooks/api/payment/useGetAttemptDetail";
import useGetOrder from "@/hooks/api/order/useGetOrder";
import { formatPrice } from "@/lib/price";
import {
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
} from "@/lib/orderStatus";
import {
  getPaymentStatusBadgeClass,
  getPaymentStatusLabel,
} from "@/lib/paymentStatus";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Hash,
  Receipt,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type PaymentHistoryDetailProps = {
  orderId: string;
  paymentAttemptId?: string;
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

const inferMethod = (params: {
  bank?: string | null;
  midtransType?: string | null;
  paymentType?: string | null;
}) => {
  const bank = String(params.bank ?? "").toLowerCase();
  if (bank === "bca") return "bca_va" as const;
  if (bank === "bni") return "bni_va" as const;
  if (bank === "bri") return "bri_va" as const;
  if (bank === "permata") return "permata_va" as const;
  if (bank === "cimb") return "cimb_va" as const;
  if (bank === "mandiri") return "mandiri_bill" as const;

  const midtransType = String(params.midtransType ?? "").toLowerCase();
  if (midtransType === "qris") return "qris" as const;
  if (midtransType === "gopay") return "gopay" as const;
  if (midtransType === "echannel") return "mandiri_bill" as const;

  const paymentType = String(params.paymentType ?? "").toLowerCase();
  if (paymentType.includes("qris")) return "qris" as const;
  if (paymentType.includes("gopay")) return "gopay" as const;

  return "qris" as const;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const copyToClipboard = async (value: string, label: string) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Failed to copy ${label}`);
  }
};

/* ─── Skeleton loader ─────────────────────────────────────────── */
const DetailSkeleton = () => (
  <section className="space-y-4">
    <Skeleton className="h-9 w-24 rounded-lg" />
    <Skeleton className="h-28 w-full rounded-2xl" />
    <Skeleton className="h-48 w-full rounded-2xl" />
    <Skeleton className="h-32 w-full rounded-2xl" />
  </section>
);

/* ─── Date stat item ──────────────────────────────────────────── */
const DateStat = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium tracking-wider uppercase">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
    <span className="text-foreground text-sm font-semibold">{value}</span>
  </div>
);

/* ─── Main component ──────────────────────────────────────────── */
export const PaymentHistoryDetail = ({
  orderId,
  paymentAttemptId,
}: PaymentHistoryDetailProps) => {
  const router = useRouter();
  const { data: order, isLoading: isLoadingOrder } = useGetOrder(orderId);
  const { data: attempt, isLoading: isLoadingAttempt } =
    useGetAttemptDetail(paymentAttemptId);

  if (isLoadingOrder || isLoadingAttempt) return <DetailSkeleton />;

  if (!order || !attempt) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="bg-muted rounded-full p-4">
            <Receipt className="text-muted-foreground h-8 w-8" />
          </div>
          <div>
            <p className="text-foreground font-semibold">Data Not Found</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Payment history data could not be loaded.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/billing")}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Billing
          </Button>
        </CardContent>
      </Card>
    );
  }

  /* ── Derived data ── */
  const parsedReference = parsePaymentReference(attempt.midtransReference);
  const paymentSnapshot =
    order.payments?.find((p) => p.id === attempt.paymentId) ?? null;
  const paymentPhase = paymentSnapshot?.phase ?? attempt.payment?.phase ?? "-";
  const paymentAmount = Number(
    paymentSnapshot?.amount ?? attempt.payment?.amount ?? 0,
  );
  const vaNumbers = Array.isArray(parsedReference?.va_numbers)
    ? parsedReference.va_numbers
        .filter((item) => item?.va_number)
        .map((item) => ({
          bank: String(item.bank ?? attempt.midtransBank ?? "bank"),
          va_number: String(item.va_number),
        }))
    : [];

  const instruction = {
    method: inferMethod({
      bank: attempt.midtransBank,
      midtransType: attempt.midtransPaymentType,
      paymentType: attempt.paymentType,
    }),
    vaNumbers,
    permataVaNumber: parsedReference?.permata_va_number ?? null,
    qrString:
      parsedReference?.qr_string ??
      ((attempt.rawResponse as { qr_string?: string } | undefined)?.qr_string ??
        null),
    billerCode: parsedReference?.biller_code ?? null,
    billKey: parsedReference?.bill_key ?? null,
  };

  const hasInstruction =
    instruction.vaNumbers.length > 0 ||
    Boolean(instruction.permataVaNumber) ||
    Boolean(instruction.qrString) ||
    Boolean(instruction.billerCode) ||
    Boolean(instruction.billKey);

  return (
    <section className="space-y-5">
      {/* ── Top nav bar ── */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground -ml-2 gap-1.5"
          onClick={() => router.push("/dashboard/billing")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <span className={getOrderStatusBadgeClass(order.status)}>
          {getOrderStatusLabel(order.status)}
        </span>
      </div>

      {/* ── Order hero card ── */}
      <Card className="overflow-hidden rounded-2xl border-0 shadow-md">
        {/* Gradient header strip using primary color */}
        <div className="bg-primary/10 border-border/50 flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-primary/15 rounded-xl p-2.5">
              <Receipt className="text-primary h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                Order
              </p>
              <p className="text-foreground truncate text-base font-bold">
                #{order.orderNumber?.trim() || order.id}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              {paymentPhase}
            </p>
            <p className="text-primary text-lg font-bold">
              {formatPrice(paymentAmount)}
            </p>
          </div>
        </div>

        <CardContent className="space-y-5 px-5 py-4">
          {/* ── Attempt block ── */}
          <div className="bg-muted/40 rounded-xl p-4">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Hash className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                <span className="text-muted-foreground font-mono text-xs">
                  {attempt.id}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                  onClick={() => copyToClipboard(attempt.id, "Attempt ID")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <span className={getPaymentStatusBadgeClass(attempt.status)}>
                {getPaymentStatusLabel(attempt.status)}
              </span>
            </div>

            <Separator className="my-3" />

            {/* Date stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <DateStat
                icon={Clock3}
                label="Created"
                value={formatDate(attempt.createdAt)}
              />
              <DateStat
                icon={CheckCircle2}
                label="Paid"
                value={formatDate(attempt.paidAt)}
              />
              <DateStat
                icon={XCircle}
                label="Expired"
                value={formatDate(attempt.expiresAt)}
              />
            </div>

            {/* Payment URL */}
            {attempt.paymentUrl ? (
              <div className="border-border/50 mt-4 border-t pt-3">
                <a
                  href={attempt.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Payment URL
                </a>
              </div>
            ) : null}
          </div>

          {/* ── History notice ── */}
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-900/20">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              This is{" "}
              <span className="font-semibold">payment history data</span>. The
              VA number shown here is a past invoice reference and{" "}
              <span className="font-semibold">should not be reused</span> for a
              new payment.
            </p>
          </div>

          {/* ── Payment instruction ── */}
          {hasInstruction ? (
            <div>
              <PaymentInstruction value={instruction} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
};
