"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import useGetOrders from "@/hooks/api/order/useGetOrders";
import { formatPrice } from "@/lib/price";
import { ReceiptText } from "lucide-react";
import { getStatusBadgeClass, StatusTone } from "@/lib/statusStyles";
import { OrderStatus } from "@/types/customOrder";
import { useRouter } from "next/navigation";

type BillingOrderStatus = OrderStatus;

type BillingItem = {
  orderId: string;
  id: string;
  title: string;
  amount: string;
  dueDate: string;
  status: BillingOrderStatus;
};

const statusLabel: Record<BillingOrderStatus, string> = {
  PENDING_PAYMENT: "Waiting Payment",
  AWAITING_PRODUCTION: "Awaiting Production",
  IN_PRODUCTION: "In Production",
  READY_TO_SHIP: "Ready to Ship",
  SHIPPED: "Shipped",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusTone: Record<BillingOrderStatus, StatusTone> = {
  PENDING_PAYMENT: "warning",
  AWAITING_PRODUCTION: "warning",
  IN_PRODUCTION: "warning",
  READY_TO_SHIP: "info",
  SHIPPED: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export const BillingPage = () => {
  const router = useRouter();
  const {
    data: pendingOrders = [],
    isLoading: isLoadingPending,
    isError: isErrorPending,
  } = useGetOrders({ status: "PENDING_PAYMENT" });
  const {
    data: allOrders = [],
    isLoading: isLoadingAll,
    isError: isErrorAll,
  } = useGetOrders();

  const waitingPayment = [...pendingOrders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((order) => {
      const itemCount = order.items?.length ?? 0;
      const orderReference = order.orderNumber?.trim() || order.id;
      return {
        orderId: order.id,
        id: orderReference,
        title: `Custom furniture order (${itemCount} item${itemCount === 1 ? "" : "s"})`,
        amount: formatPrice(Number(order.grandTotalPrice ?? 0)),
        dueDate: new Date(order.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        status: order.status,
      } satisfies BillingItem;
    });

  const otherStatus = [...allOrders]
    .filter((order) => order.status !== "PENDING_PAYMENT")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((order) => {
      const itemCount = order.items?.length ?? 0;
      const orderReference = order.orderNumber?.trim() || order.id;
      return {
        orderId: order.id,
        id: orderReference,
        title: `Custom furniture order (${itemCount} item${itemCount === 1 ? "" : "s"})`,
        amount: formatPrice(Number(order.grandTotalPrice ?? 0)),
        dueDate: new Date(order.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        status: order.status,
      } satisfies BillingItem;
    });

  const isLoading = isLoadingPending || isLoadingAll;
  const isError = isErrorPending || isErrorAll;

  const renderSkeletonList = () => (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-card rounded-lg border p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderList = (items: BillingItem[], mode: "pending" | "other") => {
    if (isLoading) {
      return renderSkeletonList();
    }

    if (isError) {
      return (
        <div className="border-border bg-card mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12 lg:max-w-full">
          <p className="text-sm font-medium">Failed to load billing data</p>
          <p className="text-muted-foreground text-sm">
            Please refresh this page and try again.
          </p>
        </div>
      );
    }

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
          <div
            key={item.id}
            className="bg-card hover:bg-muted/35 hover:border-border cursor-pointer rounded-lg border p-4 shadow-sm transition"
            onClick={() => {
              if (mode === "pending") {
                router.push(`/checkout?orderId=${item.orderId}`);
                return;
              }
              router.push(`/dashboard/orders/${item.orderId}`);
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm font-semibold sm:text-base">
                  {item.title}
                </p>
                <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                  Order: {item.id}
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Date: {item.dueDate}
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
              {renderList(waitingPayment, "pending")}
            </TabsContent>
            <TabsContent value="other-status">
              {renderList(otherStatus, "other")}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};
