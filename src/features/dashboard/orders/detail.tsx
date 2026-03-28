"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Stepper } from "@/components/ui/stepper";
import useGetOrder from "@/hooks/api/order/useGetOrder";
import useGetProductionProgress from "@/hooks/api/production/useGetProductionProgress";
import useAxios from "@/hooks/useAxios";
import { formatPrice } from "@/lib/price";
import { getStatusBadgeClass, StatusTone } from "@/lib/statusStyles";
import { ProductComponent } from "@/types/componentProduct";
import { OrderStatus, PaymentPhase } from "@/types/customOrder";
import { ProductMaterial } from "@/types/materialProduct";
import { ProductBase } from "@/types/product";
import { downloadOrderInvoice } from "@/utils/generateInvoice";
import { useQueries } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Download,
  MapPin,
  Package,
  Ruler,
  Scroll,
  Truck,
  Weight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  getDefaultPhaseAmounts,
  PHASE_LABEL,
  phaseOrder,
} from "../billing/BillingDetail";
import { ProductionLog, ProductionLogCard } from "./admin/detail";

type OrderDetailPageProps = { orderId: string };

const statusLabel: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Waiting for Payment",
  AWAITING_PRODUCTION: "Awaiting Production",
  IN_PRODUCTION: "In Production",
  READY_TO_SHIP: "Ready to Ship",
  SHIPPED: "Shipped",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusTone: Record<OrderStatus, StatusTone> = {
  PENDING_PAYMENT: "warning",
  AWAITING_PRODUCTION: "warning",
  IN_PRODUCTION: "warning",
  READY_TO_SHIP: "info",
  SHIPPED: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
};

const orderStatusFlow: OrderStatus[] = [
  "PENDING_PAYMENT",
  "AWAITING_PRODUCTION",
  "IN_PRODUCTION",
  "READY_TO_SHIP",
  "SHIPPED",
  "COMPLETED",
];

const orderStatusDescription: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Waiting payment confirmation",
  AWAITING_PRODUCTION: "Queued for production",
  IN_PRODUCTION: "Furniture is being built",
  READY_TO_SHIP: "Packed and ready to hand over",
  SHIPPED: "On delivery to destination",
  COMPLETED: "Order finished successfully",
  CANCELLED: "Order has been cancelled",
};

const paymentPhaseByStatus: Record<OrderStatus, PaymentPhase> = {
  PENDING_PAYMENT: "DP",
  AWAITING_PRODUCTION: "PROGRESS_1",
  IN_PRODUCTION: "PROGRESS_1",
  READY_TO_SHIP: "PROGRESS_2",
  SHIPPED: "FINAL",
  COMPLETED: "FINAL",
  CANCELLED: "DP",
};

