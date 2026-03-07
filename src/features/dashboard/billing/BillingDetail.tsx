// "use client";

// import { useState } from "react";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Skeleton } from "@/components/ui/skeleton";
// import useCreateSnapPayment from "@/hooks/api/order/useCreateSnapPayment";
// import useGetOrder from "@/hooks/api/order/useGetOrder";
// import { getApiErrorMessage } from "@/lib/api-error";
// import { formatPrice } from "@/lib/price";
// import { getStatusBadgeClass } from "@/lib/statusStyles";
// import { OrderStatus, PaymentPhase } from "@/types/customOrder";
// import { ArrowLeft, CreditCard } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";

// type StepState = "completed" | "current" | "upcoming";

// type PhaseStep = {
//   phase: PaymentPhase;
//   label: string;
//   amount: number;
//   state: StepState;
// };

// const PHASE_LABEL: Record<PaymentPhase, string> = {
//   DP: "DP",
//   PROGRESS_1: "Progress 1",
//   PROGRESS_2: "Progress 2",
//   FINAL: "Final",
// };

// const phaseOrder: PaymentPhase[] = ["DP", "PROGRESS_1", "PROGRESS_2", "FINAL"];

// const statusLabel: Record<OrderStatus, string> = {
//   PENDING_PAYMENT: "Waiting Payment",
//   AWAITING_PRODUCTION: "Awaiting Production",
//   IN_PRODUCTION: "In Production",
//   READY_TO_SHIP: "Ready to Ship",
//   SHIPPED: "Shipped",
//   COMPLETED: "Completed",
//   CANCELLED: "Cancelled",
// };

// const statusTone: Record<
//   OrderStatus,
//   "warning" | "info" | "success" | "danger"
// > = {
//   PENDING_PAYMENT: "warning",
//   AWAITING_PRODUCTION: "warning",
//   IN_PRODUCTION: "warning",
//   READY_TO_SHIP: "info",
//   SHIPPED: "info",
//   COMPLETED: "success",
//   CANCELLED: "danger",
// };

// const inferPhaseFromStatus = (status: OrderStatus): PaymentPhase => {
//   if (status === "PENDING_PAYMENT") return "DP";
//   if (status === "AWAITING_PRODUCTION") return "PROGRESS_1";
//   if (status === "IN_PRODUCTION") return "PROGRESS_1";
//   if (status === "READY_TO_SHIP") return "PROGRESS_2";
//   return "FINAL";
// };

// const buildPhaseSteps = (
//   totalPrice: number,
//   currentPhase: PaymentPhase,
// ): PhaseStep[] => {
//   const phaseAmount = totalPrice / 4;
//   const currentIndex = Math.max(0, phaseOrder.indexOf(currentPhase));

//   return phaseOrder.map((phase, index) => {
//     const state: StepState =
//       index < currentIndex
//         ? "completed"
//         : index === currentIndex
//           ? "current"
//           : "upcoming";
//     return {
//       phase,
//       label: PHASE_LABEL[phase],
//       amount: phaseAmount,
//       state,
//     };
//   });
// };

// const stepCircleClass = (state: StepState) => {
//   if (state === "completed") return "bg-primary text-primary-foreground";
//   if (state === "current")
//     return "ring-primary text-primary bg-background ring-2";
//   return "bg-muted text-muted-foreground";
// };

// const stepLineClass = (state: StepState) =>
//   state === "completed" ? "bg-primary" : "bg-border";

// type BillingDetailProps = {
//   orderId: string;
// };

// type CorePaymentMethod =
//   | "qris"
//   | "gopay"
//   | "bca_va"
//   | "bni_va"
//   | "bri_va"
//   | "permata_va";

// const corePaymentMethodLabel: Record<CorePaymentMethod, string> = {
//   qris: "QRIS",
//   gopay: "GoPay",
//   bca_va: "BCA Virtual Account",
//   bni_va: "BNI Virtual Account",
//   bri_va: "BRI Virtual Account",
//   permata_va: "Permata Virtual Account",
// };

// const buildCorePayload = (method: CorePaymentMethod) => {
//   switch (method) {
//     case "gopay":
//       return { payment_type: "gopay" };
//     case "qris":
//       return { payment_type: "qris" };
//     case "permata_va":
//       return { payment_type: "permata" };
//     case "bca_va":
//       return {
//         payment_type: "bank_transfer",
//         bank_transfer: { bank: "bca" },
//       };
//     case "bni_va":
//       return {
//         payment_type: "bank_transfer",
//         bank_transfer: { bank: "bni" },
//       };
//     case "bri_va":
//       return {
//         payment_type: "bank_transfer",
//         bank_transfer: { bank: "bri" },
//       };
//     default:
//       return { payment_type: "qris" };
//   }
// };

