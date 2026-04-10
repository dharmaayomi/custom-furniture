"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { toast } from "sonner";
import useAxios from "@/hooks/useAxios";
import useCreateSnapPayment from "@/hooks/api/payment/useCreateSnapPayment";
import useGetOrder from "@/hooks/api/order/useGetOrder";
import {
  PaymentInstruction,
  PaymentInstructionValue,
} from "@/features/dashboard/billing/components/PaymentInstruction";
import { formatPrice } from "@/lib/price";
import { getApiErrorMessage } from "@/lib/api-error";
import { PaymentInstructionMethod } from "@/lib/bankInstruction";
import {
  CheckoutOrderSnapshot,
  loadCheckoutSnapshot,
} from "@/lib/checkoutStorage";
import {
  deliveryTypeUsesAddress,
  formatDeliveryDistance,
  getDeliveryTypeLabel,
} from "@/lib/deliveryType";
import { CustomOrderPayment, SnapshotAddress } from "@/types/customOrder";
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
import { cn } from "@/lib/utils";
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
  CheckCircle2,
} from "lucide-react";

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

const formatDateTimeDDMMYYYY = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

type CorePaymentMethod =
  | "qris"
  | "gopay"
  | "bca_va"
  | "bni_va"
  | "bri_va"
  | "mandiri_bill"
  | "permata_va"
  | "cimb_va";

const corePaymentMethodLabel: Record<CorePaymentMethod, string> = {
  qris: "QRIS",
  gopay: "GoPay",
  bca_va: "BCA Virtual Account",
  bni_va: "BNI Virtual Account",
  bri_va: "BRI Virtual Account",
  mandiri_bill: "Mandiri Bill Payment",
  permata_va: "Permata Virtual Account",
  cimb_va: "CIMB Virtual Account",
};

const paymentMethodOptions: Array<{
  value: CorePaymentMethod;
  label: string;
  iconPath: string;
  iconAlt: string;
}> = [
  {
    value: "qris",
    label: "QRIS",
    iconPath: "/assets/payment-icons/qris.png",
    iconAlt: "QRIS logo",
  },
  {
    value: "gopay",
    label: "GoPay",
    iconPath: "/assets/payment-icons/gopay.png",
    iconAlt: "GoPay logo",
  },
  {
    value: "bca_va",
    label: "BCA Virtual Account",
    iconPath: "/assets/payment-icons/bca.svg",
    iconAlt: "BCA logo",
  },
  {
    value: "bni_va",
    label: "BNI Virtual Account",
    iconPath: "/assets/payment-icons/bni.png",
    iconAlt: "BNI logo",
  },
  {
    value: "bri_va",
    label: "BRI Virtual Account",
    iconPath: "/assets/payment-icons/bri.svg",
    iconAlt: "BRI logo",
  },
  {
    value: "mandiri_bill",
    label: "Mandiri Bill Payment",
    iconPath: "/assets/payment-icons/mandiri.webp",
    iconAlt: "Bank Mandiri logo",
  },
  {
    value: "permata_va",
    label: "Permata Virtual Account",
    iconPath: "/assets/payment-icons/permata.png",
    iconAlt: "Permata Bank logo",
  },
  {
    value: "cimb_va",
    label: "CIMB Virtual Account",
    iconPath: "/assets/payment-icons/cimb.png",
    iconAlt: "CIMB logo",
  },
];

type PaymentGroup = {
  label: string;
  methods: {
    code: CorePaymentMethod;
    displayName: string;
    iconPath: string;
    iconAlt: string;
  }[];
};

const paymentMethodGroups: PaymentGroup[] = [
  {
    label: "E-Wallet",
    methods: paymentMethodOptions
      .filter((item) => item.value === "qris" || item.value === "gopay")
      .map((item) => ({
        code: item.value,
        displayName: item.label,
        iconPath: item.iconPath,
        iconAlt: item.iconAlt,
      })),
  },
  {
    label: "Virtual Account",
    methods: paymentMethodOptions
      .filter((item) => item.value !== "qris" && item.value !== "gopay")
      .map((item) => ({
        code: item.value,
        displayName: item.label,
        iconPath: item.iconPath,
        iconAlt: item.iconAlt,
      })),
  },
];

