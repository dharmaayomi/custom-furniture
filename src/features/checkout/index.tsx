// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useQueries } from "@tanstack/react-query";
// import { toast } from "sonner";
// import useAxios from "@/hooks/useAxios";
// import useCreateSnapPayment from "@/hooks/api/order/useCreateSnapPayment";
// import useGetOrder from "@/hooks/api/order/useGetOrder";
// import { formatPrice } from "@/lib/price";
// import { getApiErrorMessage } from "@/lib/api-error";
// import {
//   CheckoutOrderSnapshot,
//   loadCheckoutSnapshot,
// } from "@/lib/checkoutStorage";
// import { SnapshotAddress } from "@/types/customOrder";
// import { ProductBase } from "@/types/product";
// import { ProductComponent } from "@/types/componentProduct";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
// import { Skeleton } from "@/components/ui/skeleton";

// const getDeliveryTypeLabel = (
//   value: CheckoutOrderSnapshot["deliveryType"] | "DELIVERY" | "PICKUP",
// ) => (value === "PICKUP" ? "Pickup" : "Delivery");

// const getStatusBadgeClassName = (status: string) => {
//   switch (status) {
//     case "PAID":
//       return "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300";
//     case "CANCELLED":
//       return "border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-300";
//     case "PENDING_PAYMENT":
//     default:
//       return "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300";
//   }
// };

// export const CheckoutPage = () => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const axiosInstance = useAxios();
//   const { mutateAsync: createSnapPayment, isPending: isCreatingSnapPayment } =
//     useCreateSnapPayment();
//   const [snapshot, setSnapshot] = useState<CheckoutOrderSnapshot | null>(null);

//   useEffect(() => {
//     setSnapshot(loadCheckoutSnapshot());
//   }, []);

//   const urlOrderId = searchParams.get("orderId") ?? "";
//   const orderId = urlOrderId || snapshot?.orderId || "";
//   const { data: order, isLoading } = useGetOrder(orderId || undefined);
//   const canUseSnapshotFallback =
//     !urlOrderId || snapshot?.orderId === urlOrderId;

//   const address = (order?.snapShotAddress ?? null) as SnapshotAddress | null;
//   const topLevelPreview =
//     ((order as unknown as { previewUrl?: string; previewImage?: string })
//       ?.previewImage ||
//       (order as unknown as { previewUrl?: string; previewImage?: string })
//         ?.previewUrl) ??
//     undefined;
//   const previewImage =
//     topLevelPreview ||
//     order?.designSnapShot?.previewImage ||
//     order?.designSnapShot?.previewUrl ||
//     (canUseSnapshotFallback
//       ? snapshot?.previewImage || snapshot?.previewUrl
//       : undefined);
//   const createdAtLabel = order?.createdAt
//     ? new Date(order.createdAt).toLocaleString()
//     : snapshot?.createdAt
//       ? new Date(snapshot.createdAt).toLocaleString()
//       : "-";

//   const productIds = useMemo(
//     () =>
//       Array.from(
//         new Set((order?.items ?? []).map((item) => item.productBaseId)),
//       ),
//     [order?.items],
//   );
//   const componentIds = useMemo(
//     () =>
//       Array.from(
//         new Set(
//           (order?.items ?? []).flatMap((item) =>
//             (item.components ?? []).map((component) => component.componentId),
//           ),
//         ),
//       ),
//     [order?.items],
//   );

//   const productQueries = useQueries({
//     queries: productIds.map((id) => ({
//       queryKey: ["product", id],
//       queryFn: async () => {
//         const { data } = await axiosInstance.get(`/product/${id}`);
//         return ((data as { data?: ProductBase })?.data ?? data) as ProductBase;
//       },
//       enabled: Boolean(id),
//       staleTime: 5 * 60 * 1000,
//     })),
//   });
//   const componentQueries = useQueries({
//     queries: componentIds.map((id) => ({
//       queryKey: ["component", id],
//       queryFn: async () => {
//         const { data } = await axiosInstance.get(`/product/component/${id}`);
//         return ((data as { data?: ProductComponent })?.data ??
//           data) as ProductComponent;
//       },
//       enabled: Boolean(id),
//       staleTime: 5 * 60 * 1000,
//     })),
//   });

