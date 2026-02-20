"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackageSearch } from "lucide-react";
import { getStatusBadgeClass } from "@/lib/statusStyles";

type OrderStatus =
  | "WAITING_FOR_PAYMENT"
  | "IN_PROGRESS"
  | "READY_TO_SHIP"
  | "IN_DELIVERY"
  | "COMPLETED"
  | "CANCELLED";

type OrderItem = {
  id: string;
  title: string;
  amount: string;
  orderDate: string;
  status: OrderStatus;
};

const ORDERS: OrderItem[] = [
  {
    id: "ORD-2026-1032",
    title: "Custom Wardrobe - Master Room",
    amount: "Rp 4.250.000",
    orderDate: "Feb 14, 2026",
    status: "WAITING_FOR_PAYMENT",
  },
  {
    id: "ORD-2026-1031",
    title: "Office Desk - Double Drawer",
    amount: "Rp 3.100.000",
    orderDate: "Feb 13, 2026",
    status: "IN_PROGRESS",
  },
  {
    id: "ORD-2026-1030",
    title: "Kitchen Cabinet - Island Set",
    amount: "Rp 6.800.000",
    orderDate: "Feb 10, 2026",
    status: "READY_TO_SHIP",
  },
  {
    id: "ORD-2026-1028",
    title: "Shoe Cabinet - Entrance",
    amount: "Rp 1.850.000",
    orderDate: "Feb 05, 2026",
    status: "IN_DELIVERY",
  },
  {
    id: "ORD-2026-1027",
    title: "Bed Frame - Queen Size",
    amount: "Rp 5.600.000",
    orderDate: "Feb 02, 2026",
    status: "COMPLETED",
  },
  {
    id: "ORD-2026-1029",
    title: "TV Console - Living Room",
    amount: "Rp 2.900.000",
    orderDate: "Feb 06, 2026",
    status: "CANCELLED",
  },
];

const statusLabel: Record<OrderStatus, string> = {
  WAITING_FOR_PAYMENT: "Waiting for Payment",
  IN_PROGRESS: "In Progress",
  READY_TO_SHIP: "Ready to Ship",
  IN_DELIVERY: "In Delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusTone: Record<
  OrderStatus,
  "warning" | "info" | "success" | "danger" | "neutral"
> = {
  WAITING_FOR_PAYMENT: "warning",
  IN_PROGRESS: "warning",
  READY_TO_SHIP: "info",
  IN_DELIVERY: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export const OrdersPage = () => {
  const all = ORDERS;
  const waitingForPayment = ORDERS.filter(
    (item) => item.status === "WAITING_FOR_PAYMENT",
  );
  const inProgress = ORDERS.filter((item) => item.status === "IN_PROGRESS");
  const readyToShip = ORDERS.filter((item) => item.status === "READY_TO_SHIP");
  const inDelivery = ORDERS.filter((item) => item.status === "IN_DELIVERY");
  const completed = ORDERS.filter((item) => item.status === "COMPLETED");
  const cancelled = ORDERS.filter((item) => item.status === "CANCELLED");

  const renderList = (items: OrderItem[]) => {
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
          <div key={item.id} className="bg-card rounded-lg border p-4 shadow-sm">
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
      <div className="bg-muted/60 mb-8 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
          Orders
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Review your custom furniture orders and their latest status.
        </p>
      </div>

      <div className="bg-muted/50 rounded-md p-3 sm:p-4">
        <div className="mx-auto px-1 py-3 sm:px-4 sm:py-4 lg:px-2 lg:py-2">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="no-scrollbar mb-4 w-full overflow-x-auto sm:mb-6">
              <TabsTrigger value="all">All ({all.length})</TabsTrigger>
              <TabsTrigger value="waiting-for-payment">
                Waiting for Payment ({waitingForPayment.length})
              </TabsTrigger>
              <TabsTrigger value="in-progress">
                In Progress ({inProgress.length})
              </TabsTrigger>
              <TabsTrigger value="ready-to-ship">
                Ready to Ship ({readyToShip.length})
              </TabsTrigger>
              <TabsTrigger value="in-delivery">
                In Delivery ({inDelivery.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completed.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled Order ({cancelled.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">{renderList(all)}</TabsContent>
            <TabsContent value="waiting-for-payment">
              {renderList(waitingForPayment)}
            </TabsContent>
            <TabsContent value="in-progress">
              {renderList(inProgress)}
            </TabsContent>
            <TabsContent value="ready-to-ship">
              {renderList(readyToShip)}
            </TabsContent>
            <TabsContent value="in-delivery">
              {renderList(inDelivery)}
            </TabsContent>
            <TabsContent value="completed">{renderList(completed)}</TabsContent>
            <TabsContent value="cancelled">{renderList(cancelled)}</TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};
