"use client";

import { useQueries } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Box,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  CreditCard,
  Image as ImageIcon,
  MapPin,
  Package,
  Ruler,
  Scroll,
  Truck,
  Wallet,
  Weight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useGetAdminOrder from "@/hooks/api/order/useGetAdminOrder";
import useGetProductionProgress from "@/hooks/api/production/useGetProductionProgress";
import {
  getOrderStatusDotClass,
  getOrderStatusLabel,
  getOrderStatusPillClass,
} from "@/lib/orderStatus";
import {
  deliveryTypeUsesAddress,
  formatDeliveryDistance,
  getDeliveryTypeLabel,
} from "@/lib/deliveryType";
import useAxios from "@/hooks/useAxios";
import { formatPrice } from "@/lib/price";
import { ProductComponent } from "@/types/componentProduct";
import { ProductMaterial } from "@/types/materialProduct";
import { ProductBase } from "@/types/product";

type AdminOrderDetailPageProps = {
  orderId: string;
};

export type ProductionLog = {
  id: string;
  progressPercent: number;
  description: string;
  createdAt: string;
  photos: string[];
};

export function formatLogDate(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (isToday) return `Hari ini, ${time}`;
  if (isYesterday) return `Kemarin, ${time}`;
  return `${date.toLocaleDateString("id-ID")}, ${time}`;
}

function ProgressRing({ value }: { value: number }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
  const size = 56;
  const stroke = 5;
  const center = size / 2;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (safeValue / 100) * circ;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border"
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-700"
        />
      </svg>
      <span className="text-md text-foreground leading-none font-bold">
        {safeValue}%
      </span>
    </div>
  );
}

function PhotoLightbox({
  photos,
  initialIndex,
  onClose,
}: {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photos[idx]}
          alt={`foto ${idx + 1}`}
          className="max-h-[80vh] w-full rounded-2xl object-contain shadow-2xl"
        />
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            size="icon"
            variant="secondary"
            disabled={idx === 0}
            onClick={() => setIdx((i) => i - 1)}
            className="rounded-full"
          >
            ‹
          </Button>
          <span className="text-sm font-medium text-white/80">
            {idx + 1} / {photos.length}
          </span>
          <Button
            size="icon"
            variant="secondary"
            disabled={idx === photos.length - 1}
            onClick={() => setIdx((i) => i + 1)}
            className="rounded-full"
          >
            ›
          </Button>
        </div>
        <Button
          className="absolute top-3 right-3 rounded-full"
          size="icon"
          variant="secondary"
          onClick={onClose}
        >
          ✕
        </Button>
      </div>
    </div>
  );
}

