"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentInstruction } from "@/features/dashboard/billing/components/PaymentInstruction";
import useGetOrder from "@/hooks/api/order/useGetOrder";
import { getApiErrorStatus } from "@/lib/api-error";
import {
  buildInstructionFromPayment,
  inferInstructionMethodFromPayment,
} from "@/lib/payment-instruction";
import { formatPrice } from "@/lib/price";
import {
  getPaymentStatusBadgeClass,
  getPaymentStatusIcon,
  getPaymentStatusLabel,
} from "@/lib/paymentStatus";
import { CustomOrderPayment } from "@/types/customOrder";

type PaymentStatusPageState =
  | "waiting"
  | "success"
  | "expired"
  | "failed"
  | "invalid";

const POLLING_INTERVAL_MS = 3000;

const METHOD_LABEL: Record<string, string> = {
  qris: "QRIS",
  gopay: "GoPay",
  bca_va: "Virtual Account BCA",
  bni_va: "Virtual Account BNI",
  bri_va: "Virtual Account BRI",
  mandiri_bill: "Mandiri Bill Payment",
  permata_va: "Virtual Account Permata",
  cimb_va: "Virtual Account CIMB",
};

const normalizeStateParam = (
  value?: string | null,
): Exclude<PaymentStatusPageState, "invalid"> | null => {
  if (
    value === "waiting" ||
    value === "success" ||
    value === "expired" ||
    value === "failed"
  ) {
    return value;
  }

  return null;
};

const getLatestDpPayment = (payments?: CustomOrderPayment[] | null) => {
  const matches = (payments ?? []).filter((payment) => payment.phase === "DP");
  if (!matches.length) return null;

  return [...matches].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
};

const getStateFromDpPayment = (
  payment?: CustomOrderPayment | null,
): Exclude<PaymentStatusPageState, "invalid"> | null => {
  const status = String(payment?.status ?? "").toUpperCase();

  if (status === "WAITING_FOR_PAYMENT" || status === "CHALLENGE") {
    return "waiting";
  }
  if (status === "PAID") return "success";
  if (status === "EXPIRED") return "expired";
  if (status === "FAILED" || status === "DENIED" || status === "CANCELLED") {
    return "failed";
  }

  return null;
};

const getMethodLabel = (payment?: CustomOrderPayment | null) => {
  if (!payment) return "-";

  const method = inferInstructionMethodFromPayment(payment);
  return (
    METHOD_LABEL[method] ??
    payment.midtransBank ??
    payment.midtransPaymentType ??
    payment.paymentType ??
    "-"
  );
};

const getPaymentStatusLabelId = (status?: string | null) => {
  const normalized = String(status ?? "").toUpperCase();

  if (normalized === "WAITING_FOR_PAYMENT") return "Menunggu Pembayaran";
  if (normalized === "CHALLENGE") return "Perlu Verifikasi";
  if (normalized === "PAID") return "Lunas";
  if (normalized === "EXPIRED") return "Kedaluwarsa";
  if (normalized === "FAILED") return "Gagal";
  if (normalized === "DENIED") return "Ditolak";
  if (normalized === "CANCELLED") return "Dibatalkan";

  return getPaymentStatusLabel(status);
};