// export const BillingDetail = ({ orderId }: BillingDetailProps) => {
//   const router = useRouter();
//   const { data: order, isLoading, isError } = useGetOrder(orderId);
//   const { mutateAsync: createSnapPayment, isPending: isCreatingSnapPayment } =
//     useCreateSnapPayment();
//   const [paymentMethod, setPaymentMethod] = useState<CorePaymentMethod>("qris");
//   const [paymentInstruction, setPaymentInstruction] = useState<{
//     vaNumbers: Array<{ bank: string; va_number: string }>;
//     permataVaNumber: string | null;
//     qrString: string | null;
//   } | null>(null);

//   if (isLoading) {
//     return (
//       <section className="space-y-4">
//         <Skeleton className="h-10 w-48" />
//         <Skeleton className="h-40 w-full rounded-xl" />
//         <Skeleton className="h-52 w-full rounded-xl" />
//       </section>
//     );
//   }

//   if (isError || !order) {
//     return (
//       <Card>
//         <CardHeader>
//           <CardTitle>Billing Detail</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-3">
//           <p className="text-sm">Order not found.</p>
//           <Button
//             variant="outline"
//             onClick={() => router.push("/dashboard/billing")}
//           >
//             Back
//           </Button>
//         </CardContent>
//       </Card>
//     );
//   }

//   const currentPhase =
//     order.currentPaymentPhase ?? inferPhaseFromStatus(order.status);
//   const steps = buildPhaseSteps(
//     Number(order.grandTotalPrice ?? 0),
//     currentPhase,
//   );
//   const orderRef = order.orderNumber?.trim() || order.id;
//   const remainingAmount = Number(order.remaining ?? 0);
//   const payableAmount = Math.max(
//     0,
//     remainingAmount || steps.find((s) => s.state === "current")?.amount || 0,
//   );
//   const isPayable =
//     order.status !== "CANCELLED" &&
//     order.status !== "COMPLETED" &&
//     payableAmount > 0;

//   const handlePayNow = async () => {
//     if (!isPayable) {
//       toast.info("This order is not payable.");
//       return;
//     }

//     try {
//       const payment = await createSnapPayment({
//         orderId: order.id,
//         channel: "CORE",
//         corePayload: buildCorePayload(paymentMethod),
//       });
//       const paymentUrl =
//         payment?.paymentUrl?.trim() ??
//         payment?.actions?.find((item) => item?.url)?.url?.trim() ??
//         "";
//       if (!paymentUrl) {
//         const hasInstruction =
//           (payment?.vaNumbers?.length ?? 0) > 0 ||
//           Boolean(payment?.permataVaNumber) ||
//           Boolean(payment?.qrString);

//         if (!hasInstruction) {
//           toast.error("Payment URL is missing.");
//           return;
//         }

//         setPaymentInstruction({
//           vaNumbers: payment?.vaNumbers ?? [],
//           permataVaNumber: payment?.permataVaNumber ?? null,
//           qrString: payment?.qrString ?? null,
//         });
//         toast.success("Payment instruction generated.");
//         return;
//       }
//       setPaymentInstruction(null);
//       toast.info("Redirecting to payment gateway...");
//       window.location.assign(paymentUrl);
//     } catch (error) {
//       const message = getApiErrorMessage(
//         error,
//         "Failed to create payment transaction.",
//       );
//       if (message.includes("No invoice available for this phase yet")) {
//         toast.error(
//           "Invoice tahap ini belum tersedia. Tunggu update progress produksi dari admin.",
//         );
//         return;
//       }
//       toast.error(message);
//     }
//   };

//   return (
//     <section className="space-y-6">
//       <div className="flex items-center justify-between gap-3">
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => router.push("/dashboard/billing")}
//         >
//           <ArrowLeft className="mr-1 h-4 w-4" />
//           Back
//         </Button>
//         <Badge className={getStatusBadgeClass(statusTone[order.status])}>
//           {statusLabel[order.status]}
//         </Badge>
//       </div>

