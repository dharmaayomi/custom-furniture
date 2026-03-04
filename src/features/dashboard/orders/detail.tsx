"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import useGetOrder from "@/hooks/api/order/useGetOrder";
import useAxios from "@/hooks/useAxios";
import { formatPrice } from "@/lib/price";
import { getStatusBadgeClass, StatusTone } from "@/lib/statusStyles";
import { OrderStatus } from "@/types/customOrder";
import { ProductComponent } from "@/types/componentProduct";
import { ProductBase } from "@/types/product";
import { ProductMaterial } from "@/types/materialProduct";
import { ArrowLeft, Box, Download, MapPin, Package, Ruler, Truck } from "lucide-react";
import { downloadOrderInvoice } from "@/utils/generateInvoice";

// ─── Constants ──────────────────────────────────────────────────────────────

const statusLabel: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Waiting for Payment",
  IN_PRODUCTION: "In Production",
  READY_TO_SHIP: "Ready to Ship",
  SHIPPED: "Shipped",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusTone: Record<OrderStatus, StatusTone> = {
  PENDING_PAYMENT: "warning",
  IN_PRODUCTION: "warning",
  READY_TO_SHIP: "info",
  SHIPPED: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
};

// ─── Types ───────────────────────────────────────────────────────────────────

type OrderDetailPageProps = {
  orderId: string;
};

// ─── Component ───────────────────────────────────────────────────────────────

