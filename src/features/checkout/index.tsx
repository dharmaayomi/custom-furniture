"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { toast } from "sonner";
import useAxios from "@/hooks/useAxios";
import useGetOrder from "@/hooks/api/order/useGetOrder";
import { formatPrice } from "@/lib/price";
import {
  CheckoutOrderSnapshot,
  loadCheckoutSnapshot,
} from "@/lib/checkoutStorage";
import { SnapshotAddress } from "@/types/customOrder";
import { ProductBase } from "@/types/product";
import { ProductComponent } from "@/types/componentProduct";
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

const getDeliveryTypeLabel = (
  value: CheckoutOrderSnapshot["deliveryType"] | "DELIVERY" | "PICKUP",
) => (value === "PICKUP" ? "Pickup" : "Delivery");

const getStatusBadgeClassName = (status: string) => {
  switch (status) {
    case "PAID":
      return "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "CANCELLED":
      return "border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-300";
    case "PENDING_PAYMENT":
    default:
      return "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300";
  }
};

export const CheckoutPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const axiosInstance = useAxios();
  const [snapshot, setSnapshot] = useState<CheckoutOrderSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(loadCheckoutSnapshot());
  }, []);

  const urlOrderId = searchParams.get("orderId") ?? "";
  const orderId = snapshot?.orderId ?? urlOrderId;
  const { data: order, isLoading } = useGetOrder(orderId || undefined);

  const address = (order?.snapShotAddress ?? null) as SnapshotAddress | null;
  const previewImage =
    order?.designSnapShot?.previewImage ||
    order?.designSnapShot?.previewUrl ||
    snapshot?.previewImage;
  const createdAtLabel = order?.createdAt
    ? new Date(order.createdAt).toLocaleString()
    : snapshot?.createdAt
      ? new Date(snapshot.createdAt).toLocaleString()
      : "-";

  const productIds = useMemo(
    () =>
      Array.from(
        new Set((order?.items ?? []).map((item) => item.productBaseId)),
      ),
    [order?.items],
  );
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

  const productById = useMemo(() => {
    const map = new Map<string, ProductBase>();
    productQueries.forEach((query) => {
      if (query.data?.id) map.set(query.data.id, query.data);
    });
    return map;
  }, [productQueries]);
  const componentById = useMemo(() => {
    const map = new Map<string, ProductComponent>();
    componentQueries.forEach((query) => {
      if (query.data?.id) map.set(query.data.id, query.data);
    });
    return map;
  }, [componentQueries]);

  const fallbackItems = useMemo(
    () =>
      snapshot?.items.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })) ?? [],
    [snapshot?.items],
  );
  const totalItems = useMemo(() => {
    if (order?.items?.length) return order.items.length;
    return fallbackItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [order?.items, fallbackItems]);

  if (!snapshot && !orderId) {
    return (
      <main className="min-h-screen p-6">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
            <CardDescription>
              No checkout order found. Please create order from summary first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/summary")}>
              Back to Summary
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const status = order?.status ?? snapshot?.status ?? "PENDING_PAYMENT";
  const displayOrderNumber = order?.orderNumber?.trim() || orderId;
  const deliveryType =
    order?.deliveryType ?? snapshot?.deliveryType ?? "DELIVERY";
  const subtotal = Number(order?.subtotalPrice ?? snapshot?.subtotal ?? 0);
  const deliveryFee = Number(order?.deliveryFee ?? snapshot?.deliveryFee ?? 0);
  const deliveryDistance = Number(
    order?.deliveryDistance ?? order?.deliveryDistancce ?? 0,
  );
  const totalWeight = Number(order?.totalWeight ?? 0);
  const grandTotal = Number(
    order?.grandTotalPrice ?? snapshot?.grandTotal ?? 0,
  );

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Checkout</CardTitle>
                  <CardDescription>
                    Order #{displayOrderNumber} is created. Please complete
                    payment.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={getStatusBadgeClassName(status)}
                >
                  {status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? <Skeleton className="h-6 w-40" /> : null}
              {previewImage ? (
                <div className="overflow-hidden rounded-lg border">
                  <img
                    src={previewImage}
                    alt="Design preview"
                    className="h-56 w-full object-cover sm:h-80"
                  />
                </div>
              ) : null}

              <Card className="gap-3 py-4 shadow-none">
                <CardContent className="space-y-1 px-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Fulfillment</p>
                    <Badge variant="secondary">
                      {getDeliveryTypeLabel(deliveryType)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Created at: {createdAtLabel}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Total weight: {totalWeight} g
                  </p>
                  {deliveryType === "DELIVERY" ? (
                    <p className="text-muted-foreground text-sm">
                      Delivery distance: {deliveryDistance} km
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              {deliveryType === "DELIVERY" && address ? (
                <Card className="gap-3 py-4 shadow-none">
                  <CardContent className="space-y-1 px-4">
                    <p className="text-sm font-semibold">Delivery Address</p>
                    <p className="text-sm">
                      {address.recipientName} ({address.phoneNumber})
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
                  </CardContent>
                </Card>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order?.items?.length
                ? order.items.map((item, index) => (
                    <Card key={item.id} className="gap-3 py-4 shadow-none">
                      <CardContent className="space-y-2 px-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            {productById.get(item.productBaseId)
                              ?.images?.[0] ? (
                              <img
                                src={
                                  productById.get(item.productBaseId)
                                    ?.images?.[0]
                                }
                                alt={
                                  productById.get(item.productBaseId)
                                    ?.productName ?? `Product ${index + 1}`
                                }
                                className="h-12 w-12 shrink-0 rounded object-cover"
                              />
                            ) : (
                              <div className="bg-muted text-muted-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded text-[10px]">
                                No Img
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {productById.get(item.productBaseId)
                                  ?.productName ?? `Product ${index + 1}`}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                SKU:{" "}
                                {productById.get(item.productBaseId)?.sku ??
                                  item.productBaseId}
                              </p>
                            </div>
                          </div>
                          <p className="shrink-0 text-sm font-semibold">
                            {formatPrice(item.itemTotalPrice)}
                          </p>
                        </div>

                        <div className="text-muted-foreground space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Base Price</span>
                            <span>{formatPrice(item.lockedBasePrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Material Price</span>
                            <span>{formatPrice(item.lockedMaterialPrice)}</span>
                          </div>
                          {item.components?.length ? (
                            <Card className="mt-2 gap-2 py-3 shadow-none">
                              <CardContent className="space-y-1 px-3">
                                <p className="text-foreground text-xs font-medium">
                                  Components
                                </p>
                                {item.components.map((component) => (
                                  <div
                                    key={component.id}
                                    className="flex items-center justify-between gap-3"
                                  >
                                    <div className="flex min-w-0 items-center gap-2">
                                      {componentById.get(component.componentId)
                                        ?.componentImageUrls?.[0] ? (
                                        <img
                                          src={
                                            componentById.get(
                                              component.componentId,
                                            )?.componentImageUrls?.[0]
                                          }
                                          alt={
                                            componentById.get(
                                              component.componentId,
                                            )?.componentName ??
                                            String(component.componentId)
                                          }
                                          className="h-8 w-8 shrink-0 rounded object-cover"
                                        />
                                      ) : null}
                                      <span className="truncate">
                                        {componentById.get(
                                          component.componentId,
                                        )?.componentName ??
                                          component.componentId}{" "}
                                        x{component.quantity}
                                      </span>
                                    </div>
                                    <span>
                                      {formatPrice(component.lockedSubTotal)}
                                    </span>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                : fallbackItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          SKU: {item.sku} - Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  ))}
            </CardContent>
          </Card>
        </section>

        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Grand Total</span>
                <span className="text-xl font-bold">
                  {formatPrice(grandTotal)}
                </span>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  toast.info("Proceeding to payment...");
                  router.push("/dashboard/billing");
                }}
              >
                Pay Now
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
};