//       <Card className="py-4">
//         <CardHeader className="space-y-4">
//           <CardTitle>Order #{orderRef}</CardTitle>
//           <div className="grid gap-3 sm:grid-cols-3">
//             <div className="bg-muted/40 rounded-lg p-3 text-sm">
//               <p className="text-muted-foreground">Grand Total</p>
//               <p className="font-semibold">
//                 {formatPrice(Number(order.grandTotalPrice ?? 0))}
//               </p>
//             </div>
//             <div className="bg-muted/40 rounded-lg p-3 text-sm">
//               <p className="text-muted-foreground">Total Paid</p>
//               <p className="font-semibold">
//                 {formatPrice(Number(order.totalPaid ?? 0))}
//               </p>
//             </div>
//             <div className="bg-muted/40 rounded-lg p-3 text-sm">
//               <p className="text-muted-foreground">Remaining</p>
//               <p className="font-semibold">{formatPrice(remainingAmount)}</p>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="space-y-3">
//             <p className="text-sm font-semibold">Payment Stepper</p>
//             <div className="grid grid-cols-4 gap-2">
//               {steps.map((step, index) => (
//                 <div key={step.phase}>
//                   <div className="flex items-center">
//                     <div
//                       className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${stepCircleClass(step.state)}`}
//                     >
//                       {index + 1}
//                     </div>
//                     {index < steps.length - 1 ? (
//                       <div
//                         className={`mx-1 h-1 flex-1 rounded ${stepLineClass(step.state)}`}
//                       />
//                     ) : null}
//                   </div>
//                   <p className="mt-2 text-xs font-medium">{step.label}</p>
//                   <p className="text-muted-foreground text-[11px]">
//                     {formatPrice(step.amount)}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <Separator />

//           <div className="space-y-1.5">
//             <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
//               Payment Method
//             </p>
//             <Select
//               value={paymentMethod}
//               onValueChange={(value) => {
//                 setPaymentInstruction(null);
//                 setPaymentMethod(value as CorePaymentMethod);
//               }}
//             >
//               <SelectTrigger className="w-full">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="qris">QRIS</SelectItem>
//                 <SelectItem value="gopay">GoPay</SelectItem>
//                 <SelectItem value="bca_va">BCA VA</SelectItem>
//                 <SelectItem value="bni_va">BNI VA</SelectItem>
//                 <SelectItem value="bri_va">BRI VA</SelectItem>
//                 <SelectItem value="permata_va">Permata VA</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <Button
//             className="w-full"
//             onClick={handlePayNow}
//             disabled={!isPayable || isCreatingSnapPayment}
//           >
//             {isCreatingSnapPayment ? (
//               "Redirecting..."
//             ) : (
//               <>
//                 <CreditCard className="mr-2 h-4 w-4" />
//                 Pay {PHASE_LABEL[currentPhase]} ({formatPrice(payableAmount)}) -{" "}
//                 {corePaymentMethodLabel[paymentMethod]}
//               </>
//             )}
//           </Button>

//           {paymentInstruction ? (
//             <div className="bg-muted/40 space-y-2 rounded-xl p-3 text-xs">
//               {paymentInstruction.vaNumbers.map((item) => (
//                 <p key={`${item.bank}-${item.va_number}`}>
//                   {item.bank.toUpperCase()} VA:{" "}
//                   <span className="font-semibold">{item.va_number}</span>
//                 </p>
//               ))}
//               {paymentInstruction.permataVaNumber ? (
//                 <p>
//                   Permata VA:{" "}
//                   <span className="font-semibold">
//                     {paymentInstruction.permataVaNumber}
//                   </span>
//                 </p>
//               ) : null}
//               {paymentInstruction.qrString ? (
//                 <p className="break-all">
//                   QR String:{" "}
//                   <span className="font-semibold">
//                     {paymentInstruction.qrString}
//                   </span>
//                 </p>
//               ) : null}
//             </div>
//           ) : null}

//           {!isPayable ? (
//             <p className="text-muted-foreground text-center text-xs">
//               This order is no longer payable.
//             </p>
//           ) : null}
//         </CardContent>
//       </Card>
//     </section>
//   );
// };
"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import useCreateSnapPayment from "@/hooks/api/order/useCreateSnapPayment";
import useGetOrder from "@/hooks/api/order/useGetOrder";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatPrice } from "@/lib/price";
import { getStatusBadgeClass } from "@/lib/statusStyles";
import {
  CustomOrderPayment,
  OrderStatus,
  PaymentPhase,
} from "@/types/customOrder";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type StepState = "completed" | "current" | "upcoming";

type PhaseStep = {
  phase: PaymentPhase;
  label: string;
  amount: number;
  state: StepState;
};

const PHASE_LABEL: Record<PaymentPhase, string> = {
  DP: "DP",
  PROGRESS_1: "Progress 1",
  PROGRESS_2: "Progress 2",
  FINAL: "Final",
};

