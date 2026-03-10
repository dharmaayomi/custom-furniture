"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import useGetOrders from "@/hooks/api/order/useGetOrders";
import { formatPrice } from "@/lib/price";
import {
  PackageSearch,
  ChevronRight,
  CreditCard,
  Clock,
  CalendarDays,
  AlertCircle,
  WalletCards,
} from "lucide-react";
import {
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
} from "@/lib/orderStatus";
import { OrderStatus } from "@/types/customOrder";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

// --- Types & Constants (Keep logic as is) ---
type OrderItem = {
  orderId: string;
  id: string;
  title: string;
  amount: string;
  orderDate: string;
  status: OrderStatus;
  itemCount: number;
};

export const OrdersPage = () => {
  const router = useRouter();
  const { data: orders = [], isLoading, isError } = useGetOrders();

  const all = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((order) => ({
      orderId: order.id,
      id: order.orderNumber?.trim() || order.id,
      title: `Custom Furniture Order`,
      amount: formatPrice(Number(order.grandTotalPrice ?? 0)),
      itemCount: order.items?.length ?? 0,
      orderDate: new Date(order.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      status: order.status,
    }));

  // Filtering Logic
  const pendingPayment = all.filter((i) => i.status === "PENDING_PAYMENT");
  const orderHistory = all.filter((i) => i.status !== "PENDING_PAYMENT");
  const productionQueue = all.filter((i) =>
    ["AWAITING_PRODUCTION", "IN_PRODUCTION"].includes(i.status),
  );
  const readyToShip = all.filter((i) => i.status === "READY_TO_SHIP");
  const shipped = all.filter((i) => i.status === "SHIPPED");
  const completed = all.filter((i) => i.status === "COMPLETED");
  const cancelled = all.filter((i) => i.status === "CANCELLED");

  // --- Render Helpers ---

  const renderSkeletonList = () => (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-card flex flex-col gap-4 rounded-xl border p-5"
        >
          <div className="flex justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );

  const renderList = (items: OrderItem[]) => {
    if (isLoading) return renderSkeletonList();
    if (isError)
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <AlertCircle className="text-destructive/50 mb-3 h-10 w-10" />
          <p className="font-semibold">Unable to load orders</p>
          <p className="text-muted-foreground text-sm">
            Please try refreshing the page.
          </p>
        </div>
      );

    if (items.length === 0)
      return (
        <div className="bg-muted/20 flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <PackageSearch className="text-muted-foreground/30 mb-4 h-12 w-12" />
          <h3 className="text-lg font-semibold">No orders here</h3>
          <p className="text-muted-foreground text-sm">
            Orders with this status will appear here.
          </p>
        </div>
      );

    return (
      <div className="grid gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => router.push(`/dashboard/orders/${item.orderId}`)}
            className="group bg-card hover:border-primary/30 relative flex cursor-pointer flex-col gap-4 rounded-xl border px-4 py-2 transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors">
                <Clock className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <h3 className="text-foreground leading-none font-bold tracking-tight sm:text-lg">
                  {item.title}
                </h3>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                  <span className="text-foreground/80 font-medium">
                    {item.id}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> {item.orderDate}
                  </span>
                  <span>
                    {item.itemCount} item{item.itemCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t pt-4 sm:flex-col sm:items-end sm:border-none sm:pt-0">
              <p className="text-foreground text-lg font-black tracking-tight">
                {item.amount}
              </p>
              <div className="flex items-center gap-2">
                <Badge
                  className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${getOrderStatusBadgeClass(item.status)}`}
                >
                  {getOrderStatusLabel(item.status)}
                </Badge>
                <ChevronRight className="text-muted-foreground/50 hidden h-5 w-5 transition-transform group-hover:translate-x-1 sm:block" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto space-y-8 pb-20">
      {/* --- Page Header --- */}
      <header className="bg-card relative overflow-hidden rounded-2xl px-6 py-10 shadow-lg sm:px-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <div className="bg-primary/10 rounded-lg p-2">
                <WalletCards className="text-primary h-5 w-5" />
              </div>
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                Your Orders
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Manage and track the progress of your custom furniture pieces in
              real-time.
            </p>
          </div>
        </div>
      </header>

      {/* --- Billing Alert --- */}
      {pendingPayment.length > 0 && (
        <div className="border-warning/30 bg-warning/5 flex flex-col items-start justify-between gap-4 rounded-xl border p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="bg-warning/20 text-warning flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-foreground font-bold">
                Pending Payments Detected
              </p>
              <p className="text-muted-foreground text-sm">
                You have {pendingPayment.length} order
                {pendingPayment.length > 1 ? "s" : ""} waiting for payment.
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/dashboard/billing")}
            className="bg-foreground text-background hover:bg-foreground/90 w-full sm:w-auto"
          >
            Go to Billing
          </Button>
        </div>
      )}

      {/* --- Tabs & Content --- */}
      <Tabs defaultValue="all" className="w-full">
        <div className="mb-6 flex items-center justify-between overflow-hidden">
          <TabsList className="no-scrollbar h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0">
            {[
              { id: "all", label: "All", count: orderHistory.length },
              {
                id: "in-production",
                label: "Production",
                count: productionQueue.length,
              },
              {
                id: "ready-to-ship",
                label: "Ready",
                count: readyToShip.length,
              },
              { id: "shipped", label: "Shipped", count: shipped.length },
              { id: "completed", label: "Done", count: completed.length },
              { id: "cancelled", label: "Cancelled", count: cancelled.length },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-background rounded-full border px-4 py-2 text-xs font-bold transition-all"
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="bg-chart-2 text-card group-data-[state=active]:bg-background group-data-[state=active]:text-background ml-2 rounded-full px-1.5 py-0.5 text-[10px]">
                    {tab.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-2">
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
        </div>
      </Tabs>
    </div>
  );
};