//   const productById = useMemo(() => {
//     const map = new Map<string, ProductBase>();
//     productQueries.forEach((query) => {
//       if (query.data?.id) map.set(query.data.id, query.data);
//     });
//     return map;
//   }, [productQueries]);
//   const componentById = useMemo(() => {
//     const map = new Map<string, ProductComponent>();
//     componentQueries.forEach((query) => {
//       if (query.data?.id) map.set(query.data.id, query.data);
//     });
//     return map;
//   }, [componentQueries]);

//   const fallbackItems = useMemo(
//     () =>
//       snapshot?.items.map((item) => ({
//         id: item.id,
//         name: item.name,
//         sku: item.sku,
//         quantity: item.quantity,
//         subtotal: item.subtotal,
//       })) ?? [],
//     [snapshot?.items],
//   );
//   const totalItems = useMemo(() => {
//     if (order?.items?.length) return order.items.length;
//     return fallbackItems.reduce((sum, item) => sum + item.quantity, 0);
//   }, [order?.items, fallbackItems]);

//   if (!snapshot && !orderId) {
//     return (
//       <main className="min-h-screen p-6">
//         <Card className="mx-auto max-w-3xl">
//           <CardHeader>
//             <CardTitle>Checkout</CardTitle>
//             <CardDescription>
//               No checkout order found. Please create order from summary first.
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <Button onClick={() => router.push("/summary")}>
//               Back to Summary
//             </Button>
//           </CardContent>
//         </Card>
//       </main>
//     );
//   }

//   const status = order?.status ?? snapshot?.status ?? "PENDING_PAYMENT";
//   const displayOrderNumber = order?.orderNumber?.trim() || orderId;
//   const deliveryType =
//     order?.deliveryType ?? snapshot?.deliveryType ?? "DELIVERY";
//   const subtotal = Number(order?.subtotalPrice ?? snapshot?.subtotal ?? 0);
//   const deliveryFee = Number(order?.deliveryFee ?? snapshot?.deliveryFee ?? 0);
//   const deliveryDistance = Number(
//     order?.deliveryDistance ?? order?.deliveryDistancce ?? 0,
//   );
//   const totalWeightGrams = Number(order?.totalWeight ?? 0);
//   const totalWeightKg = totalWeightGrams / 1000;
//   const grandTotal = Number(
//     order?.grandTotalPrice ?? snapshot?.grandTotal ?? 0,
//   );
//   const isPayable = status === "PENDING_PAYMENT" && Boolean(orderId);

//   const handlePayNow = async () => {
//     if (!orderId) {
//       toast.error("Order not found.");
//       return;
//     }

//     if (status !== "PENDING_PAYMENT") {
//       toast.info("This order is not in waiting-for-payment status.");
//       return;
//     }

//     try {
//       const payment = await createSnapPayment({
//         orderId,
//         phase: "DP",
//       });
//       const paymentUrl = payment?.paymentUrl?.trim();
//       if (!paymentUrl) {
//         toast.error("Payment URL is missing.");
//         return;
//       }

//       toast.info("Redirecting to payment gateway...");
//       window.location.assign(paymentUrl);
//     } catch (error) {
//       toast.error(
//         getApiErrorMessage(error, "Failed to create payment transaction."),
//       );
//     }
//   };