export function ProductionLogCard({
  log,
  index,
}: {
  log: ProductionLog;
  index: number;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  return (
    <>
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={log.photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
      <div className="relative flex gap-4">
        {/* Timeline stem */}
        <div className="flex flex-col items-center">
          <div className="bg-background ring-background flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-4">
            <ProgressRing value={log.progressPercent} />
          </div>
        </div>

        <div className="flex-1 pb-6">
          <div className="bg-card rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-snug font-semibold">
                {log.description}
              </p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  log.progressPercent === 100
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                    : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                }`}
              >
                {log.progressPercent}%
              </span>
            </div>

            <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                {formatLogDate(log.createdAt)}
              </span>
              {log.photos.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  {log.photos.length} foto terlampir
                </span>
              )}
            </div>

            {log.photos.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {log.photos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className="group bg-muted relative aspect-square overflow-hidden rounded-lg border"
                  >
                    <img
                      src={url}
                      alt={`foto ${i + 1}`}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export const AdminOrderDetailPage = ({
  orderId,
}: AdminOrderDetailPageProps) => {
  const router = useRouter();
  const axiosInstance = useAxios();
  const { data: order, isLoading, isError } = useGetAdminOrder(orderId);
  const {
    data: productionProgress = [],
    isLoading: isProductionProgressLoading,
  } = useGetProductionProgress(orderId);

  const items = order?.items ?? [];
  const productionLogs = useMemo<ProductionLog[]>(
    () =>
      productionProgress.map((progress) => ({
        id: progress.id,
        progressPercent: progress.percentage,
        description: progress.description,
        createdAt: progress.createdAt,
        photos: progress.photoUrls ?? [],
      })),
    [productionProgress],
  );

  const componentIds = useMemo(
    () =>
      Array.from(
        new Set(
          items.flatMap((item) =>
            (item.components ?? []).map((c) => c.componentId),
          ),
        ),
      ),
    [items],
  );
  const productIds = useMemo(
    () => Array.from(new Set(items.map((item) => item.productBaseId))),
    [items],
  );
  const materialIds = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((item) => item.materialId)
            .filter((id): id is string => Boolean(id)),
        ),
      ),
    [items],
  );

  const productQueries = useQueries({
    queries: productIds.map((id) => ({
      queryKey: ["admin-product", id],
      queryFn: async () => {
        const { data } = await axiosInstance.get(`/product/${id}`);
        return ((data as { data?: ProductBase })?.data ?? data) as ProductBase;
      },
      enabled: Boolean(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const materialQueries = useQueries({
    queries: materialIds.map((id) => ({
      queryKey: ["admin-material", id],
      queryFn: async () => {
        const { data } = await axiosInstance.get(`/product/material/${id}`);
        return ((data as { data?: ProductMaterial })?.data ??
          data) as ProductMaterial;
      },
      enabled: Boolean(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const componentQueries = useQueries({
    queries: componentIds.map((id) => ({
      queryKey: ["admin-component", id],
      queryFn: async () => {
        const { data } = await axiosInstance.get(`/product/component/${id}`);
        return ((data as { data?: ProductComponent })?.data ??
          data) as ProductComponent;
      },
      enabled: Boolean(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const productById = useMemo(() => {
    const map = new Map<string, ProductBase>();
    productQueries.forEach((q) => {
      if (q.data?.id) map.set(q.data.id, q.data);
    });
    return map;
  }, [productQueries]);

  const materialById = useMemo(() => {
    const map = new Map<string, ProductMaterial>();
    materialQueries.forEach((q) => {
      if (q.data?.id) map.set(q.data.id, q.data);
    });
    return map;
  }, [materialQueries]);

  const componentById = useMemo(() => {
    const map = new Map<string, ProductComponent>();
    componentQueries.forEach((q) => {
      if (q.data?.id) map.set(q.data.id, q.data);
    });
    return map;
  }, [componentQueries]);

  if (isLoading) {
    return (
      <section className="w-full space-y-5">
        <div className="relative overflow-hidden rounded-2xl border p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-40" />
                </div>
              </div>
              <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-6 w-40 rounded-full" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-4">
              <Skeleton className="mb-3 h-8 w-8 rounded-lg" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-6 w-24" />
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border p-5 shadow-sm">
            <Skeleton className="mb-4 h-3 w-36" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="mt-2 h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border p-5 shadow-sm">
            <Skeleton className="mb-4 h-3 w-28" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-44" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
          <div className="space-y-4 p-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-16 w-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border shadow-sm">
          <div className="border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
          <div className="space-y-4 p-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 rounded-xl border p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError || !order) {
    return (
      <div className="bg-card flex flex-col items-center justify-center gap-4 rounded-2xl border p-16 text-center">
        <AlertCircle className="text-muted-foreground h-10 w-10" />
        <div>
          <p className="text-base font-semibold">Order tidak ditemukan</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Order mungkin sudah dihapus atau ID tidak valid.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/admin/orders")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Kembali ke Orders
        </Button>
      </div>
    );
  }

  const orderRef = order.orderNumber?.trim() || order.id;
  const address = order.snapShotAddress;
  const deliveryDistance = Number(
    order.deliveryDistance ?? order.deliveryDistancce ?? 0,
  );
  const usesAddress = deliveryTypeUsesAddress(order.deliveryType);
  const totalWeightKg = Number(order.totalWeight ?? 0) / 1000;
  return (
    <section className="w-full space-y-5">
      {/* ── HERO HEADER ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border shadow-sm">
        {/* subtle top accent stripe */}
        <div className="from-primary/60 via-primary to-primary/60 absolute inset-x-0 top-0 h-1 bg-linear-to-r" />

        <div className="px-6 pt-6 pb-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              {/* back + order number */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => router.push("/dashboard/admin/orders")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                    Order ID
                  </p>
                  <h1 className="text-xl leading-tight font-bold tracking-tight">
                    {orderRef}
                  </h1>
                </div>
              </div>

              {/* meta row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* status pill */}
                <span className={getOrderStatusPillClass(order.status)}>
                  <span className={getOrderStatusDotClass(order.status)} />
                  {getOrderStatusLabel(order.status)}
                </span>

                {/* timestamp */}
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Clock3 className="h-3.5 w-3.5" />
                  {new Date(order.createdAt).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <Button
              size="default"
              className="gap-2 self-start rounded-xl font-semibold shadow-sm"
              onClick={() =>
                router.push(`/dashboard/admin/orders/${order.id}/process`)
              }
            >
              Process Order
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── FINANCIAL SUMMARY ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Grand Total",
            value: formatPrice(Number(order.grandTotalPrice ?? 0)),
            icon: CreditCard,
            emphasis: true,
          },
          {
            label: "Total Paid",
            value: formatPrice(Number(order.totalPaid ?? 0)),
            icon: CheckCircle2,
            emphasis: false,
          },
          {
            label: "Remaining",
            value: formatPrice(Number(order.remaining ?? 0)),
            icon: Wallet,
            emphasis: Number(order.remaining ?? 0) > 0,
          },
          {
            label: "Total Items",
            value: `${order.items.length} item`,
            icon: Package,
            emphasis: false,
          },
        ].map(({ label, value, icon: Icon, emphasis }) => (
          <div
            key={label}
            className={`rounded-2xl border p-4 transition-shadow hover:shadow-sm ${
              emphasis ? "border-primary/20 bg-primary/10" : "bg-card"
            }`}
          >
            <div
              className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${
                emphasis ? "bg-primary/15" : "bg-muted"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${emphasis ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>
            <p
              className={`text-xs font-medium ${emphasis ? "text-primary/80" : "text-muted-foreground"}`}
            >
              {label}
            </p>
            <p
              className={`mt-0.5 text-lg leading-tight font-bold ${emphasis ? "text-foreground" : ""}`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── ORDER META + ADDRESS (side by side on lg) ─────── */}
      <div
        className={`grid gap-4 ${usesAddress && address ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}
      >
        {/* Order Info */}
        <div className="bg-card rounded-2xl border p-5 shadow-sm">
          <p className="text-muted-foreground mb-4 text-xs font-bold tracking-widest uppercase">
            Order Information
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Payment Phase",
                value: order.currentPaymentPhase ?? "-",
                icon: CreditCard,
              },
              {
                label: "Delivery Type",
                value: getDeliveryTypeLabel(order.deliveryType),
                icon: Truck,
              },
              {
                label: "Total Weight",
                value: `${totalWeightKg.toFixed(2)} kg`,
                icon: Weight,
              },
              {
                label: "Distance",
                value: formatDeliveryDistance(
                  order.deliveryType,
                  deliveryDistance,
                ),
                icon: Ruler,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="bg-muted/40 flex items-center gap-3 rounded-xl px-3 py-2.5"
              >
                <div className="bg-background flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border">
                  <Icon className="text-muted-foreground h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                    {label}
                  </p>
                  <p className="text-sm font-semibold">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        {usesAddress && address && (
          <div className="bg-card rounded-2xl border p-5 shadow-sm">
            <p className="text-muted-foreground mb-4 text-xs font-bold tracking-widest uppercase">
              Delivery Address
            </p>
            <div className="flex gap-3">
              <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <MapPin className="text-primary h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold">
                  {address.recipientName}
                  <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                    ({address.phoneNumber})
                  </span>
                </p>
                <p className="text-muted-foreground text-sm">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                </p>
                <p className="text-muted-foreground text-sm">
                  {address.subdistrict ? `${address.subdistrict}, ` : ""}
                  {address.district ? `${address.district}, ` : ""}
                  {address.city}, {address.province}
                </p>
                <p className="text-muted-foreground text-sm">
                  {address.country} {address.postalCode}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── ORDER ITEMS ──────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border shadow-sm">
        {/* section header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-xl">
              <Box className="text-primary h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Order Items</h2>
              <p className="text-muted-foreground text-xs">
                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y">
          {order.items.length === 0 ? (
            <p className="text-muted-foreground px-6 py-8 text-center text-sm">
              Tidak ada item.
            </p>
          ) : (
            order.items.map((item, index) => {
              const product = productById.get(item.productBaseId);
              const material = item.materialId
                ? materialById.get(item.materialId)
                : undefined;

              return (
                <div
                  key={item.id}
                  className="hover:bg-muted/20 px-6 py-5 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Product image */}
                    <div className="bg-muted h-16 w-16 shrink-0 overflow-hidden rounded-xl border shadow-sm">
                      {product?.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.productName ?? "Product"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="text-muted-foreground/40 h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Name + price */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-foreground font-bold">
                            {product?.productName ?? `Item ${index + 1}`}
                          </p>
                          {material && (
                            <div className="mt-1 flex items-center gap-1.5">
                              {material.materialUrl && (
                                <img
                                  src={material.materialUrl}
                                  alt={material.materialName}
                                  className="h-4 w-4 rounded-sm border object-cover"
                                />
                              )}
                              <span className="text-muted-foreground text-xs">
                                {material.materialName}
                                {material.materialSku && (
                                  <span className="ml-1 opacity-50">
                                    · {material.materialSku}
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-primary shrink-0 text-base font-extrabold">
                          {formatPrice(item.itemTotalPrice)}
                        </p>
                      </div>

                      {/* Price breakdown pill */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="bg-muted inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs">
                          <span className="text-muted-foreground">Base</span>
                          <span className="font-semibold">
                            {formatPrice(item.lockedBasePrice)}
                          </span>
                        </span>
                        <span className="bg-muted inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs">
                          <span className="text-muted-foreground">
                            Material
                          </span>
                          <span className="font-semibold">
                            {formatPrice(item.lockedMaterialPrice)}
                          </span>
                        </span>
                      </div>

                      {/* Components */}
                      {item.components.length > 0 && (
                        <div className="mt-4">
                          <p className="text-muted-foreground mb-2 text-[10px] font-bold tracking-widest uppercase">
                            Components ({item.components.length})
                          </p>
                          <div className="divide-y overflow-hidden rounded-xl border">
                            {item.components.map((component) => {
                              const comp = componentById.get(
                                component.componentId,
                              );
                              return (
                                <div
                                  key={component.id}
                                  className="bg-muted/20 hover:bg-muted/40 flex items-center justify-between gap-2 px-3 py-2.5 transition-colors"
                                >
                                  <div className="flex min-w-0 items-center gap-2.5">
                                    {comp?.componentImageUrls?.[0] && (
                                      <img
                                        src={comp.componentImageUrls[0]}
                                        alt={comp.componentName ?? "Component"}
                                        className="h-7 w-7 shrink-0 rounded-lg border object-cover"
                                      />
                                    )}
                                    <span className="text-foreground truncate text-xs font-medium">
                                      {comp?.componentName ??
                                        component.componentId}
                                    </span>
                                    <span className="bg-muted text-muted-foreground shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold">
                                      ×{component.quantity}
                                    </span>
                                  </div>
                                  <span className="shrink-0 text-xs font-bold">
                                    {formatPrice(component.lockedSubTotal)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── PRODUCTION LOG (timeline) ────────────────────────── */}
      <div className="bg-card rounded-2xl border shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-xl">
              <Scroll className="text-primary h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Production Log</h2>
              <p className="text-muted-foreground text-xs">
                {productionLogs.length} entri tercatat
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {isProductionProgressLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 rounded-xl border p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="mt-2 h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : productionLogs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-2xl">
                <Scroll className="text-muted-foreground/50 h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Belum ada log produksi</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Log akan muncul setelah proses produksi dimulai.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* vertical line */}
              <div className="bg-border/70 absolute top-5 bottom-5 left-6 w-1" />
              <div className="space-y-0">
                {productionLogs.map((log, i) => (
                  <ProductionLogCard key={log.id} log={log} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