export const OrderDetailPage = ({ orderId }: OrderDetailPageProps) => {
  const router = useRouter();
  const axiosInstance = useAxios();
  const { data: order, isLoading, isError } = useGetOrder(orderId);

  // ── Derived IDs ──────────────────────────────────────────────────────────

  const componentIds = useMemo(
    () =>
      Array.from(
        new Set(
          (order?.items ?? []).flatMap((item) =>
            (item.components ?? []).map((c) => c.componentId),
          ),
        ),
      ),
    [order?.items],
  );

  const productIds = useMemo(
    () =>
      Array.from(
        new Set((order?.items ?? []).map((item) => item.productBaseId)),
      ),
    [order?.items],
  );

  const materialIds = useMemo(
    () =>
      Array.from(
        new Set(
          (order?.items ?? [])
            .map((item) => item.materialId)
            .filter((id): id is string => Boolean(id)),
        ),
      ),
    [order?.items],
  );

  // ── Queries ──────────────────────────────────────────────────────────────

  const productQueries = useQueries({
    queries: productIds.map((id) => ({
      queryKey: ["product", id],
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
      queryKey: ["material", id],
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
      queryKey: ["component", id],
      queryFn: async () => {
        const { data } = await axiosInstance.get(`/product/component/${id}`);
        return ((data as { data?: ProductComponent })?.data ??
          data) as ProductComponent;
      },
      enabled: Boolean(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // ── Lookup Maps ──────────────────────────────────────────────────────────

  const componentById = useMemo(() => {
    const map = new Map<string, ProductComponent>();
    componentQueries.forEach((q) => {
      if (q.data?.id) map.set(q.data.id, q.data);
    });
    return map;
  }, [componentQueries]);

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

  // ── Side-effects ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (order?.status !== "PENDING_PAYMENT") return;
    router.replace(`/dashboard/billing?orderId=${order.id}`);
  }, [order?.id, order?.status, router]);

  // ── States ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Order not found</CardTitle>
          <CardDescription>
            We couldn&apos;t load this order. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/orders")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (order.status === "PENDING_PAYMENT") {
    return (
      <Card className="border-yellow-200/60 bg-yellow-50/60 dark:border-yellow-900/30 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle>Redirecting to Billing…</CardTitle>
          <CardDescription>
            Pending-payment orders are handled in Billing.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // ── Derived display values ────────────────────────────────────────────────

  const displayOrderNumber = order.orderNumber?.trim() || order.id;

  const previewImage =
    (order as unknown as { previewImage?: string; previewUrl?: string })
      ?.previewImage ||
    (order as unknown as { previewImage?: string; previewUrl?: string })
      ?.previewUrl ||
    order.designSnapShot?.previewImage ||
    order.designSnapShot?.previewUrl;

  const handleDownloadInvoice = async () => {
    await downloadOrderInvoice({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      deliveryType: order.deliveryType,
      trackNumber: order.trackNumber ?? null,
      totalWeight: order.totalWeight ?? 0,
      deliveryDistance: order.deliveryDistance ?? 0,
      deliveryDistancce: order.deliveryDistancce ?? 0,
      subtotalPrice: order.subtotalPrice ?? 0,
      deliveryFee: order.deliveryFee ?? 0,
      grandTotalPrice: order.grandTotalPrice ?? 0,
      snapShotAddress: order.snapShotAddress ?? null,
      items: (order.items ?? []).map((item) => ({
        id: item.id,
        productBaseId: item.productBaseId,
        materialId: item.materialId ?? null,
        itemTotalPrice: item.itemTotalPrice,
        lockedBasePrice: item.lockedBasePrice,
        lockedMaterialPrice: item.lockedMaterialPrice,
        components: (item.components ?? []).map((component) => ({
          id: component.id,
          componentId: component.componentId,
          quantity: component.quantity,
          lockedSubTotal: component.lockedSubTotal,
        })),
      })),
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Back Nav ──────────────────────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground -ml-1 gap-1.5"
        onClick={() => router.push("/dashboard/orders")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Button>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-muted-foreground mb-1 text-sm font-medium tracking-wide uppercase">
            Order
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            #{displayOrderNumber}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {new Date(order.createdAt).toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex items-start gap-3">
          <Button variant="outline" size="sm" onClick={handleDownloadInvoice}>
            <Download className="mr-1.5 h-4 w-4" />
            Download Invoice
          </Button>
          <Badge
            className={`h-fit px-3 py-1.5 text-sm font-semibold ${getStatusBadgeClass(statusTone[order.status])}`}
          >
            {statusLabel[order.status]}
          </Badge>
          {previewImage && (
            <div className="overflow-hidden rounded-lg border shadow-sm">
              <img
                src={previewImage}
                alt="Design preview"
                className="h-16 w-24 object-cover"
              />
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* ── Shipping + Summary Grid ───────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Shipping & Logistics */}
        <Card className="border py-3">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-md">
                <Truck className="text-muted-foreground h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold">
                Shipping & Logistics
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <ShippingRow
                icon={<Truck className="h-3.5 w-3.5" />}
                label="Delivery Type"
                value={order.deliveryType}
              />
              <ShippingRow
                icon={<Package className="h-3.5 w-3.5" />}
                label="Track Number"
                value={order.trackNumber ?? "—"}
              />
              <ShippingRow
                icon={<Box className="h-3.5 w-3.5" />}
                label="Total Weight"
                value={`${(Number(order.totalWeight ?? 0) / 1000).toFixed(2)} kg`}
              />
              <ShippingRow
                icon={<Ruler className="h-3.5 w-3.5" />}
                label="Delivery Distance"
                value={`${Number(order.deliveryDistance ?? order.deliveryDistancce ?? 0)} km`}
              />
            </dl>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="bg-primary/3 dark:bg-primary/6 border py-3">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md">
                <Package className="text-primary h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold">
                Order Summary
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {formatPrice(Number(order.subtotalPrice ?? 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="font-medium">
                  {formatPrice(Number(order.deliveryFee ?? 0))}
                </span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Grand Total</span>
                <span className="text-primary text-lg font-bold">
                  {formatPrice(Number(order.grandTotalPrice ?? 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Delivery Address ──────────────────────────────────────────────── */}
      {order.deliveryType === "DELIVERY" && order.snapShotAddress && (
        <Card className="border py-3">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-md">
                <MapPin className="text-muted-foreground h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold">
                Delivery Address
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p className="font-semibold">
                {order.snapShotAddress.recipientName ?? "—"}
              </p>
              <p className="text-muted-foreground mt-0.5">
                {order.snapShotAddress.phoneNumber ?? "—"}
              </p>

              <Separator className="my-3" />

              <p className="text-foreground">
                {order.snapShotAddress.line1 ?? "—"}
              </p>
              {order.snapShotAddress.line2 && (
                <p className="text-foreground">{order.snapShotAddress.line2}</p>
              )}
              <p className="text-muted-foreground mt-0.5">
                {[
                  order.snapShotAddress.subdistrict,
                  order.snapShotAddress.district,
                  order.snapShotAddress.city,
                  order.snapShotAddress.province,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="text-muted-foreground">
                {order.snapShotAddress.country ?? "—"}{" "}
                {order.snapShotAddress.postalCode ?? "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Order Items ───────────────────────────────────────────────────── */}
      <Card className="border py-3">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-md">
                <Box className="text-muted-foreground h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Order Items
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {order.items.map((item, index) => {
            const product = productById.get(item.productBaseId);
            const material = item.materialId
              ? materialById.get(item.materialId)
              : undefined;

            return (
              <div
                key={item.id}
                className="bg-card rounded-lg border p-4 transition-colors"
              >
                {/* Item header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {product?.images?.[0] && (
                      <div className="bg-muted shrink-0 overflow-hidden rounded-md border">
                        <img
                          src={product.images[0]}
                          alt={product.productName ?? "Product"}
                          className="h-12 w-12 object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-semibold">
                        {product?.productName ?? `Item ${index + 1}`}
                      </p>
                      {material && (
                        <div className="mt-1 flex items-center gap-1.5">
                          {material.materialUrl && (
                            <img
                              src={material.materialUrl}
                              alt={material.materialName}
                              className="h-4 w-4 rounded-sm object-cover"
                            />
                          )}
                          <span className="text-muted-foreground text-xs">
                            {material.materialName}
                            {material.materialSku && (
                              <span className="ml-1 opacity-60">
                                · {material.materialSku}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-primary shrink-0 text-base font-bold">
                    {formatPrice(item.itemTotalPrice)}
                  </p>
                </div>

                {/* Price breakdown */}
                <div className="bg-muted/40 mt-3 grid grid-cols-2 gap-x-4 rounded-md px-3 py-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price</span>
                    <span className="font-medium">
                      {formatPrice(item.lockedBasePrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Material Price
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.lockedMaterialPrice)}
                    </span>
                  </div>
                </div>

                {/* Components */}
                {item.components.length > 0 && (
                  <div className="mt-3">
                    <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                      Components ({item.components.length})
                    </p>
                    <div className="divide-border/60 divide-y rounded-md border">
                      {item.components.map((component) => {
                        const comp = componentById.get(component.componentId);
                        return (
                          <div
                            key={component.id}
                            className="hover:bg-muted/30 flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              {comp?.componentImageUrls?.[0] && (
                                <img
                                  src={comp.componentImageUrls[0]}
                                  alt={comp.componentName ?? "Component"}
                                  className="h-7 w-7 shrink-0 rounded-sm object-cover"
                                />
                              )}
                              <span className="text-muted-foreground truncate text-xs">
                                {comp?.componentName ?? component.componentId}
                              </span>
                              <span className="text-muted-foreground/60 text-xs">
                                × {component.quantity}
                              </span>
                            </div>
                            <span className="text-foreground shrink-0 text-xs font-medium">
                              {formatPrice(component.lockedSubTotal)}
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
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ShippingRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-muted-foreground flex items-center gap-1.5">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}
