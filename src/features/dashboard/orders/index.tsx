"use client";

import PaginationSection from "@/components/PaginationSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import useGetOrders from "@/hooks/api/order/useGetOrders";
import { formatPrice } from "@/lib/price";
import {
  PackageSearch,
  ChevronRight,
  CreditCard,
  CalendarDays,
  AlertCircle,
  WalletCards,
  Layers,
} from "lucide-react";
import {
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
} from "@/lib/orderStatus";
import { OrderStatus } from "@/types/customOrder";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";

// --- Types & Constants (Keep logic as is) ---
type OrderItem = {
  previewUrl: string;
  orderId: string;
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  orderDate: string;
  status: OrderStatus;
  itemCount: number;
};

const ORDER_TABS = [
  { id: "all", label: "All" },
  { id: "in-production", label: "Production" },
  { id: "ready-to-ship", label: "Ready" },
  { id: "shipped", label: "Shipped" },
  { id: "completed", label: "Done" },
  { id: "cancelled", label: "Cancelled" },
] as const;

type OrderTab = (typeof ORDER_TABS)[number]["id"];

export const OrdersPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderTab>("all");
  const [page, setPage] = useState(1);
  const perPage = 8;
  const { data: orders = [], isLoading, isError } = useGetOrders();

  const all = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((order) => ({
      orderId: order.id,
      previewUrl: order.previewUrl || "",
      id: order.orderNumber?.trim() || order.id,
      title: order.orderNumber?.trim() || order.id,
      subtitle: "Custom Furniture Order",
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

  const itemsByTab: Record<OrderTab, OrderItem[]> = useMemo(
    () => ({
      all: orderHistory,
      "in-production": productionQueue,
      "ready-to-ship": readyToShip,
      shipped,
      completed,
      cancelled,
    }),
    [cancelled, completed, orderHistory, productionQueue, readyToShip, shipped],
  );

  const activeItems = itemsByTab[activeTab];
  const paginatedActiveItems = useMemo(() => {
    const startIndex = (page - 1) * perPage;
    return activeItems.slice(startIndex, startIndex + perPage);
  }, [activeItems, page, perPage]);

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

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: perPage }).map((_, i) => (
        <div
          key={i}
          className="bg-card space-y-4 rounded-2xl border p-4 shadow-lg/5"
        >
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex justify-between pt-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderGrid = (items: OrderItem[]) => {
    if (isLoading) return renderSkeletonGrid();
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => router.push(`/dashboard/orders/${item.orderId}`)}
            className="group bg-card hover:border-primary/40 relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border shadow-xl/5 transition-all"
          >
            {/* Image Preview - Container Utama */}
            <div className="bg-muted relative aspect-square overflow-hidden">
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="text-muted-foreground/40 flex h-full flex-col items-center justify-center">
                  <PackageSearch className="mb-2 h-10 w-10" />
                  <span className="text-xs font-medium">
                    No Preview Available
                  </span>
                </div>
              )}

              {/* Badge Status di Atas Gambar */}
              <div className="absolute top-3 right-3">
                <Badge
                  className={`border-none px-3 py-1 text-[10px] font-bold uppercase shadow-lg backdrop-blur-md ${getOrderStatusBadgeClass(item.status)}`}
                >
                  {getOrderStatusLabel(item.status)}
                </Badge>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-foreground truncate text-base font-bold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-xs font-medium">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="space-y-1">
                    <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      <CalendarDays className="h-3 w-3" />
                      {item.orderDate}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      <Layers className="h-3 w-3" />
                      {item.itemCount} Items
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-primary text-lg leading-none font-black">
                      {item.amount}
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  className="group-hover:bg-primary group-hover:text-primary-foreground hover:text-foreground h-9 w-full text-xs font-bold transition-colors"
                >
                  View Details
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
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
              <div>
                {item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={item.title}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="bg-muted h-20 items-center rounded-2xl text-center">
                    preview Image
                  </div>
                )}
              </div>

              <div className="min-w-0 space-y-1">
                <h3 className="text-foreground leading-none font-bold tracking-tight sm:text-lg">
                  {item.title}
                </h3>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                  <span className="text-foreground/80 font-medium">
                    {item.subtitle}
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
      <header className="bg-card border-accent relative overflow-hidden rounded-2xl border px-6 py-10 shadow-lg/5 sm:px-10">
        <div className="from-primary/5 to-primary/20 pointer-events-none absolute -top-17 -right-20 h-72 w-72 rounded-full bg-linear-to-br md:-top-14 md:-right-24 lg:-top-16 lg:-right-8" />
        <div className="from-primary/10 to-primary/30 pointer-events-none absolute -top-13 -right-28 h-64 w-64 rounded-full bg-linear-to-br md:-top-10 md:-right-32 lg:-top-12 lg:-right-12" />
        <div className="from-primary/20 to-primary/80 pointer-events-none absolute -top-9 -right-36 h-56 w-56 rounded-full bg-linear-to-br md:-top-6 md:-right-40 lg:-top-8 lg:-right-16" />

        <div className="relative z-10 flex items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <div className="bg-primary/10 rounded-lg p-2">
                <WalletCards className="text-primary h-5 w-5" />
              </div>
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                Your Orders
              </h1>
            </div>
            <p className="text-muted-foreground max-w-md text-sm">
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
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as OrderTab);
          setPage(1);
        }}
        className="w-full"
      >
        <div className="bg-card mb-6 flex items-center justify-between overflow-hidden rounded-full p-1.5 shadow-2xl/5">
          <TabsList className="no-scrollbar h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0">
            {ORDER_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-background rounded-full border px-4 py-2 text-xs font-bold transition-all"
              >
                {tab.label}
                {(itemsByTab[tab.id]?.length ?? 0) > 0 && (
                  <span className="bg-chart-2 text-card group-data-[state=active]:bg-background group-data-[state=active]:text-background ml-2 rounded-full px-1.5 py-0.5 text-[10px]">
                    {itemsByTab[tab.id].length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-2">
          {ORDER_TABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {renderGrid(tab.id === activeTab ? paginatedActiveItems : [])}
            </TabsContent>
          ))}
        </div>
      </Tabs>

      {!isLoading && !isError && activeItems.length > 0 ? (
        <PaginationSection
          page={page}
          perPage={perPage}
          total={activeItems.length}
          hasNext={page * perPage < activeItems.length}
          hasPrevious={page > 1}
          onChangePage={setPage}
        />
      ) : null}
    </div>
  );
};