export const PaymentStatusPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId")?.trim() ?? "";
  const stateParam = normalizeStateParam(searchParams.get("state"));
  const [pollingEnabled, setPollingEnabled] = useState(true);

  useEffect(() => {
    setPollingEnabled(true);
  }, [orderId]);

  const {
    data: order,
    error,
    isError,
    isLoading,
    refetch,
  } = useGetOrder(orderId || undefined, {
    enabled: Boolean(orderId) && pollingEnabled,
    refetchInterval:
      Boolean(orderId) && pollingEnabled ? POLLING_INTERVAL_MS : false,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const isNotFound = getApiErrorStatus(error) === 404;
  const latestDpPayment = useMemo(
    () => getLatestDpPayment(order?.payments),
    [order?.payments],
  );
  const paymentInstruction = useMemo(
    () => buildInstructionFromPayment(latestDpPayment),
    [latestDpPayment],
  );
  const computedState = useMemo<PaymentStatusPageState>(() => {
    if (!orderId || isNotFound) return "invalid";

    const paymentState = getStateFromDpPayment(latestDpPayment);
    if (paymentState) return paymentState;

    if (order?.status === "AWAITING_PRODUCTION") return "success";

    return stateParam ?? "waiting";
  }, [isNotFound, latestDpPayment, order?.status, orderId, stateParam]);
  const isTerminalState =
    computedState === "success" ||
    computedState === "expired" ||
    computedState === "failed" ||
    computedState === "invalid";
  const orderReference = order?.orderNumber?.trim() || orderId || "-";
  const statusLabel = latestDpPayment
    ? getPaymentStatusLabelId(latestDpPayment.status)
    : computedState === "success"
      ? "Lunas"
      : computedState === "expired"
        ? "Kedaluwarsa"
        : computedState === "failed"
          ? "Gagal"
          : "Menunggu Pembayaran";
  const statusBadgeClass = latestDpPayment
    ? getPaymentStatusBadgeClass(latestDpPayment.status)
    : computedState === "success"
      ? getPaymentStatusBadgeClass("PAID")
      : computedState === "expired"
        ? getPaymentStatusBadgeClass("EXPIRED")
        : computedState === "failed"
          ? getPaymentStatusBadgeClass("FAILED")
          : getPaymentStatusBadgeClass("WAITING_FOR_PAYMENT");
  const StatusIcon = latestDpPayment
    ? getPaymentStatusIcon(latestDpPayment.status)
    : computedState === "success"
      ? CheckCircle2
      : computedState === "waiting"
        ? Clock3
        : XCircle;
  const methodLabel = getMethodLabel(latestDpPayment);
  const paymentAmount = Number(
    latestDpPayment?.amount ?? order?.totalPaid ?? 0,
  );
  const paymentUrl = latestDpPayment?.paymentUrl?.trim() || "";

  useEffect(() => {
    if (!orderId || isNotFound || isTerminalState) {
      setPollingEnabled(false);
    }
  }, [isNotFound, isTerminalState, orderId]);

  useEffect(() => {
    if (!orderId || computedState === "invalid") return;
    if (stateParam === computedState) return;

    router.replace(
      `/payment-status?orderId=${encodeURIComponent(orderId)}&state=${computedState}`,
    );
  }, [computedState, orderId, router, stateParam]);

  const renderShell = (content: React.ReactNode) => (
    <section className="bg-background relative min-h-screen w-full overflow-hidden">
      <div className="dot-background absolute inset-0 opacity-50 dark:opacity-55" />
      <div className="bg-background pointer-events-none absolute inset-0 flex items-center justify-center mask-[radial-gradient(ellipse_at_center,transparent_30%,black)]" />

      <div className="relative z-20 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl">{content}</div>
      </div>
    </section>
  );

  if (!orderId) {
    return renderShell(
      <>
        <Card className="bg-card w-full max-w-xl rounded-2xl px-8 py-10 shadow-lg">
          <CardHeader className="p-0 text-center">
            <div className="bg-destructive/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive h-8 w-8" />
            </div>
            <CardTitle className="mt-6 text-2xl">
              Status pembayaran belum tersedia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-0 pt-4 text-center">
            <p className="text-muted-foreground text-sm">
              Informasi pembayaran sedang dimuat. Silakan coba beberapa saat
              lagi.
            </p>
            <Button className="w-full" onClick={() => router.push("/summary")}>
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </>,
    );
  }

  if (isLoading && !order) {
    return renderShell(
      <div className="space-y-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>,
    );
  }

  if (isError && !isNotFound && !order) {
    return renderShell(
      <>
        <Card className="bg-card w-full max-w-xl rounded-2xl px-8 py-10 shadow-lg">
          <CardHeader className="p-0 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-8 w-8 text-amber-700" />
            </div>
            <CardTitle className="mt-4">
              Status pembayaran belum tersedia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-0 pt-4 text-center">
            <p className="text-muted-foreground text-sm">
              Informasi pembayaran sedang dimuat. Silakan coba beberapa saat
              lagi.
            </p>
            <Button className="w-full" onClick={() => void refetch()}>
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </>,
    );
  }

  if (computedState === "invalid") {
    return renderShell(
      <>
        <Card className="bg-card w-full max-w-xl rounded-2xl px-8 py-10 shadow-lg">
          <CardHeader className="p-0 text-center">
            <div className="bg-destructive/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive h-8 w-8" />
            </div>
            <CardTitle className="mt-6 text-2xl">
              Status pembayaran belum tersedia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-0 pt-4 text-center">
            <p className="text-muted-foreground text-sm">
              Informasi pembayaran sedang dimuat. Silakan coba beberapa saat
              lagi.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button className="w-full" onClick={() => void refetch()}>
                Coba Lagi
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/summary")}
              >
                Kembali ke Ringkasan
              </Button>
            </div>
          </CardContent>
        </Card>
      </>,
    );
  }

  return renderShell(
    <div className="space-y-5">
      <Card className="ring-border/60 overflow-hidden border-0 shadow-sm ring-1">
        <CardHeader className="space-y-4 px-6 pt-6 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Status Pembayaran
              </p>
              <CardTitle className="mt-2 text-2xl">
                {computedState === "waiting"
                  ? "Menunggu konfirmasi pembayaran"
                  : computedState === "success"
                    ? "Pembayaran DP berhasil dikonfirmasi"
                    : computedState === "expired"
                      ? "Tagihan pembayaran kedaluwarsa"
                      : "Pembayaran tidak berhasil diselesaikan"}
              </CardTitle>
            </div>
            <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-2xl">
              {computedState === "success" ? (
                <CheckCircle2 className="text-primary h-7 w-7" />
              ) : computedState === "waiting" ? (
                <Clock3 className="text-primary h-7 w-7" />
              ) : (
                <XCircle className="text-primary h-7 w-7" />
              )}
            </div>
          </div>

          <p className="text-muted-foreground text-sm">
            {computedState === "waiting"
              ? "Selesaikan pembayaran menggunakan instruksi di bawah ini. Halaman ini akan diperbarui otomatis setiap beberapa detik."
              : computedState === "success"
                ? "Pembayaran DP Anda sudah tercatat lunas. Proses produksi dapat dilanjutkan dari sini."
                : computedState === "expired"
                  ? "Tagihan DP saat ini sudah kedaluwarsa. Kembali ke checkout untuk membuat pembayaran baru."
                  : "Pembayaran DP saat ini sudah tidak aktif. Kembali ke checkout untuk mencoba lagi."}
          </p>
        </CardHeader>

        <CardContent className="space-y-4 px-6 pb-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                Pesanan
              </p>
              <p className="mt-1 text-sm font-semibold">#{orderReference}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                Metode Pembayaran
              </p>
              <p className="mt-1 text-sm font-semibold">{methodLabel}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                Nominal
              </p>
              <p className="mt-1 text-sm font-semibold">
                {paymentAmount > 0 ? formatPrice(paymentAmount) : "-"}
              </p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                Status
              </p>
              <div className="mt-1">
                <span className={statusBadgeClass}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>

          {computedState === "waiting" && paymentInstruction ? (
            <PaymentInstruction value={paymentInstruction} />
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {computedState === "waiting" && paymentUrl ? (
              <Button
                className="w-full"
                onClick={() =>
                  window.open(paymentUrl, "_blank", "noopener,noreferrer")
                }
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Buka Halaman Pembayaran
              </Button>
            ) : null}

            {computedState === "waiting" ? (
              <Button
                variant={paymentUrl ? "outline" : "default"}
                className="w-full"
                onClick={() => void refetch()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Coba Lagi
              </Button>
            ) : null}

            {computedState === "success" ? (
              <Button
                className="w-full"
                onClick={() => router.push(`/dashboard/orders/${orderId}`)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Lihat Detail Pesanan
              </Button>
            ) : null}

            {computedState === "expired" || computedState === "failed" ? (
              <Button
                className="w-full"
                onClick={() => router.push(`/checkout?orderId=${orderId}`)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Kembali ke Checkout
              </Button>
            ) : null}

            {computedState !== "waiting" ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/dashboard/orders")}
              >
                Lihat Pesanan Saya
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>,
  );
};