const phaseOrder: PaymentPhase[] = ["DP", "PROGRESS_1", "PROGRESS_2", "FINAL"];

const statusLabel: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Waiting Payment",
  AWAITING_PRODUCTION: "Awaiting Production",
  IN_PRODUCTION: "In Production",
  READY_TO_SHIP: "Ready to Ship",
  SHIPPED: "Shipped",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusTone: Record<
  OrderStatus,
  "warning" | "info" | "success" | "danger"
> = {
  PENDING_PAYMENT: "warning",
  AWAITING_PRODUCTION: "warning",
  IN_PRODUCTION: "warning",
  READY_TO_SHIP: "info",
  SHIPPED: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
};

const inferPhaseFromStatus = (status: OrderStatus): PaymentPhase => {
  if (status === "PENDING_PAYMENT") return "DP";
  if (status === "AWAITING_PRODUCTION") return "PROGRESS_1";
  if (status === "IN_PRODUCTION") return "PROGRESS_1";
  if (status === "READY_TO_SHIP") return "PROGRESS_2";
  return "FINAL";
};

const getDefaultPhaseAmounts = (totalPrice: number) => {
  const normalizedTotal = Math.max(0, Math.ceil(totalPrice));
  const quarter = Math.floor(normalizedTotal / 4);
  const finalPortion = normalizedTotal - quarter * 3;

  return {
    DP: quarter,
    PROGRESS_1: quarter,
    PROGRESS_2: quarter,
    FINAL: finalPortion,
  } satisfies Record<PaymentPhase, number>;
};

const buildPhaseSteps = (params: {
  amountsByPhase: Record<PaymentPhase, number>;
  paidPhaseSet: Set<PaymentPhase>;
  currentPhase: PaymentPhase;
  allPaymentsDone: boolean;
}): PhaseStep[] => {
  return phaseOrder.map((phase) => {
    let state: StepState = "upcoming";

    if (params.allPaymentsDone || params.paidPhaseSet.has(phase)) {
      state = "completed";
    } else if (phase === params.currentPhase) {
      state = "current";
    }

    return {
      phase,
      label: PHASE_LABEL[phase],
      amount: params.amountsByPhase[phase],
      state,
    };
  });
};

const stepCircleClass = (state: StepState) => {
  if (state === "completed") return "bg-primary text-primary-foreground";
  if (state === "current")
    return "ring-primary text-primary bg-background ring-2";
  return "bg-muted text-muted-foreground";
};

const stepLineClass = (state: StepState) =>
  state === "completed" ? "bg-primary" : "bg-border";

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

const PAYMENT_FALLBACK: Record<
  string,
  { label: string; color: string; bg: string; iconPath?: string }
> = {
  qris: {
    label: "QRIS",
    color: "#E31937",
    bg: "#fff0f0",
    iconPath: "/assets/payment-icons/qris.png",
  },
  gopay: {
    label: "GP",
    color: "#00AED6",
    bg: "#f0faff",
    iconPath: "/assets/payment-icons/gopay.png",
  },
  bca_va: {
    label: "BCA",
    color: "#003F88",
    bg: "#f0f4ff",
    iconPath: "/assets/payment-icons/bca.svg",
  },
  bni_va: {
    label: "BNI",
    color: "#FF6600",
    bg: "#fff5f0",
    iconPath: "/assets/payment-icons/bni.png",
  },
  bri_va: {
    label: "BRI",
    color: "#003087",
    bg: "#f0f3ff",
    iconPath: "/assets/payment-icons/bri.svg",
  },
  permata_va: {
    label: "PRM",
    color: "#B0181B",
    bg: "#fff0f0",
    iconPath: "/assets/payment-icons/permata.png",
  },
  mandiri_bill: {
    label: "MDR",
    color: "#c89300",
    bg: "#fffbf0",
    iconPath: "/assets/payment-icons/mandiri.webp",
  },
  cimb_va: {
    label: "CMB",
    color: "#CC0000",
    bg: "#fff0f0",
    iconPath: "/assets/payment-icons/cimb.png",
  },
  bank_transfer: { label: "VA", color: "#0063A8", bg: "#f0f7ff" },
  echannel: {
    label: "MDR",
    color: "#c89300",
    bg: "#fffbf0",
    iconPath: "/assets/payment-icons/mandiri.webp",
  },
};