//   return (
//     <main className="min-h-screen p-4 sm:p-6">
//       <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
//         <section className="space-y-4 lg:col-span-2">
//           <Card>
//             <CardHeader>
//               <div className="flex items-start justify-between gap-3">
//                 <div>
//                   <CardTitle>Checkout</CardTitle>
//                   <CardDescription>
//                     Order #{displayOrderNumber} is created. Please complete
//                     payment.
//                   </CardDescription>
//                 </div>
//                 <Badge
//                   variant="outline"
//                   className={getStatusBadgeClassName(status)}
//                 >
//                   {status}
//                 </Badge>
//               </div>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               {isLoading ? <Skeleton className="h-6 w-40" /> : null}
//               {previewImage ? (
//                 <div className="overflow-hidden rounded-lg border">
//                   <img
//                     src={previewImage}
//                     alt="Design preview"
//                     className="h-56 w-full object-cover sm:h-80"
//                   />
//                 </div>
//               ) : null}

//               <Card className="gap-3 py-4 shadow-none">
//                 <CardContent className="space-y-1 px-4">
//                   <div className="flex items-center gap-2">
//                     <p className="text-sm font-semibold">Fulfillment</p>
//                     <Badge variant="secondary">
//                       {getDeliveryTypeLabel(deliveryType)}
//                     </Badge>
//                   </div>
//                   <p className="text-muted-foreground text-sm">
//                     Created at: {createdAtLabel}
//                   </p>
//                   <p className="text-muted-foreground text-sm">
//                     Total weight: {totalWeightKg.toFixed(2)} kg
//                   </p>
//                   {deliveryType === "DELIVERY" ? (
//                     <p className="text-muted-foreground text-sm">
//                       Delivery distance: {deliveryDistance} km
//                     </p>
//                   ) : null}
//                 </CardContent>
//               </Card>

//               {deliveryType === "DELIVERY" && address ? (
//                 <Card className="gap-3 py-4 shadow-none">
//                   <CardContent className="space-y-1 px-4">
//                     <p className="text-sm font-semibold">Delivery Address</p>
//                     <p className="text-sm">
//                       {address.recipientName} ({address.phoneNumber})
//                     </p>
//                     <p className="text-muted-foreground text-sm">
//                       {address.line1}
//                       {address.line2 ? `, ${address.line2}` : ""}
//                     </p>
//                     <p className="text-muted-foreground text-sm">
//                       {address.subdistrict ? `${address.subdistrict}, ` : ""}
//                       {address.district ? `${address.district}, ` : ""}
//                       {address.city}, {address.province}
//                     </p>
//                     <p className="text-muted-foreground text-sm">
//                       {address.country} {address.postalCode}
//                     </p>
//                   </CardContent>
//                 </Card>
//               ) : null}
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Product List</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-3">
//               {order?.items?.length
//                 ? order.items.map((item, index) => (
//                     <Card key={item.id} className="gap-3 py-4 shadow-none">
//                       <CardContent className="space-y-2 px-4">
//                         <div className="flex items-start justify-between gap-3">
//                           <div className="flex min-w-0 items-start gap-3">
//                             {productById.get(item.productBaseId)
//                               ?.images?.[0] ? (
//                               <img
//                                 src={
//                                   productById.get(item.productBaseId)
//                                     ?.images?.[0]
//                                 }
//                                 alt={
//                                   productById.get(item.productBaseId)
//                                     ?.productName ?? `Product ${index + 1}`
//                                 }
//                                 className="h-12 w-12 shrink-0 rounded object-cover"
//                               />
//                             ) : (
//                               <div className="bg-muted text-muted-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded text-[10px]">
//                                 No Img
//                               </div>
//                             )}
//                             <div className="min-w-0">
//                               <p className="truncate text-sm font-medium">
//                                 {productById.get(item.productBaseId)
//                                   ?.productName ?? `Product ${index + 1}`}
//                               </p>
//                               <p className="text-muted-foreground text-xs">
//                                 SKU:{" "}
//                                 {productById.get(item.productBaseId)?.sku ??
//                                   item.productBaseId}
//                               </p>
//                             </div>
//                           </div>
//                           <p className="shrink-0 text-sm font-semibold">
//                             {formatPrice(item.itemTotalPrice)}
//                           </p>
//                         </div>

