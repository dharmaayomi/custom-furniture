"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import useGetOrder from "@/hooks/api/order/useGetOrder";
import { formatPrice } from "@/lib/price";
import { getStatusBadgeClass } from "@/lib/statusStyles";
import { OrderStatus, PaymentPhase } from "@/types/customOrder";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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

const buildPhaseSteps = (
  totalPrice: number,
  currentPhase: PaymentPhase,
): PhaseStep[] => {
  const phaseAmount = totalPrice / 4;
  const currentIndex = Math.max(0, phaseOrder.indexOf(currentPhase));

  return phaseOrder.map((phase, index) => {
    const state: StepState =
      index < currentIndex ? "completed" : index === currentIndex ? "current" : "upcoming";
    return {
      phase,
      label: PHASE_LABEL[phase],
      amount: phaseAmount,
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

type BillingTestDetailProps = {
  orderId: string;
};

export const BillingTestDetail = ({ orderId }: BillingTestDetailProps) => {
  const router = useRouter();
  const { data: order, isLoading, isError } = useGetOrder(orderId);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </section>
    );
  }

  if (isError || !order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Test Detail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">Order not found.</p>
          <Button variant="outline" onClick={() => router.push("/dashboard/billing-test")}>
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentPhase = order.currentPaymentPhase ?? inferPhaseFromStatus(order.status);
  const steps = buildPhaseSteps(Number(order.grandTotalPrice ?? 0), currentPhase);
  const orderRef = order.orderNumber?.trim() || order.id;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/billing-test")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <Badge className={getStatusBadgeClass(statusTone[order.status])}>
          {statusLabel[order.status]}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order #{orderRef}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-muted/40 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Grand Total</p>
              <p className="font-semibold">
                {formatPrice(Number(order.grandTotalPrice ?? 0))}
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Current Phase</p>
              <p className="font-semibold">{PHASE_LABEL[currentPhase]}</p>
            </div>
          </div>

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
                    {formatPrice(step.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
