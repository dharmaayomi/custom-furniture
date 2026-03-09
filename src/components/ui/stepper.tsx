"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: string | number;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: StepItem[];
  currentStep: string | number;
  onStepChange?: (stepId: string | number) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    { steps, currentStep, onStepChange, orientation = "horizontal", className },
    ref,
  ) => {
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    const activeIndex = currentIndex >= 0 ? currentIndex : 0;

    const renderStepButton = (
      index: number,
      step: StepItem,
      size: "sm" | "md" = "md",
    ) => {
      const isCompleted = index < activeIndex;
      const isCurrent = index === activeIndex;
      const buttonSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
      const textSize = size === "sm" ? "text-xs" : "text-sm";

      return (
        <button
          type="button"
          onClick={() => onStepChange?.(step.id)}
          disabled={!onStepChange}
          className={cn(
            "relative flex items-center justify-center rounded-full border-2 transition-all",
            buttonSize,
            isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : isCurrent
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground",
            !onStepChange && "cursor-default",
          )}
          aria-current={isCurrent ? "step" : undefined}
        >
          {isCompleted ? (
            <CheckIcon className={cn(size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
          ) : (
            <span className={cn("font-semibold", textSize)}>{index + 1}</span>
          )}
        </button>
      );
    };

    const renderStepText = (index: number, step: StepItem) => {
      const isCurrent = index === activeIndex;
      return (
        <div className="min-w-0 space-y-0.5">
          <h3
            className={cn(
              "truncate text-sm font-semibold",
              isCurrent ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {step.title}
          </h3>
          {step.description ? (
            <p className="text-muted-foreground text-xs">{step.description}</p>
          ) : null}
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-full",
          orientation === "vertical" ? "space-y-8" : "",
          className,
        )}
        data-orientation={orientation}
      >
        {orientation === "vertical" ? (
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isCompleted = index < activeIndex;
              return (
                <div key={step.id} className="relative flex items-start gap-3">
                  <div className="relative z-10">{renderStepButton(index, step)}</div>
                  <div className="min-w-0 flex-1 pt-1">{renderStepText(index, step)}</div>
                  {index < steps.length - 1 ? (
                    <div
                      className={cn(
                        "absolute top-10 left-5 h-8 w-0.5 -translate-x-1/2",
                        isCompleted ? "bg-primary" : "bg-border",
                      )}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <div className="space-y-5 md:hidden">
              {steps.map((step, index) => {
                const isCompleted = index < activeIndex;
                return (
                  <div key={step.id} className="relative flex items-start gap-3">
                    <div className="relative z-10">
                      {renderStepButton(index, step, "sm")}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">{renderStepText(index, step)}</div>
                    {index < steps.length - 1 ? (
                      <div
                        className={cn(
                          "absolute top-8 left-4 h-11 w-0.5 -translate-x-1/2",
                          isCompleted ? "bg-primary" : "bg-border",
                        )}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="hidden items-start md:flex md:justify-between">
              {steps.map((step, index) => {
                const isCompleted = index < activeIndex;
                return (
                  <React.Fragment key={step.id}>
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        {renderStepButton(index, step)}
                        <div className="w-28">{renderStepText(index, step)}</div>
                      </div>
                    </div>
                    {index < steps.length - 1 ? (
                      <div
                        className={cn(
                          "mx-4 mt-5 h-0.5 flex-1",
                          isCompleted ? "bg-primary" : "bg-border",
                        )}
                      />
                    ) : null}
                  </React.Fragment>
                );
              })}
            </div>
          </>
        )}

        <div
          className="text-muted-foreground text-xs"
          role="region"
          aria-live="polite"
        >
          Step {activeIndex + 1} of {steps.length}
        </div>
      </div>
    );
  },
);

Stepper.displayName = "Stepper";

interface CheckIconProps extends React.SVGProps<SVGSVGElement> {}

const CheckIcon = (props: CheckIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export { Stepper };
