"use client";

import { useQueries } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Box,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FileText,
  MapPin,
  Package,
  Truck,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/features/dashboard/products/components/ImageUpload";
import useGetAdminOrder from "@/hooks/api/order/useGetAdminOrder";
import useGetProductionProgress from "@/hooks/api/production/useGetProductionProgress";
import useAxios from "@/hooks/useAxios";
import {
  deliveryTypeUsesAddress,
  getDeliveryTypeLabel,
} from "@/lib/deliveryType";
import {
  getOrderStatusDotClass,
  getOrderStatusLabel,
  getOrderStatusPillClass,
} from "@/lib/orderStatus";
import { formatPrice } from "@/lib/price";
import { ProductComponent } from "@/types/componentProduct";
import { OrderStatus } from "@/types/customOrder";
import { ProductMaterial } from "@/types/materialProduct";
import { ProductBase, UploadedProductImage } from "@/types/product";

type AdminOrderDeliverPageProps = {
  orderId: string;
};

type ChecklistEntry = {
  id: string;
  title: string;
  subtitle: string;
  quantityLabel?: string;
  imageUrl?: string | null;
};

type HandoffSnapshot = {
  nextStatus: OrderStatus;
  summary: string;
};

const MIN_EVIDENCE_PHOTOS = 2;
const WAREHOUSE_HOURS = "Mon-Sat, 09:00 - 17:00 WIB";

const getAddressLines = (address?: {
  line1?: string | null;
  line2?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  postalCode?: string | null;
}) => {
  if (!address) return [];

  return [
    [address.line1, address.line2].filter(Boolean).join(", "),
    [address.subdistrict, address.district, address.city, address.province]
      .filter(Boolean)
      .join(", "),
    [address.country, address.postalCode].filter(Boolean).join(" "),
  ].filter(Boolean);
};

const isTruthyChecked = (value: boolean | "indeterminate") => value === true;

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b py-5">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 py-5">{children}</CardContent>
    </Card>
  );
}

