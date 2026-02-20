"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReceiptText } from "lucide-react";
import { getStatusBadgeClass } from "@/lib/statusStyles";

type PaymentStatus = "WAITING_PAYMENT" | "PAID" | "FAILED" | "EXPIRED";

type BillingItem = {
  id: string;
  title: string;
  amount: string;
  dueDate: string;
  status: PaymentStatus;
};

const BILLINGS: BillingItem[] = [
  {
    id: "INV-2026-0012",
    title: "Custom Wardrobe - Master Room",
    amount: "Rp 4.250.000",
    dueDate: "Feb 20, 2026",
    status: "WAITING_PAYMENT",
  },
  {
    id: "INV-2026-0011",
    title: "Kitchen Cabinet - Island Set",
    amount: "Rp 6.800.000",
    dueDate: "Feb 10, 2026",
    status: "PAID",
  },
  {
    id: "INV-2026-0010",
    title: "TV Console - Living Room",
    amount: "Rp 2.900.000",
    dueDate: "Feb 08, 2026",
    status: "FAILED",
  },
  {
    id: "INV-2026-0009",
    title: "Walk-in Closet - Package A",
    amount: "Rp 9.400.000",
    dueDate: "Feb 05, 2026",
    status: "EXPIRED",
  },
];

const statusLabel: Record<PaymentStatus, string> = {
  WAITING_PAYMENT: "Waiting Payment",
  PAID: "Paid",
  FAILED: "Failed",
  EXPIRED: "Expired",
};

const statusTone: Record<
  PaymentStatus,
  "warning" | "info" | "success" | "danger" | "neutral"
> = {
  WAITING_PAYMENT: "warning",
  PAID: "success",
  FAILED: "danger",
  EXPIRED: "neutral",
};

export const BillingPage = () => {
  const waitingPayment = BILLINGS.filter(
    (item) => item.status === "WAITING_PAYMENT",
  );
  const otherStatus = BILLINGS.filter(
    (item) => item.status !== "WAITING_PAYMENT",
  );

  const renderList = (items: BillingItem[]) => {
    if (items.length === 0) {
      return (
        <div className="border-border bg-card mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12 lg:max-w-full">
          <ReceiptText className="text-muted-foreground/40 mb-3 h-12 w-12" />
          <h3 className="text-foreground mb-2 text-lg font-medium">
            No billing data
          </h3>
          <p className="text-muted-foreground text-sm">
            There are no payments in this tab yet.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-card rounded-lg border p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm font-semibold sm:text-base">
                  {item.title}
                </p>
                <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                  Invoice: {item.id}
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Due: {item.dueDate}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                <p className="text-foreground text-sm font-semibold sm:text-base">
                  {item.amount}
                </p>
                <span className={getStatusBadgeClass(statusTone[item.status])}>
                  {statusLabel[item.status]}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section>
      <div className="bg-muted/60 mb-8 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
          Billing
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Track your invoices and payment status.
        </p>
      </div>

      <div className="bg-muted/50 rounded-md p-3 sm:p-4">
        <div className="mx-auto px-1 py-3 sm:px-4 sm:py-4 lg:px-2 lg:py-2">
          <Tabs defaultValue="waiting-payment" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2 sm:mb-6">
              <TabsTrigger value="waiting-payment">
                Waiting Payment ({waitingPayment.length})
              </TabsTrigger>
              <TabsTrigger value="other-status">
                Other Status ({otherStatus.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="waiting-payment">
              {renderList(waitingPayment)}
            </TabsContent>
            <TabsContent value="other-status">{renderList(otherStatus)}</TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};