function PaymentMethodSelector({
  value,
  onChange,
  disabled,
}: {
  value: CorePaymentMethod | null;
  onChange: (value: CorePaymentMethod) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      {paymentMethodGroups.map((group) => (
        <div key={group.label} className="space-y-1.5">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
            {group.label}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {group.methods.map((method) => {
              const isSelected = value === method.code;
              return (
                <button
                  key={method.code}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(method.code)}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
                    "disabled:pointer-events-none disabled:opacity-50",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-background hover:border-primary/40 hover:bg-muted/40",
                  )}
                >
                  {isSelected ? (
                    <span className="text-primary absolute top-1.5 right-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                  <img
                    src={method.iconPath}
                    alt={method.iconAlt}
                    className="h-5 w-12 shrink-0 object-contain"
                    loading="lazy"
                  />
                  <span
                    className={cn(
                      "truncate leading-none font-medium",
                      isSelected ? "text-primary" : "text-foreground",
                    )}
                  >
                    {method.displayName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const buildCorePayload = (method: CorePaymentMethod) => {
  switch (method) {
    case "gopay":
      return { payment_type: "gopay" };
    case "qris":
      return { payment_type: "qris" };
    case "permata_va":
      return {
        payment_type: "bank_transfer",
        bank_transfer: { bank: "permata" },
      };
    case "mandiri_bill":
      return {
        payment_type: "echannel",
        echannel: {
          bill_info1: "Payment:",
          bill_info2: "Order",
        },
      };
    case "cimb_va":
      return {
        payment_type: "bank_transfer",
        bank_transfer: { bank: "cimb" },
      };
    case "bca_va":
      return {
        payment_type: "bank_transfer",
        bank_transfer: { bank: "bca" },
      };
    case "bni_va":
      return {
        payment_type: "bank_transfer",
        bank_transfer: { bank: "bni" },
      };
    case "bri_va":
      return {
        payment_type: "bank_transfer",
        bank_transfer: { bank: "bri" },
      };
    default:
      return { payment_type: "qris" };
  }
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

const inferInstructionMethodFromPayment = (
  payment?: Pick<
    CustomOrderPayment,
    "paymentType" | "midtransPaymentType" | "midtransBank"
  > | null,
): PaymentInstructionMethod => {
  const bank = String(payment?.midtransBank ?? "").toLowerCase();
  if (bank === "bca") return "bca_va";
  if (bank === "bni") return "bni_va";
  if (bank === "bri") return "bri_va";
  if (bank === "permata") return "permata_va";
  if (bank === "cimb") return "cimb_va";
  if (bank === "mandiri") return "mandiri_bill";

  const midtransType = String(payment?.midtransPaymentType ?? "").toLowerCase();
  if (midtransType === "qris") return "qris";
  if (midtransType === "gopay") return "gopay";
  if (midtransType === "echannel") return "mandiri_bill";

  const paymentType = String(payment?.paymentType ?? "").toLowerCase();
  if (paymentType.includes("qris")) return "qris";
  if (paymentType.includes("gopay")) return "gopay";
  if (paymentType.includes("echannel")) return "mandiri_bill";

  return "qris";
};

const buildInstructionFromPayment = (
  payment?: CustomOrderPayment | null,
): PaymentInstructionValue | null => {
  if (!payment) return null;

  const parsedReference = parsePaymentReference(payment.midtransReference);
  const vaNumbers = Array.isArray(parsedReference?.va_numbers)
    ? parsedReference.va_numbers
        .filter((item) => item?.va_number)
        .map((item) => ({
          bank: String(item.bank ?? payment.midtransBank ?? "bank"),
          va_number: String(item.va_number),
        }))
    : [];

  const next: PaymentInstructionValue = {
    method: inferInstructionMethodFromPayment(payment),
    vaNumbers,
    permataVaNumber: parsedReference?.permata_va_number ?? null,
    qrString: parsedReference?.qr_string ?? null,
    billKey: parsedReference?.bill_key ?? null,
    billerCode: parsedReference?.biller_code ?? null,
  };

  const hasInstruction =
    next.vaNumbers.length > 0 ||
    Boolean(next.permataVaNumber) ||
    Boolean(next.qrString) ||
    Boolean(next.billKey) ||
    Boolean(next.billerCode);

  return hasInstruction ? next : null;
};

export const CheckoutPageNew = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const axiosInstance = useAxios();
  const { mutateAsync: createSnapPayment, isPending: isCreatingSnapPayment } =
    useCreateSnapPayment();
  const [paymentMethod, setPaymentMethod] = useState<CorePaymentMethod | null>(
    null,
  );
  const [paymentInstruction, setPaymentInstruction] =
    useState<PaymentInstructionValue | null>(null);
  const [paymentRedirectUrl, setPaymentRedirectUrl] = useState<string | null>(
    null,
  );
  const [snapshot, setSnapshot] = useState<CheckoutOrderSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(loadCheckoutSnapshot());
  }, []);

  const urlOrderId = searchParams.get("orderId") ?? "";
  const orderId = urlOrderId || snapshot?.orderId || "";
  const { data: order } = useGetOrder(orderId || undefined);
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
  const createdAtLabel = formatDateTimeDDMMYYYY(
    order?.createdAt ?? snapshot?.createdAt ?? null,
  );

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
  const activePendingPayment = useMemo(() => {
    const sorted = [...(order?.payments ?? [])].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return sorted.find((payment) => {
      const status = String(payment.status ?? "").toUpperCase();
      return status === "WAITING_FOR_PAYMENT" || status === "CHALLENGE";
    });
  }, [order?.payments]);
  const activePendingInstruction = useMemo(
    () => buildInstructionFromPayment(activePendingPayment),
    [activePendingPayment],
  );
  const activePendingFallbackReference =
    activePendingPayment?.midtransReference ?? activePendingPayment?.id ?? null;
  const displayedInstruction = activePendingInstruction ?? paymentInstruction;

  useEffect(() => {
    const pendingUrl = activePendingPayment?.paymentUrl?.trim() || "";
    if (!pendingUrl) return;
    if (paymentRedirectUrl) return;
    setPaymentRedirectUrl(pendingUrl);
  }, [activePendingPayment?.paymentUrl, paymentRedirectUrl]);

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
  const totalWeightKg = Number(order?.totalWeight ?? 0);
  const grandTotal = Number(
    order?.grandTotalPrice ?? snapshot?.grandTotal ?? 0,
  );
  const usesAddress = deliveryTypeUsesAddress(deliveryType);
  const isPayable =
    Boolean(orderId) && status !== "CANCELLED" && status !== "COMPLETED";
  const canCreatePayment = isPayable && Boolean(paymentMethod);

  const handlePayNow = async () => {
    if (!orderId) {
      toast.error("Order not found.");
      return;
    }
    if (!isPayable) {
      toast.info("This order can no longer receive payment.");
      return;
    }
    if (!paymentMethod) {
      toast.error("Select a payment method first.");
      return;
    }
    const pendingUrl = activePendingPayment?.paymentUrl?.trim() || "";
    if (pendingUrl) {
      setPaymentRedirectUrl(pendingUrl);
      toast.info(
        "You already have an active payment invoice. Complete it first.",
      );
      return;
    }
    try {
      const payment = await createSnapPayment({
        orderId,
        channel: "CORE",
        corePayload: buildCorePayload(paymentMethod),
      });
      const paymentUrl =
        payment?.paymentUrl?.trim() ??
        payment?.actions?.find((item) => item?.url)?.url?.trim() ??
        "";
      const hasInstruction =
        (payment?.vaNumbers?.length ?? 0) > 0 ||
        Boolean(payment?.permataVaNumber) ||
        Boolean(payment?.qrString) ||
        Boolean(payment?.billKey) ||
        Boolean(payment?.billerCode);

      setPaymentInstruction(
        hasInstruction
          ? {
              method: paymentMethod,
              vaNumbers: payment?.vaNumbers ?? [],
              permataVaNumber: payment?.permataVaNumber ?? null,
              qrString: payment?.qrString ?? null,
              billKey: payment?.billKey ?? null,
              billerCode: payment?.billerCode ?? null,
            }
          : null,
      );
      setPaymentRedirectUrl(paymentUrl || null);

      if (!paymentUrl && !hasInstruction) {
        toast.error("Payment data is missing.");
        return;
      }

      toast.success("Payment created. Continue with the details below.");
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Failed to create payment transaction.",
      );
      if (message.includes("No invoice available for this phase yet")) {
        toast.error(
          "Invoice tahap ini belum tersedia. Tunggu update progress produksi dari admin.",
        );
        return;
      }
      if (
        message.includes("status code: 406") ||
        message.toLowerCase().includes("conflict with the current state")
      ) {
        toast.error(
          "Active payment invoice already exists. Please continue the existing payment first.",
        );
        return;
      }
      toast.error(message);
    }
  };

  return (
    <main className="container mx-auto min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>Orders</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Checkout</span>
        </div>
      </div>

      <div className="mx-auto grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
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
                                        x{component.quantity}
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

        <aside className="lg:sticky lg:top-22 lg:col-span-2 lg:h-fit">
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
              <div className="bg-muted/40 flex items-center justify-between rounded-xl p-3">
                <p className="text-sm font-semibold">#{displayOrderNumber}</p>
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

              <div className="grid grid-cols-2 gap-3">
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
                <div className="bg-muted/40 flex flex-col gap-1 rounded-xl p-3">
                  <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] tracking-wide uppercase">
                    <Clock className="h-3 w-3" />
                    Created
                  </span>
                  <span className="text-sm leading-snug font-semibold">
                    {createdAtLabel}
                  </span>
                </div>
                <div className="bg-muted/40 flex flex-col gap-1 rounded-xl p-3">
                  <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] tracking-wide uppercase">
                    <Weight className="h-3 w-3" />
                    Weight
                  </span>
                  <span className="text-sm font-semibold">
                    {totalWeightKg.toFixed(2)} kg
                  </span>
                </div>
                <div className="bg-muted/40 flex flex-col gap-1 rounded-xl p-3">
                  <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] tracking-wide uppercase">
                    <Ruler className="h-3 w-3" />
                    Distance
                  </span>
                  <span className="text-sm font-semibold">
                    {formatDeliveryDistance(deliveryType, deliveryDistance)}
                  </span>
                </div>
              </div>

              {usesAddress && address ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="text-primary h-4 w-4" />
                    Delivery Address
                  </div>
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
                </div>
              ) : null}

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

              <div className="bg-muted/40 flex items-center justify-between rounded-xl px-4 py-3">
                <span className="text-sm font-semibold">Grand Total</span>
                <span className="text-xl font-bold tracking-tight">
                  {formatPrice(grandTotal)}
                </span>
              </div>

              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Payment Method
                </p>
                <PaymentMethodSelector
                  value={paymentMethod}
                  onChange={(value) => {
                    setPaymentInstruction(null);
                    setPaymentRedirectUrl(null);
                    setPaymentMethod(value);
                  }}
                  disabled={isCreatingSnapPayment}
                />
              </div>

              <Button
                className="w-full gap-2 font-semibold"
                size="lg"
                onClick={handlePayNow}
                disabled={!canCreatePayment || isCreatingSnapPayment}
              >
                {isCreatingSnapPayment ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    {paymentMethod
                      ? `Pay Now (${corePaymentMethodLabel[paymentMethod]})`
                      : "Pay Now"}
                  </>
                )}
              </Button>

              {displayedInstruction ? (
                <div className="space-y-2">
                  {activePendingPayment ? (
                    <div className="bg-muted/40 space-y-1 rounded-xl p-3 text-xs">
                      <p className="font-semibold">Active Payment Invoice</p>
                      <p>
                        Phase:{" "}
                        <span className="font-medium">
                          {activePendingPayment.phase}
                        </span>
                      </p>
                      <p>
                        Method:{" "}
                        <span className="font-medium">
                          {activePendingPayment.midtransBank ??
                            activePendingPayment.midtransPaymentType ??
                            activePendingPayment.paymentType ??
                            (paymentMethod
                              ? corePaymentMethodLabel[paymentMethod]
                              : "-")}
                        </span>
                      </p>
                    </div>
                  ) : null}
                  <PaymentInstruction value={displayedInstruction} />
                </div>
              ) : null}

              {activePendingPayment && !activePendingInstruction ? (
                <div className="bg-muted/40 space-y-1 rounded-xl p-3 text-xs">
                  <p className="font-semibold">Active Payment Invoice</p>
                  <p>
                    Phase:{" "}
                    <span className="font-medium">
                      {activePendingPayment.phase}
                    </span>
                  </p>
                  {activePendingFallbackReference ? (
                    <p>
                      Ref:{" "}
                      <span className="font-mono font-semibold">
                        {activePendingFallbackReference}
                      </span>
                    </p>
                  ) : null}
                  <p>
                    Method:{" "}
                    <span className="font-medium">
                      {activePendingPayment.midtransBank ??
                        activePendingPayment.midtransPaymentType ??
                        activePendingPayment.paymentType ??
                        "-"}
                    </span>
                  </p>
                </div>
              ) : null}

              {paymentRedirectUrl ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.assign(paymentRedirectUrl)}
                >
                  Open Payment Page
                </Button>
              ) : null}

              {!isPayable && (
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