export const OrderDetailPage = ({ orderId }: OrderDetailPageProps) => {
  const router = useRouter();
  const axiosInstance = useAxios();
  const { data: order, isLoading, isError } = useGetOrder(orderId);
  const {
    data: productionProgress = [],
    isLoading: isProductionProgressLoading,
  } = useGetProductionProgress(orderId);

  // --- Logic (Unchanged) -----------------------------------------------------
  const grandTotalAmount = Number(order?.grandTotalPrice ?? 0);
  const totalPaidAmount = Number(order?.totalPaid ?? 0);
  const remainingAmount = Number(order?.remaining ?? 0);
  const defaultPhaseAmounts = getDefaultPhaseAmounts(grandTotalAmount);

  const statusStepperItems = useMemo(() => {
    if (order?.status === "CANCELLED") {
      return [
        {
          id: "CANCELLED",
          title: statusLabel.CANCELLED,
          description: orderStatusDescription.CANCELLED,
        },
      ];
    }

    return orderStatusFlow.map((status) => ({
      id: status,
      title: statusLabel[status],
      description: orderStatusDescription[status],
    }));
  }, [order?.status]);

  const currentStatusStep = useMemo(
    () =>
      order?.status === "CANCELLED"
        ? "CANCELLED"
        : (order?.status ?? "PENDING_PAYMENT"),
    [order?.status],
  );

  const latestPaymentByPhase = useMemo(() => {
    const map = new Map<
      PaymentPhase,
      { amount: number; status: string; createdAt: number }
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
      if (latestPaymentByPhase.get(phase)?.status.toUpperCase() === "PAID") {
        set.add(phase);
      }
    }
    return set;
  }, [latestPaymentByPhase]);

  const currentPaymentStep = useMemo<PaymentPhase>(() => {
    const statusPhase =
      paymentPhaseByStatus[order?.status ?? "PENDING_PAYMENT"];
    const statusIndex = phaseOrder.indexOf(statusPhase);

    const nextUnpaid = phaseOrder.find((phase) => !paidPhaseSet.has(phase));
    const unpaidIndex = nextUnpaid ? phaseOrder.indexOf(nextUnpaid) : -1;

    const isSettledByAmount =
      remainingAmount <= 0 ||
      (grandTotalAmount > 0 && totalPaidAmount >= grandTotalAmount);
    const isSettledByStatus =
      order?.status === "SHIPPED" || order?.status === "COMPLETED";
    if (isSettledByAmount || isSettledByStatus) return "FINAL";

    if (order?.status === "CANCELLED") {
      return order.currentPaymentPhase ?? statusPhase;
    }

    const activeIndex = Math.max(
      statusIndex,
      unpaidIndex >= 0 ? unpaidIndex : statusIndex,
    );
    return phaseOrder[activeIndex] ?? "DP";
  }, [
    grandTotalAmount,
    order?.currentPaymentPhase,
    order?.status,
    paidPhaseSet,
    remainingAmount,
    totalPaidAmount,
  ]);

  const paymentStepperItems = useMemo(
    () =>
      phaseOrder.map((phase) => ({
        id: phase,
        title: PHASE_LABEL[phase],
        description:
          paidPhaseSet.has(phase) || phase === currentPaymentStep
            ? formatPrice(phaseAmounts[phase])
            : "Planned",
      })),
    [currentPaymentStep, paidPhaseSet, phaseAmounts],
  );

  const componentIds = useMemo(
    () =>
      Array.from(
        new Set(
          (order?.items ?? []).flatMap((i) =>
            (i.components ?? []).map((c) => c.componentId),
          ),
        ),
      ),
    [order?.items],
  );
  const productIds = useMemo(
    () => Array.from(new Set((order?.items ?? []).map((i) => i.productBaseId))),
    [order?.items],
  );
  const materialIds = useMemo(
    () =>
      Array.from(
        new Set((order?.items ?? []).map((i) => i.materialId).filter(Boolean)),
      ),
    [order?.items],
  );

  const productQueries = useQueries({
    queries: productIds.map((id) => ({
      queryKey: ["product", id],
      queryFn: async () =>
        (await axiosInstance.get(`/product/${id}`)).data?.data ??
        (await axiosInstance.get(`/product/${id}`)).data,
      enabled: !!id,
      staleTime: 300000,
    })),
  });
  const materialQueries = useQueries({
    queries: materialIds.map((id) => ({
      queryKey: ["material", id],
      queryFn: async () =>
        (await axiosInstance.get(`/product/material/${id}`)).data?.data ??
        (await axiosInstance.get(`/product/material/${id}`)).data,
      enabled: !!id,
      staleTime: 300000,
    })),
  });
  const componentQueries = useQueries({
    queries: componentIds.map((id) => ({
      queryKey: ["component", id],
      queryFn: async () =>
        (await axiosInstance.get(`/product/component/${id}`)).data?.data ??
        (await axiosInstance.get(`/product/component/${id}`)).data,
      enabled: !!id,
      staleTime: 300000,
    })),
  });

  // -- Lookup Maps (Fixed TypeScript Errors) ------------------------------------

  const productById = useMemo(() => {
    const entries = productQueries
      .map((q) => (q.data?.id ? ([q.data.id, q.data] as const) : null))
      .filter((entry): entry is [string, ProductBase] => entry !== null);
    return new Map<string, ProductBase>(entries);
  }, [productQueries]);

  const materialById = useMemo(() => {
    const entries = materialQueries
      .map((q) => (q.data?.id ? ([q.data.id, q.data] as const) : null))
      .filter((entry): entry is [string, ProductMaterial] => entry !== null);
    return new Map<string, ProductMaterial>(entries);
  }, [materialQueries]);

  const componentById = useMemo(() => {
    const entries = componentQueries
      .map((q) => (q.data?.id ? ([q.data.id, q.data] as const) : null))
      .filter((entry): entry is [string, ProductComponent] => entry !== null);
    return new Map<string, ProductComponent>(entries);
  }, [componentQueries]);

  const productionLogs = useMemo<ProductionLog[]>(
    () =>
      productionProgress.map((p) => ({
        id: p.id,
        progressPercent: p.percentage,
        description: p.description,
        createdAt: p.createdAt,
        photos: p.photoUrls ?? [],
      })),
    [productionProgress],
  );

  useEffect(() => {
    if (order?.status === "PENDING_PAYMENT")
      router.replace(`/dashboard/billing?orderId=${order.id}`);
  }, [order?.id, order?.status, router]);

  // --- Loading State (Fixed Width Sync) --------------------------------------
  if (isLoading) {
    return (
      <div className="mx-auto w-full px-4 pb-20">
        {/* --- Breadcrumb & Actions Skeleton --- */}
        <div className="flex flex-col gap-6">
          <div className="py-2">
            <Skeleton className="h-5 w-28" />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-48 sm:w-64" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-md sm:w-32" />
          </div>
        </div>

        <Separator className="my-8" />

        {/* --- Order Timeline Skeleton --- */}
        <section className="mb-10">
          <div className="mb-6 flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="bg-card/50 rounded-2xl border p-6">
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </section>

        {/* --- Payment Timeline Skeleton --- */}
        <section className="mb-10">
          <div className="mb-6 flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="bg-card/50 rounded-2xl border p-6">
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </section>

        {/* --- Financial Grid Skeleton --- */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>

        {/* --- Main Content Grid (Two Columns) --- */}
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left: Items */}
          <div className="space-y-8 lg:col-span-3">
            <section>
              <div className="mb-4 flex justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
              </div>
            </section>
          </div>

          {/* Right: Specs & Shipping */}
          <div className="space-y-6 lg:col-span-2">
            <section className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </section>
            <section className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto px-4 py-12 text-center">
        <div className="bg-destructive/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full">
          <Package className="text-destructive h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold">Order Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">
          We couldn't retrieve the details for this order.
        </p>
        <Button
          onClick={() => router.push("/dashboard/orders")}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
        </Button>
      </div>
    );
  }

  const address = order.snapShotAddress;
  const deliveryDistance = Number(
    order.deliveryDistance ?? order.deliveryDistancce ?? 0,
  );
  const totalWeightKg = Number(order.totalWeight ?? 0) / 1000;
  const displayOrderNumber = order.orderNumber?.trim() || order.id;
  const previewImage =
    (order as any)?.previewImage ||
    (order as any)?.previewUrl ||
    order.designSnapShot?.previewImage ||
    order.designSnapShot?.previewUrl;

  const handleDownloadInvoice = async () => {
    await downloadOrderInvoice({ ...order, items: order.items ?? [] });
  };

  return (
    <div className="mx-auto w-full px-4 pb-20">
      {/* --- Breadcrumb & Actions --- */}
      <div className="flex flex-col gap-6">
        <button
          onClick={() => router.push("/dashboard/orders")}
          className="group text-muted-foreground hover:text-foreground flex w-fit items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Orders
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            {previewImage && (
              <div className="bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border shadow-inner">
                <img
                  src={previewImage}
                  alt="Order Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold tracking-tight">
                  #{displayOrderNumber}
                </h1>
                <Badge
                  className={`px-2.5 py-0.5 shadow-sm ${getStatusBadgeClass(statusTone[order.status])}`}
                >
                  {statusLabel[order.status]}
                </Badge>
              </div>
              <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
          <Button
            onClick={handleDownloadInvoice}
            variant="secondary"
            className="w-full shadow-sm sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" /> Invoice
          </Button>
        </div>
      </div>

      <Separator className="my-8" />

      {/* --- Order Status Stepper --- */}
      <section className="mb-10">
        <div className="mb-6 flex items-center gap-2">
          <div className="bg-primary h-1.5 w-1.5 rounded-full" />
          <h2 className="text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase">
            Order Timeline
          </h2>
        </div>
        <div className="bg-card/50 rounded-2xl border p-6 shadow-sm backdrop-blur-sm">
          <Stepper
            steps={statusStepperItems}
            currentStep={currentStatusStep}
            orientation="horizontal"
          />
        </div>
      </section>

      {/* --- Payment Stepper --- */}
      <section className="mb-10">
        <div className="mb-6 flex items-center gap-2">
          <div className="bg-primary h-1.5 w-1.5 rounded-full" />
          <h2 className="text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase">
            Payment Timeline
          </h2>
        </div>
        <div className="bg-card/50 rounded-2xl border p-6 shadow-sm backdrop-blur-sm">
          <Stepper
            steps={paymentStepperItems}
            currentStep={currentPaymentStep}
            orientation="horizontal"
          />
        </div>
      </section>

      {/* --- Financial Grid --- */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Grand Total",
            value: grandTotalAmount,
            color: "text-foreground",
          },
          {
            label: "Total Paid",
            value: totalPaidAmount,
            color: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Remaining",
            value: remainingAmount,
            color:
              remainingAmount > 0 ? "text-orange-600" : "text-muted-foreground",
            highlight: remainingAmount > 0,
          },
        ].map((item, i) => (
          <Card
            key={i}
            className={`overflow-hidden border-none shadow-sm ${item.highlight ? "bg-orange-50/30 ring-1 ring-orange-200 dark:bg-orange-950/10 dark:ring-orange-900/20" : "bg-muted/30"}`}
          >
            <CardHeader className="p-5 pb-2">
              <CardDescription className="text-xs font-bold tracking-wider uppercase">
                {item.label}
              </CardDescription>
              <CardTitle className={`text-xl font-black ${item.color}`}>
                {formatPrice(item.value)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div
                className={`h-1 w-full rounded-full bg-current opacity-10 ${item.color}`}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* --- Left Column: Items --- */}
        <div className="space-y-8 lg:col-span-3">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-muted-foreground text-sm font-bold tracking-widest uppercase">
                Ordered Items
              </h2>
              <Badge variant="outline" className="rounded-full">
                {order.items.length} Units
              </Badge>
            </div>

            <div className="space-y-3">
              {order.items.map((item, idx) => {
                const product = productById.get(item.productBaseId);
                const material = item.materialId
                  ? materialById.get(item.materialId)
                  : null;
                return (
                  <div
                    key={item.id}
                    className="group bg-card overflow-hidden rounded-2xl border transition-all hover:shadow-md"
                  >
                    <div className="flex gap-4 p-4">
                      <div className="bg-muted h-16 w-16 shrink-0 overflow-hidden rounded-lg border">
                        <img
                          src={product?.images?.[0] || undefined}
                          alt={product?.productName ?? "Product image"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between py-0.5">
                        <div>
                          <h3 className="group-hover:text-primary text-sm leading-tight font-bold transition-colors">
                            {product?.productName || "Product Item"}
                          </h3>
                          {material && (
                            <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                              <span className="bg-primary/40 inline-block h-2 w-2 rounded-full" />
                              {material.materialName}
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-black">
                          {formatPrice(item.itemTotalPrice)}
                        </p>
                      </div>
                    </div>

                    {item.components?.length > 0 && (
                      <div className="bg-muted/20 border-t p-3 px-4">
                        <div className="space-y-1.5">
                          {item.components.map((compRef) => {
                            const cData = componentById.get(
                              compRef.componentId,
                            );
                            return (
                              <div
                                key={compRef.id}
                                className="flex items-center justify-between text-[11px]"
                              >
                                <span className="text-muted-foreground flex items-center gap-2">
                                  <Package className="h-3 w-3" />
                                  {cData?.componentName || "Component"}
                                  <span className="font-bold">
                                    ×{compRef.quantity}
                                  </span>
                                </span>
                                <span className="font-medium">
                                  {formatPrice(compRef.lockedSubTotal)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-muted-foreground mb-4 text-sm font-bold tracking-widest uppercase">
              Production Log
            </h2>
            <Card className="overflow-hidden border-dashed shadow-sm">
              <CardContent className="p-6">
                {isProductionProgressLoading ? (
                  <div className="space-y-6">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : productionLogs.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Scroll className="text-muted-foreground/20 mb-3 h-10 w-10" />
                    <p className="text-muted-foreground text-sm font-medium">
                      No logs recorded yet
                    </p>
                  </div>
                ) : (
                  <div className="relative space-y-0 pl-2">
                    <div className="bg-muted absolute top-2 bottom-2 left-[1.3rem] w-0.5" />
                    {productionLogs.map((log, i) => (
                      <ProductionLogCard key={log.id} log={log} index={i} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* --- Right Column: Metadata & Address --- */}
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-4">
            <h2 className="text-muted-foreground text-sm font-bold tracking-widest uppercase">
              Specifications
            </h2>
            <Card className="bg-muted/30 border-none shadow-none">
              <CardContent className="space-y-4 p-5">
                {[
                  { icon: Truck, label: "Delivery", value: order.deliveryType },
                  {
                    icon: Weight,
                    label: "Weight",
                    value: `${totalWeightKg.toFixed(2)} kg`,
                  },
                  {
                    icon: Ruler,
                    label: "Distance",
                    value: `${deliveryDistance} km`,
                  },
                  {
                    icon: CreditCard,
                    label: "Current Phase",
                    value: order.currentPaymentPhase || "N/A",
                  },
                ].map((spec, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="text-muted-foreground flex items-center gap-3 text-sm">
                      <spec.icon className="h-4 w-4" />
                      {spec.label}
                    </div>
                    <span className="text-sm font-bold">{spec.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {order.deliveryType === "DELIVERY" && address && (
            <section className="space-y-4">
              <h2 className="text-muted-foreground text-sm font-bold tracking-widest uppercase">
                Shipping To
              </h2>
              <Card className="bg-primary/3 ring-primary/10 overflow-hidden border-none shadow-sm ring-1">
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">
                        {address.recipientName}
                      </p>
                      <p className="text-muted-foreground mb-3 text-xs">
                        {address.phoneNumber}
                      </p>
                      <div className="text-muted-foreground space-y-1 text-xs leading-relaxed">
                        <p>
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ""}
                        </p>
                        <p>
                          {address.district}, {address.city}
                        </p>
                        <p>
                          {address.province}, {address.postalCode}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