const PAYMENT_PHASE_LABEL: Record<PaymentPhase, string> = {
  DP: "Down Payment",
  PROGRESS_1: "Progress 1",
  PROGRESS_2: "Progress 2",
  FINAL: "Final Payment",
};

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; cls: string; Icon: typeof Clock }
> = {
  WAITING_FOR_PAYMENT: {
    label: "Pending",
    Icon: Clock,
    cls: "bg-amber-50 text-amber-600 border-amber-200",
  },
  CHALLENGE: {
    label: "Challenge",
    Icon: AlertCircle,
    cls: "bg-amber-50 text-amber-600 border-amber-200",
  },
  PAID: {
    label: "Paid",
    Icon: CheckCircle2,
    cls: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  EXPIRED: {
    label: "Expired",
    Icon: XCircle,
    cls: "bg-zinc-100 text-zinc-500 border-zinc-200",
  },
  CANCELLED: {
    label: "Cancelled",
    Icon: XCircle,
    cls: "bg-rose-50 text-rose-500 border-rose-200",
  },
  DENIED: {
    label: "Denied",
    Icon: AlertCircle,
    cls: "bg-rose-50 text-rose-500 border-rose-200",
  },
  FAILED: {
    label: "Failed",
    Icon: AlertCircle,
    cls: "bg-rose-50 text-rose-500 border-rose-200",
  },
  REFUND: {
    label: "Refunded",
    Icon: RefreshCw,
    cls: "bg-blue-50 text-blue-500 border-blue-200",
  },
};

const getPaymentLogoKey = (payment: CustomOrderPayment) => {
  const bank = String(payment.midtransBank ?? "").toLowerCase();
  if (bank === "bca") return "bca_va";
  if (bank === "bni") return "bni_va";
  if (bank === "bri") return "bri_va";
  if (bank === "permata") return "permata_va";
  if (bank === "cimb") return "cimb_va";

  const midtransType = String(payment.midtransPaymentType ?? "").toLowerCase();
  if (midtransType === "qris") return "qris";
  if (midtransType === "gopay") return "gopay";
  if (midtransType === "echannel") return "mandiri_bill";

  const paymentType = String(payment.paymentType ?? "").toLowerCase();
  if (paymentType === "qris") return "qris";
  if (paymentType === "gopay") return "gopay";
  if (paymentType === "echannel") return "mandiri_bill";
  return paymentType || "bank_transfer";
};

const formatPaymentDate = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseMandiriReference = (value?: string | null) => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as
      | { bill_key?: string; biller_code?: string }
      | undefined;
    if (!parsed) return null;
    if (!parsed.bill_key && !parsed.biller_code) return null;
    return parsed;
  } catch {
    return null;
  }
};

function PaymentLogo({ payment }: { payment: CustomOrderPayment }) {
  const key = getPaymentLogoKey(payment);
  const fallback = PAYMENT_FALLBACK[key] ?? PAYMENT_FALLBACK.bank_transfer;
  return (
    <div className="flex h-5 w-12 shrink-0 items-center justify-center">
      {fallback.iconPath ? (
        <img
          src={fallback.iconPath}
          alt={key}
          className="h-5 w-12 object-contain"
          loading="lazy"
        />
      ) : (
        <span
          className="text-[10px] font-bold tracking-tight"
          style={{ color: fallback.color }}
        >
          {fallback.label}
        </span>
      )}
    </div>
  );
}

function MetaItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium tracking-wide text-zinc-400 uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-xs text-zinc-600",
          highlight && "font-semibold text-emerald-600",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PaymentHistoryCard({ payment }: { payment: CustomOrderPayment }) {
  const normalizedStatus = String(payment.status ?? "").toUpperCase();
  const config =
    PAYMENT_STATUS_CONFIG[normalizedStatus] ?? PAYMENT_STATUS_CONFIG.FAILED;
  const Icon = config.Icon;
  const phaseLabel = PAYMENT_PHASE_LABEL[payment.phase] ?? payment.phase;
  const paymentId = payment.id;
  const mandiriRef = parseMandiriReference(payment.midtransReference);
  const referenceDisplay = mandiriRef
    ? `Biller ${mandiriRef.biller_code ?? "-"} · Bill ${mandiriRef.bill_key ?? "-"}`
    : String(payment.midtransReference ?? payment.id);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 p-4 pb-3">
        <PaymentLogo payment={payment} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <p className="text-sm leading-tight font-semibold text-zinc-900">
              {phaseLabel}
            </p>
            <span className="text-sm text-zinc-300">·</span>
            <p className="text-sm font-semibold text-zinc-900">
              {formatPrice(Number(payment.amount ?? 0))}
            </p>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-zinc-400">
            {payment.midtransBank ??
              payment.midtransPaymentType ??
              payment.paymentType ??
              "—"}
            <span className="mx-1.5 text-zinc-200">|</span>
            <span className="font-mono">Payment ID: {paymentId}</span>
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
            config.cls,
          )}
        >
          <Icon size={11} />
          {config.label}
        </span>
      </div>

      <div className="mx-4 border-t border-dashed border-zinc-100" />

      <div className="grid grid-cols-3 gap-x-4 gap-y-1 px-4 py-3">
        <MetaItem label="Dibuat" value={formatPaymentDate(payment.createdAt)} />
        <MetaItem
          label="Dibayar"
          value={formatPaymentDate(payment.paidAt)}
          highlight={Boolean(payment.paidAt)}
        />
        <MetaItem
          label="Kedaluwarsa"
          value={formatPaymentDate(payment.expiresAt)}
        />
      </div>

      <div className="px-4 pb-3">
        <MetaItem label="Reference" value={referenceDisplay} />
      </div>

      {payment.paymentUrl ? (
        <div className="px-4 pb-3.5">
          <a
            href={payment.paymentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[11px] font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ExternalLink size={11} />
            Buka Halaman Pembayaran
          </a>
        </div>
      ) : null}
    </div>
  );
}