//                         <div className="text-muted-foreground space-y-1 text-xs">
//                           <div className="flex justify-between">
//                             <span>Base Price</span>
//                             <span>{formatPrice(item.lockedBasePrice)}</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span>Material Price</span>
//                             <span>{formatPrice(item.lockedMaterialPrice)}</span>
//                           </div>
//                           {item.components?.length ? (
//                             <Card className="mt-2 gap-2 py-3 shadow-none">
//                               <CardContent className="space-y-1 px-3">
//                                 <p className="text-foreground text-xs font-medium">
//                                   Components
//                                 </p>
//                                 {item.components.map((component) => (
//                                   <div
//                                     key={component.id}
//                                     className="flex items-center justify-between gap-3"
//                                   >
//                                     <div className="flex min-w-0 items-center gap-2">
//                                       {componentById.get(component.componentId)
//                                         ?.componentImageUrls?.[0] ? (
//                                         <img
//                                           src={
//                                             componentById.get(
//                                               component.componentId,
//                                             )?.componentImageUrls?.[0]
//                                           }
//                                           alt={
//                                             componentById.get(
//                                               component.componentId,
//                                             )?.componentName ??
//                                             String(component.componentId)
//                                           }
//                                           className="h-8 w-8 shrink-0 rounded object-cover"
//                                         />
//                                       ) : null}
//                                       <span className="truncate">
//                                         {componentById.get(
//                                           component.componentId,
//                                         )?.componentName ??
//                                           component.componentId}{" "}
//                                         x{component.quantity}
//                                       </span>
//                                     </div>
//                                     <span>
//                                       {formatPrice(component.lockedSubTotal)}
//                                     </span>
//                                   </div>
//                                 ))}
//                               </CardContent>
//                             </Card>
//                           ) : null}
//                         </div>
//                       </CardContent>
//                     </Card>
//                   ))
//                 : fallbackItems.map((item) => (
//                     <div
//                       key={item.id}
//                       className="flex items-center justify-between gap-3 rounded-lg border p-3"
//                     >
//                       <div className="min-w-0">
//                         <p className="truncate text-sm font-medium">
//                           {item.name}
//                         </p>
//                         <p className="text-muted-foreground text-xs">
//                           SKU: {item.sku} - Qty: {item.quantity}
//                         </p>
//                       </div>
//                       <p className="shrink-0 text-sm font-semibold">
//                         {formatPrice(item.subtotal)}
//                       </p>
//                     </div>
//                   ))}
//             </CardContent>
//           </Card>
//         </section>

//         <aside className="lg:sticky lg:top-6 lg:h-fit">
//           <Card>
//             <CardHeader>
//               <CardTitle>Order Summary</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-3">
//               <div className="flex justify-between text-sm">
//                 <span className="text-muted-foreground">Items</span>
//                 <span>{totalItems}</span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span className="text-muted-foreground">Subtotal</span>
//                 <span>{formatPrice(subtotal)}</span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span className="text-muted-foreground">Delivery Fee</span>
//                 <span>{formatPrice(deliveryFee)}</span>
//               </div>
//               <Separator />
//               <div className="flex items-center justify-between">
//                 <span className="font-semibold">Grand Total</span>
//                 <span className="text-xl font-bold">
//                   {formatPrice(grandTotal)}
//                 </span>
//               </div>
//               <Button
//                 className="w-full"
//                 onClick={handlePayNow}
//                 disabled={!isPayable || isCreatingSnapPayment}
//               >
//                 {isCreatingSnapPayment ? "Redirecting..." : "Pay Now"}
//               </Button>
//             </CardContent>
//           </Card>
//         </aside>
//       </div>
//     </main>
//   );
// };
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { toast } from "sonner";
import useAxios from "@/hooks/useAxios";
import useCreateSnapPayment from "@/hooks/api/order/useCreateSnapPayment";
import useGetOrder from "@/hooks/api/order/useGetOrder";
import { formatPrice } from "@/lib/price";
import { getApiErrorMessage } from "@/lib/api-error";
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
import {
  Package,
  MapPin,
  Clock,
  Weight,
  Ruler,
  ShoppingBag,
  CreditCard,
  ChevronRight,
  Truck,
  Store,
  Box,
  Layers,
} from "lucide-react";

