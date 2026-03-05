"use client";

import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const PAYMENT_PHASES = [
  "DP",
  "PROGRESS_1",
  "PROGRESS_2",
  "FINAL",
] as const;

export type PaymentPhase = (typeof PAYMENT_PHASES)[number];

const phaseMeta: Record<PaymentPhase, { title: string; detail: string }> = {
  DP: {
    title: "Down Payment",
    detail: "Initial payment confirmed",
  },
  PROGRESS_1: {
    title: "Progress 1",
    detail: "First milestone billing",
  },
  PROGRESS_2: {
    title: "Progress 2",
    detail: "Second milestone billing",
  },
  FINAL: {
    title: "Final Payment",
    detail: "Closing payment",
  },
};

type PaymentPhaseStepperProps = {
  paymentPhase: PaymentPhase;
};

export function PaymentPhaseStepper({
  paymentPhase,
}: PaymentPhaseStepperProps) {
  const currentIndex = PAYMENT_PHASES.indexOf(paymentPhase);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <ol
      aria-label="Payment progress"
      className="items-centergap-0 flex w-full flex-col sm:flex-row"
    >
      {PAYMENT_PHASES.map((phase, index) => {
        const isCompleted = index < activeIndex;
        const isCurrent = index === activeIndex;
        const isUpcoming = index > activeIndex;
        const isLast = index === PAYMENT_PHASES.length - 1;
        const statusLabel = isCompleted
          ? "Completed"
          : isCurrent
            ? "Current"
            : "Upcoming";

        return (
          <li
            key={phase}
            aria-current={isCurrent ? "step" : undefined}
            className="relative flex grow"
          >
            {!isLast && (
              <Separator
                orientation="horizontal"
                className={cn(
                  "absolute top-5 right-0 left-10 hidden sm:block",
                  isCompleted ? "bg-primary/40" : "bg-border",
                )}
              />
            )}

            {!isLast && (
              <Separator
                orientation="vertical"
                className={cn(
                  "absolute top-10 bottom-0 left-5 -translate-x-1/2 sm:hidden",
                  isCompleted ? "bg-primary/40" : "bg-border",
                )}
              />
            )}

            <div className="relative z-10 flex w-full items-start gap-3 pb-6 sm:pr-3 sm:pb-0">
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                  isCompleted || isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </span>

              <div className="min-w-0 pt-0.5">
                <span
                  className={cn(
                    "block text-sm leading-tight font-semibold",
                    isUpcoming ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {phaseMeta[phase].title}
                </span>
                <span className="text-muted-foreground mt-1 block text-xs leading-4">
                  {phaseMeta[phase].detail}
                </span>
                <Badge
                  variant={isCompleted || isCurrent ? "default" : "secondary"}
                  className={cn(
                    "mt-2",
                    isCurrent && "ring-primary/25 ring-2 ring-offset-1",
                  )}
                >
                  {statusLabel}
                </Badge>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