// ─── Payment method groups ───────────────────────────────────────────────────

type PaymentGroup = {
  label: string;
  methods: {
    code: CorePaymentMethod;
    displayName: string;
    iconPath: string;
    iconAlt: string;
  }[];
};

const paymentGroups: PaymentGroup[] = [
  {
    label: "E-Wallet",
    methods: [
      {
        code: "qris",
        displayName: "QRIS",
        iconPath: "/assets/payment-icons/qris.png",
        iconAlt: "QRIS logo",
      },
      {
        code: "gopay",
        displayName: "GoPay",
        iconPath: "/assets/payment-icons/gopay.png",
        iconAlt: "GoPay logo",
      },
    ],
  },
  {
    label: "Virtual Account",
    methods: [
      {
        code: "bca_va",
        displayName: "BCA Virtual Account",
        iconPath: "/assets/payment-icons/bca.svg",
        iconAlt: "BCA logo",
      },
      {
        code: "bni_va",
        displayName: "BNI Virtual Account",
        iconPath: "/assets/payment-icons/bni.png",
        iconAlt: "BNI logo",
      },
      {
        code: "bri_va",
        displayName: "BRI Virtual Account",
        iconPath: "/assets/payment-icons/bri.svg",
        iconAlt: "BRI logo",
      },
      {
        code: "permata_va",
        displayName: "Permata Virtual Account",
        iconPath: "/assets/payment-icons/permata.png",
        iconAlt: "Permata Bank logo",
      },
      {
        code: "mandiri_bill",
        displayName: "Mandiri Bill Payment",
        iconPath: "/assets/payment-icons/mandiri.webp",
        iconAlt: "Bank Mandiri logo",
      },
      {
        code: "cimb_va",
        displayName: "CIMB Virtual Account",
        iconPath: "/assets/payment-icons/cimb.png",
        iconAlt: "CIMB logo",
      },
    ],
  },
];

// ─── Payment Method Selector ──────────────────────────────────────────────────