const getDeliveryTypeLabel = (
  value: CheckoutOrderSnapshot["deliveryType"] | "DELIVERY" | "PICKUP",
) => (value === "PICKUP" ? "Pickup" : "Delivery");

const getStatusBadgeClassName = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "SHIPPED":
    case "READY_TO_SHIP":
      return "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-300";
    case "IN_PRODUCTION":
      return "border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-800/50 dark:bg-orange-950/40 dark:text-orange-300";
    case "CANCELLED":
      return "border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-300";
    case "PENDING_PAYMENT":
    default:
      return "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300";
  }
};

const getStatusDotClass = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-500";
    case "SHIPPED":
    case "READY_TO_SHIP":
      return "bg-blue-500";
    case "IN_PRODUCTION":
      return "bg-orange-500";
    case "CANCELLED":
      return "bg-rose-500";
    default:
      return "bg-amber-500";
  }
};

export const CheckoutPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const axiosInstance = useAxios();
  const { mutateAsync: createSnapPayment, isPending: isCreatingSnapPayment } =
    useCreateSnapPayment();
  const [snapshot, setSnapshot] = useState<CheckoutOrderSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(loadCheckoutSnapshot());
  }, []);

  const urlOrderId = searchParams.get("orderId") ?? "";
  const orderId = urlOrderId || snapshot?.orderId || "";
  const { data: order, isLoading } = useGetOrder(orderId || undefined);
  const canUseSnapshotFallback =
    !urlOrderId || snapshot?.orderId === urlOrderId;

  const address = (order?.snapShotAddress ?? null) as SnapshotAddress | null;
  const topLevelPreview =
    ((order as unknown as { previewUrl?: string; previewImage?: string })
      ?.previewImage ||
      (order as unknown as { previewUrl?: string; previewImage?: string })
        ?.previewUrl) ??
    undefined;
  const previewImage =
    topLevelPreview ||
    order?.designSnapShot?.previewImage ||
    order?.designSnapShot?.previewUrl ||
    (canUseSnapshotFallback
      ? snapshot?.previewImage || snapshot?.previewUrl
      : undefined);
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
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="pb-2">
            <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
              <ShoppingBag className="text-muted-foreground h-8 w-8" />
            </div>
            <CardTitle>No Order Found</CardTitle>
            <CardDescription>
              Please create an order from the summary page first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/summary")} className="w-full">
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
  const totalWeightGrams = Number(order?.totalWeight ?? 0);
  const totalWeightKg = totalWeightGrams / 1000;
  const grandTotal = Number(
    order?.grandTotalPrice ?? snapshot?.grandTotal ?? 0,
  );
  const isPayable = status === "PENDING_PAYMENT" && Boolean(orderId);

  const handlePayNow = async () => {
    if (!orderId) {
      toast.error("Order not found.");
      return;
    }
    if (status !== "PENDING_PAYMENT") {
      toast.info("This order is not in waiting-for-payment status.");
      return;
    }
    try {
      const payment = await createSnapPayment({ orderId, phase: "DP" });
      const paymentUrl = payment?.paymentUrl?.trim();
      if (!paymentUrl) {
        toast.error("Payment URL is missing.");
        return;
      }
      toast.info("Redirecting to payment gateway...");
      window.location.assign(paymentUrl);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Failed to create payment transaction."),
      );
    }
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <div className="mx-auto mb-6 max-w-7xl">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>Orders</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Checkout</span>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
        {/* ── LEFT COLUMN ─────────────────────────────────────── */}
        <section className="space-y-5 lg:col-span-2">
          {/* Order Header Card */}
          <Card className="ring-border/60 overflow-hidden border-0 shadow-sm ring-1">
            {/* Accent bar on top */}

            {previewImage ? (
              <div className="relative h-52 w-full overflow-hidden sm:h-72">
                <img
                  src={previewImage}
                  alt="Design preview"
                  className="h-full w-full object-cover"
                />
                {/* Gradient overlay for legibility */}
                <div className="from-background/60 absolute inset-0 bg-linear-to-t via-transparent to-transparent" />
                {/* Order number pill over the image */}
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                  <p className="text-foreground/90 text-sm font-semibold drop-shadow">
                    #{displayOrderNumber}
                  </p>
                  <Badge
                    variant="outline"
                    className={`${getStatusBadgeClassName(status)} flex items-center gap-1.5`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(status)}`}
                    />
                    {status}
                  </Badge>
                </div>
              </div>
            ) : (
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">Checkout</CardTitle>
                    <CardDescription className="mt-0.5">
                      Order #{displayOrderNumber}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getStatusBadgeClassName(status)} flex items-center gap-1.5`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(status)}`}
                    />
                    {status}
                  </Badge>
                </div>
              </CardHeader>
            )}

            <CardContent className="px-5 py-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                /* Fulfillment info row */
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {/* Fulfillment type */}
                  <div className="bg-muted/40 flex flex-col gap-1 rounded-xl p-3">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] tracking-wide uppercase">
                      {deliveryType === "PICKUP" ? (
                        <Store className="h-3 w-3" />
                      ) : (
                        <Truck className="h-3 w-3" />
                      )}
                      Fulfillment
                    </span>
                    <span className="text-sm font-semibold">
                      {getDeliveryTypeLabel(deliveryType)}
                    </span>
                  </div>

                  {/* Created at */}
                  <div className="bg-muted/40 flex flex-col gap-1 rounded-xl p-3">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] tracking-wide uppercase">
                      <Clock className="h-3 w-3" />
                      Created
                    </span>
                    <span className="text-sm leading-snug font-semibold">
                      {createdAtLabel}
                    </span>
                  </div>

                  {/* Weight */}
                  <div className="bg-muted/40 flex flex-col gap-1 rounded-xl p-3">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] tracking-wide uppercase">
                      <Weight className="h-3 w-3" />
                      Weight
                    </span>
                    <span className="text-sm font-semibold">
                      {totalWeightKg.toFixed(2)} kg
                    </span>
                  </div>

                  {/* Distance – only for delivery */}
                  {deliveryType === "DELIVERY" && (
                    <div className="bg-muted/40 flex flex-col gap-1 rounded-xl p-3">
                      <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] tracking-wide uppercase">
                        <Ruler className="h-3 w-3" />
                        Distance
                      </span>
                      <span className="text-sm font-semibold">
                        {deliveryDistance} km
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Address Card */}
          {deliveryType === "DELIVERY" && address && (
            <Card className="ring-border/60 border-0 shadow-sm ring-1">
              <CardHeader className="pt-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
                    <MapPin className="text-primary h-3.5 w-3.5" />
                  </div>
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm font-semibold">
                    {address.recipientName}
                    <span className="text-muted-foreground ml-2 font-normal">
                      {address.phoneNumber}
                    </span>
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
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
              </CardContent>
            </Card>
          )}

          {/* Product List */}
          <Card className="ring-border/60 border-0 shadow-sm ring-1">
            <CardHeader className="pt-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
                  <Package className="text-primary h-3.5 w-3.5" />
                </div>
                Product List
                <span className="bg-muted text-muted-foreground ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium">
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5">
              {order?.items?.length
                ? order.items.map((item, index) => {
                    const product = productById.get(item.productBaseId);
                    return (
                      <div
                        key={item.id}
                        className="ring-border/50 hover:bg-muted/20 rounded-xl p-4 ring-1 transition-colors"
                      >
                        {/* Product header row */}
                        <div className="flex items-start gap-3">
                          {product?.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={
                                product.productName ?? `Product ${index + 1}`
                              }
                              className="ring-border/40 h-14 w-14 shrink-0 rounded-xl object-cover ring-1"
                            />
                          ) : (
                            <div className="bg-muted text-muted-foreground flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-[10px]">
                              <Box className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {product?.productName ?? `Product ${index + 1}`}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              SKU: {product?.sku ?? item.productBaseId}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-bold">
                            {formatPrice(item.itemTotalPrice)}
                          </p>
                        </div>

                        {/* Price breakdown */}
                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                          <div className="bg-muted/40 flex items-center justify-between rounded-lg px-3 py-2">
                            <span className="text-muted-foreground text-xs">
                              Base
                            </span>
                            <span className="text-xs font-medium">
                              {formatPrice(item.lockedBasePrice)}
                            </span>
                          </div>
                          <div className="bg-muted/40 flex items-center justify-between rounded-lg px-3 py-2">
                            <span className="text-muted-foreground text-xs">
                              Material
                            </span>
                            <span className="text-xs font-medium">
                              {formatPrice(item.lockedMaterialPrice)}
                            </span>
                          </div>
                        </div>

                        {/* Components */}
                        {item.components?.length ? (
                          <div className="mt-3">
                            <div className="mb-2 flex items-center gap-1.5">
                              <Layers className="text-muted-foreground h-3 w-3" />
                              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                Components
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              {item.components.map((component) => {
                                const comp = componentById.get(
                                  component.componentId,
                                );
                                return (
                                  <div
                                    key={component.id}
                                    className="ring-border/40 flex items-center gap-2.5 rounded-lg px-3 py-2 ring-1"
                                  >
                                    {comp?.componentImageUrls?.[0] ? (
                                      <img
                                        src={comp.componentImageUrls[0]}
                                        alt={
                                          comp.componentName ??
                                          String(component.componentId)
                                        }
                                        className="h-8 w-8 shrink-0 rounded-lg object-cover"
                                      />
                                    ) : (
                                      <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                                        <Layers className="text-muted-foreground h-3.5 w-3.5" />
                                      </div>
                                    )}
                                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                                      {comp?.componentName ??
                                        component.componentId}
                                      <span className="text-muted-foreground ml-1 font-normal">
                                        ×{component.quantity}
                                      </span>
                                    </span>
                                    <span className="shrink-0 text-xs font-semibold">
                                      {formatPrice(component.lockedSubTotal)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                : fallbackItems.map((item) => (
                    <div
                      key={item.id}
                      className="ring-border/50 flex items-center justify-between gap-3 rounded-xl px-4 py-3 ring-1"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          SKU: {item.sku} · Qty {item.quantity}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-bold">
                        {formatPrice(item.subtotal)}
                      </p>
                    </div>
                  ))}
            </CardContent>
          </Card>
        </section>

        {/* ── RIGHT COLUMN – sticky summary ───────────────────── */}
        <aside className="lg:sticky lg:top-22 lg:h-fit">
          <Card className="ring-border/60 overflow-hidden border-0 shadow-sm ring-1">
            <CardHeader className="pt-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
                  <CreditCard className="text-primary h-3.5 w-3.5" />
                </div>
                Order Summary
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 px-5 pb-5">
              {/* Line items */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{totalItems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="font-medium">
                    {formatPrice(deliveryFee)}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Grand total */}
              <div className="bg-muted/40 flex items-center justify-between rounded-xl px-4 py-3">
                <span className="text-sm font-semibold">Grand Total</span>
                <span className="text-xl font-bold tracking-tight">
                  {formatPrice(grandTotal)}
                </span>
              </div>

              {/* CTA */}
              <Button
                className="w-full gap-2 font-semibold"
                size="lg"
                onClick={handlePayNow}
                disabled={!isPayable || isCreatingSnapPayment}
              >
                {isCreatingSnapPayment ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Redirecting…
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay Now
                  </>
                )}
              </Button>

              {!isPayable && status !== "PENDING_PAYMENT" && (
                <p className="text-muted-foreground text-center text-xs">
                  This order is no longer payable.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
};
