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

const statusLabel: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Waiting for Payment",
  PAID: "Paid",
  PROCESSING: "In Progress",
  SHIPPED: "Shipped",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusTone: Record<OrderStatus, StatusTone> = {
  PENDING_PAYMENT: "warning",
  PAID: "info",
  PROCESSING: "warning",
  SHIPPED: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
};

type OrderDetailPageProps = {
  orderId: string;
};

export const OrderDetailPage = ({ orderId }: OrderDetailPageProps) => {
  const router = useRouter();
  const axiosInstance = useAxios();
  const { data: order, isLoading, isError } = useGetOrder(orderId);

  const componentIds = useMemo(
    () =>
      Array.from(
        new Set(
          (order?.items ?? []).flatMap((item) =>
            (item.components ?? []).map((component) => component.componentId),
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
  const componentById = useMemo(() => {
    const map = new Map<string, ProductComponent>();
    componentQueries.forEach((query) => {
      if (query.data?.id) map.set(query.data.id, query.data);
    });
    return map;
  }, [componentQueries]);
  const productById = useMemo(() => {
    const map = new Map<string, ProductBase>();
    productQueries.forEach((query) => {
      if (query.data?.id) map.set(query.data.id, query.data);
    });
    return map;
  }, [productQueries]);
  const materialById = useMemo(() => {
    const map = new Map<string, ProductMaterial>();
    materialQueries.forEach((query) => {
      if (query.data?.id) map.set(query.data.id, query.data);
    });
    return map;
  }, [materialQueries]);

  useEffect(() => {
    if (order?.status !== "PENDING_PAYMENT") return;
    router.replace(`/dashboard/billing?orderId=${order.id}`);
  }, [order?.id, order?.status, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Order not found</CardTitle>
          <CardDescription>
            We could not load this order. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/dashboard/orders")}>
            Back to Orders
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (order.status === "PENDING_PAYMENT") {
    return (
      <Card className="border-yellow-200/50 bg-yellow-50/50 dark:border-yellow-900/30 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle>Redirecting to Billing</CardTitle>
          <CardDescription>
            Pending-payment orders are handled in Billing.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const displayOrderNumber = order.orderNumber?.trim() || order.id;
  const topLevelPreview =
    ((order as unknown as { previewUrl?: string; previewImage?: string })
      ?.previewImage ||
      (order as unknown as { previewUrl?: string; previewImage?: string })
        ?.previewUrl) ??
    "";
  const previewImage =
    topLevelPreview ||
    order.designSnapShot?.previewImage || order.designSnapShot?.previewUrl;

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold">
                Order #{displayOrderNumber}
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                {new Date(order.createdAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </CardDescription>
            </div>
            <div className="flex items-start gap-3">
              <Badge
                className={`h-fit px-4 py-2 text-base font-semibold ${getStatusBadgeClass(
                  statusTone[order.status],
                )}`}
              >
                {statusLabel[order.status]}
              </Badge>
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Design preview"
                  className="h-16 w-24 rounded-md border object-cover sm:h-18 sm:w-28"
                />
              ) : null}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Shipping & Logistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Delivery Type" value={order.deliveryType} />
            <Separator />
            <DetailRow label="Track Number" value={order.trackNumber ?? "-"} />
            <Separator />
            <DetailRow
              label="Total Weight"
              value={`${(Number(order.totalWeight ?? 0) / 1000).toFixed(2)} kg`}
            />
            <Separator />
            <DetailRow
              label="Delivery Distance"
              value={`${Number(order.deliveryDistance ?? order.deliveryDistancce ?? 0)} km`}
            />
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                {formatPrice(Number(order.subtotalPrice ?? 0))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className="font-medium">
                {formatPrice(Number(order.deliveryFee ?? 0))}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between pt-2">
              <span className="font-semibold">Grand Total</span>
              <span className="text-primary text-xl font-bold">
                {formatPrice(Number(order.grandTotalPrice ?? 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {order.deliveryType === "DELIVERY" && order.snapShotAddress ? (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Delivery Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold">
              {order.snapShotAddress.recipientName ?? "-"}
            </p>
            <p className="text-muted-foreground">
              {order.snapShotAddress.phoneNumber ?? "-"}
            </p>
            <Separator />
            <div className="space-y-1">
              <p>{order.snapShotAddress.line1 ?? "-"}</p>
              {order.snapShotAddress.line2 ? (
                <p>{order.snapShotAddress.line2}</p>
              ) : null}
              <p className="text-muted-foreground">
                {order.snapShotAddress.subdistrict
                  ? `${order.snapShotAddress.subdistrict}, `
                  : ""}
                {order.snapShotAddress.district
                  ? `${order.snapShotAddress.district}, `
                  : ""}
                {order.snapShotAddress.city ?? "-"},{" "}
                {order.snapShotAddress.province ?? "-"}
              </p>
              <p className="text-muted-foreground">
                {order.snapShotAddress.country ?? "-"}{" "}
                {order.snapShotAddress.postalCode ?? "-"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Order Items</CardTitle>
          <CardDescription>
            {order.items.length} item{order.items.length !== 1 ? "s" : ""} in
            this order
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((item, index) => (
            <div
              key={item.id}
              className="hover:bg-muted/30 rounded-lg border p-4 transition-colors"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">Item {index + 1}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="bg-muted flex items-center gap-2 rounded-md border px-2 py-1">
                      {productById.get(item.productBaseId)?.images?.[0] ? (
                        <img
                          src={productById.get(item.productBaseId)?.images?.[0]}
                          alt={
                            productById.get(item.productBaseId)?.productName ??
                            item.productBaseId
                          }
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : null}
                      <span className="text-muted-foreground text-xs">
                        Product:{" "}
                        {productById.get(item.productBaseId)?.productName ??
                          item.productBaseId}
                      </span>
                    </div>
                    {item.materialId ? (
                      <div className="bg-muted flex items-center gap-2 rounded-md border px-2 py-1">
                        {materialById.get(item.materialId)?.materialUrl ? (
                          <img
                            src={materialById.get(item.materialId)?.materialUrl}
                            alt={
                              materialById.get(item.materialId)?.materialName ??
                              item.materialId
                            }
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : null}
                        <span className="text-muted-foreground text-xs">
                          Material:{" "}
                          {materialById.get(item.materialId)?.materialName ??
                            item.materialId}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  {item.materialId ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Material SKU:{" "}
                      {materialById.get(item.materialId)?.materialSku ?? "-"}
                    </p>
                  ) : null}
                </div>
                <p className="text-primary text-lg font-bold">
                  {formatPrice(item.itemTotalPrice)}
                </p>
              </div>

              <div className="bg-muted/30 space-y-2 rounded p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Price</span>
                  <span className="font-medium">
                    {formatPrice(item.lockedBasePrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material Price</span>
                  <span className="font-medium">
                    {formatPrice(item.lockedMaterialPrice)}
                  </span>
                </div>
              </div>

              {item.components.length > 0 ? (
                <>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Components ({item.components.length})
                    </p>
                    <div className="space-y-1">
                      {item.components.map((component) => (
                        <div
                          key={component.id}
                          className="hover:bg-muted/50 flex items-center justify-between gap-2 rounded p-2 text-sm transition-colors"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            {componentById.get(component.componentId)
                              ?.componentImageUrls?.[0] ? (
                              <img
                                src={
                                  componentById.get(component.componentId)
                                    ?.componentImageUrls?.[0]
                                }
                                alt={
                                  componentById.get(component.componentId)
                                    ?.componentName ?? component.componentId
                                }
                                className="h-8 w-8 shrink-0 rounded object-cover"
                              />
                            ) : null}
                            <span className="text-muted-foreground truncate">
                              {componentById.get(component.componentId)
                                ?.componentName ?? component.componentId}{" "}
                              x {component.quantity}
                            </span>
                          </div>
                          <span className="font-medium">
                            {formatPrice(component.lockedSubTotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={() => router.push("/dashboard/orders")}>
          Back to Orders
        </Button>
      </div>
    </div>
  );
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