export const AdminOrderDeliverPage = ({
  orderId,
}: AdminOrderDeliverPageProps) => {
  const router = useRouter();
  const axiosInstance = useAxios();
  const imageItemsRef = useRef<UploadedProductImage[]>([]);

  const { data: order, isLoading, isError } = useGetAdminOrder(orderId);
  const { data: productionProgress = [] } = useGetProductionProgress(orderId);

  const [uploadedImageItems, setUploadedImageItems] = useState<
    UploadedProductImage[]
  >([]);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>(
    {},
  );
  const [trackNumber, setTrackNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [pickupCollected, setPickupCollected] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [localStatus, setLocalStatus] = useState<OrderStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const items = order?.items ?? [];

  const componentIds = useMemo(
    () =>
      Array.from(
        new Set(
          items.flatMap((item) =>
            (item.components ?? []).map((component) => component.componentId),
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
      queryKey: ["admin-deliver-product", id],
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
      queryKey: ["admin-deliver-material", id],
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
      queryKey: ["admin-deliver-component", id],
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

  const materialById = useMemo(() => {
    const map = new Map<string, ProductMaterial>();
    materialQueries.forEach((query) => {
      if (query.data?.id) map.set(query.data.id, query.data);
    });
    return map;
  }, [materialQueries]);

  const componentById = useMemo(() => {
    const map = new Map<string, ProductComponent>();
    componentQueries.forEach((query) => {
      if (query.data?.id) map.set(query.data.id, query.data);
    });
    return map;
  }, [componentQueries]);

  const checklistEntries = useMemo<ChecklistEntry[]>(() => {
    return items.flatMap((item, index) => {
      const product = item.productBase ?? productById.get(item.productBaseId);
      const material = item.materialId
        ? item.material ?? materialById.get(item.materialId)
        : undefined;

      const mainEntry: ChecklistEntry = {
        id: `item:${item.id}`,
        title: product?.productName ?? `Furniture Item ${index + 1}`,
        subtitle: material?.materialName
          ? `Main body with ${material.materialName} finish`
          : "Main furniture body prepared",
        quantityLabel: "1 unit",
        imageUrl: product?.images?.[0] ?? null,
      };

      const componentEntries = (item.components ?? []).map((component) => {
        const componentData = componentById.get(component.componentId);
        return {
          id: `component:${component.id}`,
          title: componentData?.componentName ?? "Accessory / Component",
          subtitle: `Attached to ${product?.productName ?? `item ${index + 1}`}`,
          quantityLabel: `${component.quantity} pcs`,
          imageUrl: componentData?.componentImageUrls?.[0] ?? null,
        } as ChecklistEntry;
      });

      return [mainEntry, ...componentEntries];
    });
  }, [componentById, items, materialById, productById]);

  const checkedCount = useMemo(
    () =>
      checklistEntries.filter((entry) => Boolean(checklistState[entry.id]))
        .length,
    [checklistEntries, checklistState],
  );

  const checklistComplete =
    checklistEntries.length > 0 && checkedCount === checklistEntries.length;

  const productionPercent = useMemo(
    () =>
      productionProgress.reduce(
        (maxValue, progress) => Math.max(maxValue, progress.percentage),
        0,
      ),
    [productionProgress],
  );

  const displayStatus = localStatus ?? order?.status ?? "READY_TO_SHIP";
  const orderRef = order?.orderNumber?.trim() || order?.id || orderId;
  const usesAddress = deliveryTypeUsesAddress(order?.deliveryType);
  const addressLines = getAddressLines(order?.snapShotAddress ?? undefined);
  const currentPaymentStatus = order?.currentPaymentStatus ?? "-";
  const currentPaymentPhase = order?.currentPaymentPhase ?? "-";
  const isProductionComplete = productionPercent >= 100;
  const isPaid = order?.currentPaymentStatus === "PAID";
  const isCourierDelivery = order?.deliveryType === "DELIVERY";
  const isStoreDelivery = order?.deliveryType === "STORE_DELIVERY";
  const isPickup = order?.deliveryType === "PICKUP";
  const evidenceReady = uploadedImageItems.length >= MIN_EVIDENCE_PHOTOS;

  const handoffSnapshot = useMemo<HandoffSnapshot>(() => {
    if (isCourierDelivery) {
      return {
        nextStatus: "SHIPPED",
        summary: trackNumber.trim()
          ? `Waybill ${trackNumber.trim()} will be stored on the order record.`
          : "Tracking number will be stored once admin enters the courier resi.",
      };
    }

    if (isStoreDelivery) {
      const summary = [driverName.trim(), plateNumber.trim()]
        .filter(Boolean)
        .join(" | ");

      return {
        nextStatus: "SHIPPED",
        summary: summary
          ? `Internal handoff record: ${summary}.`
          : "Driver name and plate number will be stored for internal logistics.",
      };
    }

    return {
      nextStatus: "SHIPPED",
      summary: pickupCollected
        ? "Pickup marked as collected from warehouse handoff desk."
        : "Pickup handoff waits for admin confirmation from the warehouse desk.",
    };
  }, [
    driverName,
    isCourierDelivery,
    isStoreDelivery,
    pickupCollected,
    plateNumber,
    trackNumber,
  ]);

  const handoffValid = useMemo(() => {
    if (isCourierDelivery) return Boolean(trackNumber.trim());
    if (isStoreDelivery) {
      return Boolean(driverName.trim()) && Boolean(plateNumber.trim());
    }
    if (isPickup) return pickupCollected;
    return false;
  }, [
    driverName,
    isCourierDelivery,
    isPickup,
    isStoreDelivery,
    pickupCollected,
    plateNumber,
    trackNumber,
  ]);

  const canSubmit =
    checklistComplete &&
    evidenceReady &&
    handoffValid &&
    displayStatus !== "SHIPPED";

  useEffect(() => {
    imageItemsRef.current = uploadedImageItems;
  }, [uploadedImageItems]);

  useEffect(() => {
    return () => {
      imageItemsRef.current.forEach((item) => {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!checklistEntries.length) return;

    setChecklistState((current) => {
      const nextState = { ...current };
      let changed = false;

      checklistEntries.forEach((entry) => {
        if (!(entry.id in nextState)) {
          nextState[entry.id] = false;
          changed = true;
        }
      });

      Object.keys(nextState).forEach((key) => {
        if (!checklistEntries.some((entry) => entry.id === key)) {
          delete nextState[key];
          changed = true;
        }
      });

      return changed ? nextState : current;
    });
  }, [checklistEntries]);

  const handleDispatch = async () => {
    if (!order) return;

    if (!checklistComplete) {
      toast.error("Complete the pre-shipment checklist first.");
      return;
    }

    if (!evidenceReady) {
      toast.error(`Upload at least ${MIN_EVIDENCE_PHOTOS} packaged photos.`);
      return;
    }

    if (isCourierDelivery && !trackNumber.trim()) {
      toast.error("Tracking number is required for courier delivery.");
      return;
    }

    if (isStoreDelivery && (!driverName.trim() || !plateNumber.trim())) {
      toast.error("Driver name and plate number are required.");
      return;
    }

    if (isPickup && !pickupCollected) {
      toast.error("Mark the order as collected for pickup handoff.");
      return;
    }

    setSubmitting(true);

    window.setTimeout(() => {
      setLocalStatus("SHIPPED");
      setSubmitting(false);
      toast.success("Dummy dispatch saved. Order status moved to SHIPPED.");
      router.push("/dashboard/admin/orders");
    }, 900);
  };

  if (isLoading) {
    return (
      <section className="space-y-5">
        <div className="rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-48" />
            </div>
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
          <div className="mt-5 flex gap-3">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-6 w-40 rounded-full" />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="py-5">
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="py-0">
            <CardHeader className="border-b py-5">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-3 py-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-xl border p-3"
                >
                  <Skeleton className="h-4 w-4 rounded-sm" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader className="border-b py-5">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-2/3" />
            </CardHeader>
            <CardContent className="space-y-4 py-5">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (isError || !order) {
    return (
      <div className="bg-card flex flex-col items-center justify-center gap-4 rounded-2xl border p-16 text-center">
        <AlertCircle className="text-muted-foreground h-10 w-10" />
        <div>
          <p className="text-base font-semibold">Order not found</p>
          <p className="text-muted-foreground mt-1 text-sm">
            The admin delivery page could not load this order.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/admin/orders")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full space-y-6">
      <header className="bg-primary/4 relative overflow-hidden rounded-2xl border shadow-sm">
        <div className="from-primary/60 via-primary to-primary/60 absolute inset-x-0 top-0 h-1 bg-linear-to-r" />

        <div className="px-6 pt-6 pb-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
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
                    Delivery Handoff
                  </p>
                  <h1 className="text-xl leading-tight font-bold tracking-tight">
                    {orderRef}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className={getOrderStatusPillClass(displayStatus)}>
                  <span className={getOrderStatusDotClass(displayStatus)} />
                  {getOrderStatusLabel(displayStatus)}
                </span>
                <Badge variant="outline">
                  {getDeliveryTypeLabel(order.deliveryType)}
                </Badge>
                <Badge variant="outline">Dummy UI Mode</Badge>
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Clock3 className="h-3.5 w-3.5" />
                  {new Date(order.createdAt).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <Button
              className="gap-2 self-start rounded-xl font-semibold shadow-sm"
              onClick={() => router.push(`/dashboard/admin/orders/${order.id}`)}
            >
              View Order Detail
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="py-5">
          <CardContent className="space-y-2">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
              <Truck className="text-primary h-5 w-5" />
            </div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Order Type Detection
            </p>
            <p className="text-lg font-bold">
              {getDeliveryTypeLabel(order.deliveryType)}
            </p>
            <p className="text-muted-foreground text-sm">
              The handoff form below is filtered for the active delivery type
              only.
            </p>
          </CardContent>
        </Card>

        <Card className="py-5">
          <CardContent className="space-y-2">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
              <Wallet className="text-primary h-5 w-5" />
            </div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Payment Validation
            </p>
            <p className="text-lg font-bold">{currentPaymentStatus}</p>
            <p className="text-muted-foreground text-sm">
              Phase {currentPaymentPhase} · Paid total{" "}
              {formatPrice(Number(order.totalPaid ?? 0))}
            </p>
          </CardContent>
        </Card>

        <Card className="py-5">
          <CardContent className="space-y-2">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
              <Package className="text-primary h-5 w-5" />
            </div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Production Completion
            </p>
            <p className="text-lg font-bold">{productionPercent}%</p>
            <p className="text-muted-foreground text-sm">
              {order.items.length} order item(s) ready for final packaging and
              handoff.
            </p>
          </CardContent>
        </Card>
      </div>

      {(!isPaid || !isProductionComplete || order.status !== "READY_TO_SHIP") && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Order eligibility warning</AlertTitle>
          <AlertDescription>
            This dummy screen is visible even if the order is not fully ready.
            Expected flow: payment settled, production at 100%, and status in
            READY_TO_SHIP.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <SectionCard
            title="Phase 1: Order Validation & Preparation"
            description="Review the order, confirm each furniture part, and verify the destination before dispatch."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-muted-foreground text-xs uppercase">
                  Status Target
                </p>
                <p className="mt-1 font-semibold">
                  {displayStatus} → {handoffSnapshot.nextStatus}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-muted-foreground text-xs uppercase">
                  Checklist
                </p>
                <p className="mt-1 font-semibold">
                  {checkedCount}/{checklistEntries.length} completed
                </p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-muted-foreground text-xs uppercase">
                  Evidence Upload
                </p>
                <p className="mt-1 font-semibold">
                  {uploadedImageItems.length}/{MIN_EVIDENCE_PHOTOS} minimum
                  photos
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">
                    Pre-Shipment Checklist
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Toggle every main furniture item and component after
                    physical QC.
                  </p>
                </div>
                <Badge variant={checklistComplete ? "default" : "outline"}>
                  {checklistComplete ? "Complete" : "In Progress"}
                </Badge>
              </div>

              {checklistEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No order items found for this delivery batch.
                </div>
              ) : (
                <div className="space-y-3">
                  {checklistEntries.map((entry) => (
                    <label
                      key={entry.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/20"
                    >
                      <Checkbox
                        checked={Boolean(checklistState[entry.id])}
                        onCheckedChange={(checked) =>
                          setChecklistState((current) => ({
                            ...current,
                            [entry.id]: isTruthyChecked(checked),
                          }))
                        }
                      />

                      <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                        {entry.imageUrl ? (
                          <img
                            src={entry.imageUrl}
                            alt={entry.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Box className="text-muted-foreground h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {entry.title}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {entry.subtitle}
                        </p>
                      </div>

                      {entry.quantityLabel && (
                        <Badge variant="outline">{entry.quantityLabel}</Badge>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
 
          <SectionCard
            title="Phase 2: Documentation & Handoff"
            description="Capture packaged evidence and fill the delivery handoff fields required for the active order type."
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">
                    Photo Evidence Upload
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Upload 2-3 photos showing the product in final packaged
                    condition.
                  </p>
                </div>
                <Badge variant={evidenceReady ? "default" : "outline"}>
                  {uploadedImageItems.length} uploaded
                </Badge>
              </div>

              <ImageUpload
                images={uploadedImageItems}
                onImagesChange={setUploadedImageItems}
              />
            </div>

            <div className="space-y-4 rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <FileText className="text-primary h-4 w-4" />
                <h2 className="text-sm font-semibold">
                  Conditional Handoff Fields
                </h2>
              </div>

              {isCourierDelivery && (
                <div className="space-y-2">
                  <Label htmlFor="trackNumber">Tracking Number / Resi</Label>
                  <Input
                    id="trackNumber"
                    value={trackNumber}
                    onChange={(event) => setTrackNumber(event.target.value)}
                    placeholder="JNE-RESI-000123456"
                  />
                  <p className="text-muted-foreground text-xs">
                    Mandatory for courier delivery. This will become the saved
                    trackNumber field when backend integration is ready.
                  </p>
                </div>
              )}

              {isStoreDelivery && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="driverName">Driver Name</Label>
                    <Input
                      id="driverName"
                      value={driverName}
                      onChange={(event) => setDriverName(event.target.value)}
                      placeholder="Budi Santoso"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plateNumber">Plate Number</Label>
                    <Input
                      id="plateNumber"
                      value={plateNumber}
                      onChange={(event) => setPlateNumber(event.target.value)}
                      placeholder="B 1234 FTR"
                    />
                  </div>
                </div>
              )}

              {isPickup && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-muted/30 p-4">
                    <p className="text-sm font-semibold">
                      Waiting for Customer
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Warehouse operating hours: {WAREHOUSE_HOURS}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Ask customer to present order number and contact phone
                      before releasing the furniture.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant={pickupCollected ? "default" : "outline"}
                    onClick={() => setPickupCollected((current) => !current)}
                  >
                    {pickupCollected
                      ? "Collected Confirmed"
                      : "Mark as Collected"}
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  placeholder="Optional dummy notes for packaging, handoff, or customer reminders."
                  rows={4}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          {usesAddress && order.snapShotAddress ? (
            <SectionCard
              title="Shipping Address Card"
              description="Prominent destination block for the admin packaging and dispatch team."
            >
              <div className="rounded-2xl border bg-primary/5 p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                    <MapPin className="text-primary h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-lg font-bold">
                        {order.snapShotAddress.recipientName || "-"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {order.snapShotAddress.phoneNumber || "-"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {addressLines.map((line) => (
                        <p key={line} className="text-sm">
                          {line}
                        </p>
                      ))}
                    </div>
                    {order.snapShotAddress.note && (
                      <p className="text-muted-foreground text-sm">
                        Note: {order.snapShotAddress.note}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              title="Pickup / Internal Destination"
              description="No customer shipping address is required for pickup orders."
            >
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                This order does not use a shipping address. Handoff will happen
                at the warehouse or through store delivery coordination.
              </div>
            </SectionCard>
          )}

          <SectionCard
            title="Delivery To-Do List"
            description="This mirrors the intended backend flow while the server-side delivery module is still pending."
          >
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border p-4">
                <p className="font-semibold">Phase 1</p>
                <p className="text-muted-foreground mt-1">
                  Validate payment, production completion, address, and the full
                  item checklist.
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="font-semibold">Phase 2</p>
                <p className="text-muted-foreground mt-1">
                  Capture packaged photos and fill the handoff fields for
                  courier, store delivery, or pickup.
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="font-semibold">Phase 3</p>
                <p className="text-muted-foreground mt-1">
                  Simulate status transition from READY_TO_SHIP to SHIPPED,
                  show a success toast, then redirect back to the orders
                  dashboard.
                </p>
              </div>
            </div>
          </SectionCard>

          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b py-5">
              <CardTitle className="text-base">
                Phase 3: Status Transition
              </CardTitle>
              <CardDescription>
                Dummy submission preview before backend integration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 py-5">
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-muted-foreground text-xs uppercase">
                  Database Sync Preview
                </p>
                <p className="mt-2 text-sm font-semibold">
                  orderStatus: {displayStatus} → SHIPPED
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  {handoffSnapshot.summary}
                </p>
                {adminNotes.trim() && (
                  <p className="text-muted-foreground mt-2 text-sm">
                    Admin note preview: {adminNotes.trim()}
                  </p>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span>Checklist completed</span>
                  <span
                    className={
                      checklistComplete
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                    }
                  >
                    {checklistComplete ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span>Photo evidence ready</span>
                  <span
                    className={
                      evidenceReady
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                    }
                  >
                    {evidenceReady ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span>Conditional handoff complete</span>
                  <span
                    className={
                      handoffValid
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                    }
                  >
                    {handoffValid ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t py-5">
              <Button
                className="w-full gap-2"
                onClick={handleDispatch}
                disabled={!canSubmit || submitting}
              >
                {submitting ? (
                  "Dispatching..."
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {isPickup ? "Finalize Pickup Handoff" : "Dispatch Order"}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
};
