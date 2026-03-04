"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import useGetOrders from "@/hooks/api/order/useGetOrders";
import { formatPrice } from "@/lib/price";
import { PackageSearch } from "lucide-react";
import { getStatusBadgeClass, StatusTone } from "@/lib/statusStyles";
import { OrderStatus } from "@/types/customOrder";
import { useRouter } from "next/navigation";

type OrderTabStatus =
  | "PENDING_PAYMENT"
  | "AWAITING_PRODUCTION"
  | "IN_PRODUCTION"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

type OrderItem = {
  orderId: string;
  id: string;
  title: string;
  amount: string;
  orderDate: string;
  status: OrderTabStatus;
};

const statusLabel: Record<OrderTabStatus, string> = {
  PENDING_PAYMENT: "Waiting for Payment",
  AWAITING_PRODUCTION: "Awaiting Production",
  IN_PRODUCTION: "In Production",
  READY_TO_SHIP: "Ready to Ship",
  SHIPPED: "Shipped",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusTone: Record<OrderTabStatus, StatusTone> = {
  PENDING_PAYMENT: "warning",
  AWAITING_PRODUCTION: "warning",
  IN_PRODUCTION: "warning",
  READY_TO_SHIP: "info",
  SHIPPED: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export const OrdersPage = () => {
  const router = useRouter();
  const { data: orders = [], isLoading, isError } = useGetOrders();

  const toUiStatus = (status: OrderStatus): OrderTabStatus => status;

  const all = [...orders]
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
        orderDate: new Date(order.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        status: toUiStatus(order.status),
      } satisfies OrderItem;
    });

  const pendingPayment = all.filter(
    (item) => item.status === "PENDING_PAYMENT",
  );
  const orderHistory = all.filter((item) => item.status !== "PENDING_PAYMENT");
  const productionQueue = all.filter(
    (item) =>
      item.status === "AWAITING_PRODUCTION" || item.status === "IN_PRODUCTION",
  );
  const readyToShip = all.filter((item) => item.status === "READY_TO_SHIP");
  const shipped = all.filter((item) => item.status === "SHIPPED");
  const completed = all.filter((item) => item.status === "COMPLETED");
  const cancelled = all.filter((item) => item.status === "CANCELLED");

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

  const renderList = (items: OrderItem[]) => {
    if (isLoading) {
      return renderSkeletonList();
    }

    if (isError) {
      return (
        <div className="border-border bg-card mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12 lg:max-w-full">
          <p className="text-sm font-medium">Failed to load orders</p>
          <p className="text-muted-foreground text-sm">
            Please refresh this page and try again.
          </p>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="border-border bg-card mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center sm:py-12 lg:max-w-full">
          <PackageSearch className="text-muted-foreground/40 mb-3 h-12 w-12" />
          <h3 className="text-foreground mb-2 text-lg font-medium">
            No orders found
          </h3>
          <p className="text-muted-foreground text-sm">
            There are no orders in this tab yet.
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
                  Date: {item.orderDate}
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
      <div className="bg-accent mb-8 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
          Orders
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Review your custom furniture orders and their latest status.
        </p>
      </div>

      <div className="bg-muted/50 rounded-md p-3 sm:p-4">
        {pendingPayment.length > 0 ? (
          <div className="bg-card mb-4 flex flex-col items-start justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold">Pending Payments</p>
              <p className="text-muted-foreground text-sm">
                {pendingPayment.length} order
                {pendingPayment.length === 1 ? "" : "s"} waiting for payment
                are now managed in Billing.
              </p>
            </div>
            <Button onClick={() => router.push("/dashboard/billing")}>
              Go to Billing
            </Button>
          </div>
        ) : null}

        <div className="mx-auto px-1 py-3 sm:px-4 sm:py-4 lg:px-2 lg:py-2">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="no-scrollbar mb-4 w-full overflow-x-auto sm:mb-6">
              <TabsTrigger value="all">All ({orderHistory.length})</TabsTrigger>
              <TabsTrigger value="in-production">
                In Production ({productionQueue.length})
              </TabsTrigger>
              <TabsTrigger value="ready-to-ship">
                Ready to Ship ({readyToShip.length})
              </TabsTrigger>
              <TabsTrigger value="shipped">
                Shipped ({shipped.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completed.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled Order ({cancelled.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">{renderList(orderHistory)}</TabsContent>
            <TabsContent value="in-production">
              {renderList(productionQueue)}
            </TabsContent>
            <TabsContent value="ready-to-ship">
              {renderList(readyToShip)}
            </TabsContent>
            <TabsContent value="shipped">{renderList(shipped)}</TabsContent>
            <TabsContent value="completed">{renderList(completed)}</TabsContent>
            <TabsContent value="cancelled">{renderList(cancelled)}</TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};