function PaymentMethodSelector({
  value,
  onChange,
  disabled,
}: {
  value: CorePaymentMethod;
  onChange: (v: CorePaymentMethod) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      {paymentGroups.map((group) => (
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
                  {/* Selected indicator */}
                  {isSelected && (
                    <span className="text-primary absolute top-1.5 right-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <img
                    src={method.iconPath}
                    alt={method.iconAlt}
                    className="h-5 w-12 shrink-0 object-contain"
                    loading="lazy"
                  />
                  {/* Label */}
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

// ─── Main component ───────────────────────────────────────────────────────────

type BillingDetailProps = {
  orderId: string;
};

export const BillingDetail = ({ orderId }: BillingDetailProps) => {
  const router = useRouter();
  const { data: order, isLoading, isError } = useGetOrder(orderId);
  const { mutateAsync: createSnapPayment, isPending: isCreatingSnapPayment } =
    useCreateSnapPayment();
  const [paymentMethod, setPaymentMethod] = useState<CorePaymentMethod>("qris");
  const [paymentInstruction, setPaymentInstruction] = useState<{
    vaNumbers: Array<{ bank: string; va_number: string }>;
    permataVaNumber: string | null;
    qrString: string | null;
  } | null>(null);
  const [paymentRedirectUrl, setPaymentRedirectUrl] = useState<string | null>(
    null,
  );

  const orderRef = order?.orderNumber?.trim() || order?.id || orderId;
  const grandTotalAmount = Number(order?.grandTotalPrice ?? 0);
  const totalPaidAmount = Number(order?.totalPaid ?? 0);
  const remainingAmount = Number(order?.remaining ?? 0);
  const isSettledByAmount =
    remainingAmount <= 0 ||
    (grandTotalAmount > 0 && totalPaidAmount >= grandTotalAmount);
  const isSettledByStatus =
    order?.status === "READY_TO_SHIP" ||
    order?.status === "SHIPPED" ||
    order?.status === "COMPLETED";
  const allPaymentsDone = isSettledByAmount || isSettledByStatus;

  const defaultPhaseAmounts = getDefaultPhaseAmounts(grandTotalAmount);
  const latestPaymentByPhase = useMemo(() => {
    const map = new Map<
      PaymentPhase,
      {
        amount: number;
        status: string;
        createdAt: number;
      }
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
      const latest = latestPaymentByPhase.get(phase);
      if (latest?.status.toUpperCase() === "PAID") {
        set.add(phase);
      }
    }
    if (allPaymentsDone) {
      phaseOrder.forEach((phase) => set.add(phase));
    }
    return set;
  }, [allPaymentsDone, latestPaymentByPhase]);

  const currentPhase = useMemo(() => {
    if (allPaymentsDone) return "FINAL" as PaymentPhase;
    const nextUnpaid = phaseOrder.find((phase) => !paidPhaseSet.has(phase));
    if (nextUnpaid) return nextUnpaid;
    return (
      order?.currentPaymentPhase ??
      inferPhaseFromStatus(order?.status ?? "PENDING_PAYMENT")
    );
  }, [allPaymentsDone, order?.currentPaymentPhase, order?.status, paidPhaseSet]);

  const steps = useMemo(
    () =>
      buildPhaseSteps({
        amountsByPhase: phaseAmounts,
        paidPhaseSet,
        currentPhase,
        allPaymentsDone,
      }),
    [allPaymentsDone, currentPhase, paidPhaseSet, phaseAmounts],
  );

  const payableAmount = Math.max(
    0,
    latestPaymentByPhase.get(currentPhase)?.amount ??
      phaseAmounts[currentPhase] ??
      remainingAmount,
  );
  const isPayable =
    !allPaymentsDone &&
    order?.status !== "CANCELLED" &&
    order?.status !== "COMPLETED" &&
    payableAmount > 0;

  const paymentHistory = useMemo(
    () =>
      [...(order?.payments ?? [])].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [order?.payments],
  );
  const activePendingPayment = useMemo(
    () =>
      paymentHistory.find((payment) => {
        const status = String(payment.status ?? "").toUpperCase();
        return status === "WAITING_FOR_PAYMENT" || status === "CHALLENGE";
      }),
    [paymentHistory],
  );

  useEffect(() => {
    const pendingUrl = activePendingPayment?.paymentUrl?.trim() || "";
    if (!pendingUrl) return;
    if (paymentRedirectUrl) return;
    setPaymentRedirectUrl(pendingUrl);
  }, [activePendingPayment?.paymentUrl, paymentRedirectUrl]);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </section>
    );
  }

  if (isError || !order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Detail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">Order not found.</p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/billing")}
          >
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handlePayNow = async () => {
    if (!isPayable) {
      toast.info("This order is not payable.");
      return;
    }
    const pendingUrl = activePendingPayment?.paymentUrl?.trim() || "";
    if (pendingUrl) {
      setPaymentRedirectUrl(pendingUrl);
      toast.info("You already have an active payment invoice. Complete it first.");
      return;
    }

    try {
      const payment = await createSnapPayment({
        orderId: order.id,
        channel: "CORE",
        corePayload: buildCorePayload(paymentMethod),
      });
      const paymentUrl =
        payment?.paymentUrl?.trim() ??
        payment?.actions?.find((item) => item?.url)?.url?.trim() ??
        "";
      if (!paymentUrl) {
        const hasInstruction =
          (payment?.vaNumbers?.length ?? 0) > 0 ||
          Boolean(payment?.permataVaNumber) ||
          Boolean(payment?.qrString);

        if (!hasInstruction) {
          toast.error("Payment URL is missing.");
          return;
        }

        setPaymentInstruction({
          vaNumbers: payment?.vaNumbers ?? [],
          permataVaNumber: payment?.permataVaNumber ?? null,
          qrString: payment?.qrString ?? null,
        });
        toast.success("Payment instruction generated.");
        return;
      }
      setPaymentInstruction(null);
      toast.info("Redirecting to payment gateway...");
      window.location.assign(paymentUrl);
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
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/billing")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <Badge className={getStatusBadgeClass(statusTone[order.status])}>
          {statusLabel[order.status]}
        </Badge>
      </div>

      {/* Order Summary */}
      <Card className="py-4">
        <CardHeader className="space-y-4">
          <CardTitle>Order #{orderRef}</CardTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bg-muted/40 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Grand Total</p>
              <p className="font-semibold">
                {formatPrice(Number(order.grandTotalPrice ?? 0))}
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Total Paid</p>
              <p className="font-semibold">
                {formatPrice(Number(order.totalPaid ?? 0))}
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Remaining</p>
              <p className="font-semibold">{formatPrice(remainingAmount)}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Payment Stepper */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Payment Stepper</p>
            <div className="grid grid-cols-4 gap-2">
              {steps.map((step, index) => (
                <div key={step.phase}>
                  <div className="flex items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${stepCircleClass(step.state)}`}
                    >
                      {index + 1}
                    </div>
                    {index < steps.length - 1 ? (
                      <div
                        className={`mx-1 h-1 flex-1 rounded ${stepLineClass(step.state)}`}
                      />
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs font-medium">{step.label}</p>
                  <p className="text-muted-foreground text-[11px]">
                    {step.state === "completed"
                      ? formatPrice(step.amount)
                      : "Upcoming"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Payment Method</p>
            {allPaymentsDone ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-700">
                  All payments are completed
                </p>
                <p className="mt-1 text-xs text-emerald-700/90">
                  Thank you. Your payment is fully settled, please kindly await
                  the next production or shipping process.
                </p>
              </div>
            ) : (
              <PaymentMethodSelector
                value={paymentMethod}
                onChange={(v) => {
                  setPaymentInstruction(null);
                  setPaymentMethod(v);
                }}
                disabled={isCreatingSnapPayment}
              />
            )}
          </div>

          <Separator />

          {/* Payment History */}
          <div className="space-y-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Payment History</p>
              {paymentHistory.length > 0 ? (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                  {paymentHistory.length} transaksi
                </span>
              ) : null}
            </div>
            {paymentHistory.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                  <Clock size={20} className="text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-500">
                  Belum ada riwayat pembayaran
                </p>
                <p className="text-xs text-zinc-400">
                  Transaksi akan muncul di sini setelah pembayaran dilakukan
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {paymentHistory.map((payment) => (
                  <PaymentHistoryCard key={payment.id} payment={payment} />
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Pay Button */}
          <div className="space-y-3">
            {/* Summary row */}
            {isPayable && (
              <div className="bg-muted/40 flex items-center justify-between rounded-lg px-3 py-2 text-sm">
                <span className="text-muted-foreground">
                  {PHASE_LABEL[currentPhase]} via{" "}
                  {corePaymentMethodLabel[paymentMethod]}
                </span>
                <span className="font-semibold">
                  {formatPrice(payableAmount)}
                </span>
              </div>
            )}

            {allPaymentsDone ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700">
                All payments are done. Thank you, please kindly await the next
                process.
              </div>
            ) : (
              <>
                <Button
                  className="w-full"
                  onClick={handlePayNow}
                  disabled={!isPayable || isCreatingSnapPayment}
                >
                  {isCreatingSnapPayment ? (
                    "Redirecting..."
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay Now
                    </>
                  )}
                </Button>

                {!isPayable && (
                  <p className="text-muted-foreground text-center text-xs">
                    This order is no longer payable.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Payment Instruction (VA / QR result) */}
          {paymentInstruction && (
            <div className="bg-muted/40 space-y-2 rounded-xl border p-4 text-sm">
              <p className="font-semibold">Payment Instructions</p>
              {paymentInstruction.vaNumbers.map((item) => (
                <div
                  key={`${item.bank}-${item.va_number}`}
                  className="flex items-center justify-between"
                >
                  <span className="text-muted-foreground">
                    {item.bank.toUpperCase()} VA
                  </span>
                  <span className="font-mono font-semibold tracking-wide">
                    {item.va_number}
                  </span>
                </div>
              ))}
              {paymentInstruction.permataVaNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Permata VA</span>
                  <span className="font-mono font-semibold tracking-wide">
                    {paymentInstruction.permataVaNumber}
                  </span>
                </div>
              )}
              {paymentInstruction.qrString && (
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">
                    QR String
                  </span>
                  <p className="font-mono text-xs break-all">
                    {paymentInstruction.qrString}
                  </p>
                </div>
              )}
            </div>
          )}

          {paymentRedirectUrl ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.assign(paymentRedirectUrl)}
            >
              Open Existing Payment Page
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
};
