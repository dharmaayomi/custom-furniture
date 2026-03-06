"use client";

import { Fragment, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useGetAdminOrders from "@/hooks/api/order/useGetAdminOrders";
import useStartOrder from "@/hooks/api/order/useStartOrder";
import { getAvatarFallback } from "@/lib/avatar";
import { formatPrice } from "@/lib/price";
import { getStatusBadgeClass } from "@/lib/statusStyles";
import { CustomOrder, OrderStatus } from "@/types/customOrder";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Clock3,
  CircleDollarSign,
  Hammer,
  TriangleAlert,
  Truck,
  Settings,
  CogIcon,
  Eye,
  SquarePlayIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@base-ui/react";

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
  IN_PRODUCTION: "info",
  READY_TO_SHIP: "info",
  SHIPPED: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export const AdminOrdersPage = () => {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [confirmStartOrder, setConfirmStartOrder] =
    useState<CustomOrder | null>(null);
  const [startOrderError, setStartOrderError] = useState<string | null>(null);
  const perPage = 12;
  const { mutateAsync: startOrder, isPending: isStartingOrder } =
    useStartOrder();

  const { data, isLoading, isError } = useGetAdminOrders({
    page,
    perPage,
    sortBy: "createdAt",
    orderBy: "desc",
  });
  const orders = data?.data ?? [];
  const meta = data?.meta;

  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const expandedColSpan = 7;

  const toggleExpand = (orderId: string) => {
    setExpandedRows((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const pendingPaymentCount = sortedOrders.filter(
    (order) => order.status === "PENDING_PAYMENT",
  ).length;
  const awaitingProductionCount = sortedOrders.filter(
    (order) => order.status === "AWAITING_PRODUCTION",
  ).length;
  const inProductionCount = sortedOrders.filter(
    (order) => order.status === "IN_PRODUCTION",
  ).length;
  const readyToShipCount = sortedOrders.filter(
    (order) => order.status === "READY_TO_SHIP",
  ).length;

  if (isLoading) {
    return <AdminOrdersPageSkeleton />;
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Failed to load orders.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <div className="bg-muted/60 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Admin Orders
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          All orders with production status labels.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStatCard
          title="Waiting Payment"
          value={pendingPaymentCount}
          helperText="Need payment confirmation"
          icon={<CircleDollarSign className="text-primary h-4 w-4" />}
        />
        <SummaryStatCard
          title="Awaiting Production"
          value={awaitingProductionCount}
          helperText="Waiting to be started"
          icon={<Clock3 className="text-primary h-4 w-4" />}
        />
        <SummaryStatCard
          title="In Production"
          value={inProductionCount}
          helperText="Currently being processed"
          icon={<Hammer className="text-primary h-4 w-4" />}
        />
        <SummaryStatCard
          title="Ready to Ship"
          value={readyToShipCount}
          helperText="Ready for delivery handoff"
          icon={<Truck className="text-primary h-4 w-4" />}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <Input
            type="search"
            placeholder="Search orders..."
            onChange={(e) => {}}
          />
        </div>

        <div></div>
      </div>

      {sortedOrders.length === 0 ? (
        <Card className="py-3">
          <CardContent className="py-10 text-center">
            <p className="text-sm">No orders available.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* table */}
          <div className="border-border overflow-hidden rounded-xl border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-foreground/90 h-12 font-semibold">
                    Order Number
                  </TableHead>
                  <TableHead className="text-foreground/90 h-12 font-semibold">
                    Name
                  </TableHead>
                  <TableHead className="text-foreground/90 h-12 font-semibold">
                    Date
                  </TableHead>
                  <TableHead className="text-foreground/90 h-12 font-semibold">
                    Grand Total
                  </TableHead>
                  <TableHead className="text-foreground/90 h-12 font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="text-foreground/90 h-12 text-right font-semibold">
                    Action
                  </TableHead>
                  <TableHead className="h-12 w-10 px-2" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.map((order, index) => {
                  const orderRef = order.orderNumber?.trim() || order.id;
                  const isExpanded = !!expandedRows[order.id];
                  const userMeta = getOrderUserMeta(order);
                  const canStartProduction =
                    order.status === "AWAITING_PRODUCTION";

                  return (
                    <Fragment key={order.id}>
                      <TableRow
                        className={cn(
                          "h-15 transition-colors duration-150",
                          index % 2 === 0 ? "bg-background" : "bg-muted/22",
                          "hover:bg-muted/45",
                          isExpanded && "bg-muted/55 border-b-0",
                        )}
                      >
                        <TableCell className="text-foreground font-medium">
                          <span className="bg-muted/40 border-border/70 rounded-md border px-2 py-0.5 font-mono text-sm font-bold">
                            {orderRef}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/15 ring-primary/60 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ring-2">
                              {getAvatarFallback({
                                firstName: userMeta.firstName,
                                name: userMeta.firstName,
                              })}
                            </div>
                            <span className="text-foreground text-sm font-medium">
                              {userMeta.firstName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(order.createdAt).toLocaleString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-foreground font-semibold">
                          {formatPrice(Number(order.grandTotalPrice ?? 0))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getStatusBadgeClass(
                              statusTone[order.status],
                            )}
                          >
                            {statusLabel[order.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-muted h-8 w-8"
                                  aria-label={`Open actions for order ${orderRef}`}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/admin/orders/${order.id}`,
                                    )
                                  }
                                >
                                  <span className="flex gap-2">
                                    <Eye className="h-4 w-4" />
                                    View Detail
                                  </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/admin/orders/${order.id}/process`,
                                    )
                                  }
                                >
                                  <span className="flex gap-2">
                                    <CogIcon className="h-4 w-4" />
                                    Process Order
                                  </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={!canStartProduction}
                                  onClick={() => setConfirmStartOrder(order)}
                                >
                                  <span className="flex gap-2">
                                    <SquarePlayIcon className="h-4 w-4" />
                                    Start Order
                                  </span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="hover:bg-muted h-7 w-7 transition-transform duration-200"
                            onClick={() => toggleExpand(order.id)}
                            aria-label={
                              isExpanded
                                ? `Collapse order ${orderRef}`
                                : `Expand order ${orderRef}`
                            }
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-background/90 hover:bg-background/90">
                          <TableCell
                            colSpan={expandedColSpan}
                            className="border-border/60 border-t py-3"
                          >
                            <ExpandedOrderContent order={order} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              Page {meta?.page ?? page} of{" "}
              {meta ? Math.max(1, Math.ceil(meta.total / meta.perPage)) : 1}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void setPage(Math.max(1, (meta?.page ?? page) - 1))
                }
                disabled={!meta?.hasPrevious}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void setPage((meta?.page ?? page) + 1)}
                disabled={!meta?.hasNext}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(confirmStartOrder)}
        onOpenChange={(open) => {
          if (isStartingOrder) return;
          if (!open) {
            setConfirmStartOrder(null);
            setStartOrderError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start Production?</DialogTitle>
            <DialogDescription>
              This will move the order to <strong>In Production</strong>.
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Preparation Checklist</AlertTitle>
            <AlertDescription>
              Ensure material, workshop slot, and assigned PIC are ready before
              starting this order.
            </AlertDescription>
          </Alert>

          {startOrderError && (
            <Alert variant="destructive">
              <AlertTitle>Failed to start order</AlertTitle>
              <AlertDescription>{startOrderError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (isStartingOrder) return;
                setConfirmStartOrder(null);
                setStartOrderError(null);
              }}
              disabled={isStartingOrder}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!confirmStartOrder) return;
                setStartOrderError(null);
                try {
                  await startOrder({ orderId: confirmStartOrder.id });
                  setConfirmStartOrder(null);
                } catch (error) {
                  const message =
                    (error as { response?: { data?: { message?: string } } })
                      ?.response?.data?.message ??
                    "Unable to start this order.";
                  setStartOrderError(message);
                }
              }}
              disabled={isStartingOrder}
            >
              {isStartingOrder ? "Starting..." : "Yes, Start Production"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

function AdminOrdersPageSkeleton() {
  return (
    <section className="space-y-6">
      <div className="bg-muted/60 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="border-border/50 bg-card/50 py-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-10" />
              <Skeleton className="mt-2 h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="border-border overflow-hidden rounded-xl border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-14" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-12" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-18" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-14" />
                </TableHead>
                <TableHead className="text-right">
                  <Skeleton className="ml-auto h-4 w-14" />
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Skeleton className="h-6 w-32 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-30 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-7 w-7 rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryStatCard({
  title,
  value,
  helperText,
  icon,
}: {
  title: string;
  value: number;
  helperText: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-border/50 bg-card/50 hover:border-primary/20 group relative h-full overflow-hidden py-3 backdrop-blur-sm transition-all">
      <div className="from-primary/5 absolute inset-0 bg-linear-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm leading-snug font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-muted-foreground mt-1 flex items-start gap-1 text-xs leading-snug">
          <ArrowUpRight className="text-primary h-3 w-3" />
          <span className="text-primary font-medium">{helperText}</span>
        </p>
      </CardContent>
    </Card>
  );
}

type OrderUserMeta = {
  firstName: string;
};

function getOrderUserMeta(order: CustomOrder): OrderUserMeta {
  const raw = order as CustomOrder & {
    user?: {
      firstName?: string | null;
      userName?: string | null;
    };
    firstName?: string | null;
    userName?: string | null;
  };

  const firstNameRaw =
    raw.user?.firstName ??
    raw.firstName ??
    raw.user?.userName ??
    raw.userName ??
    "Unknown";

  const firstName =
    firstNameRaw.trim().split(/\s+/).filter(Boolean)[0] ?? "Unknown";

  return {
    firstName,
  };
}

function ExpandedOrderContent({ order }: { order: CustomOrder }) {
  const address = order.snapShotAddress;
  const totalPaid = Number(order.totalPaid ?? 0);
  const remainingValue = Number(
    order.remaining ?? Number(order.grandTotalPrice ?? 0) - totalPaid,
  );
  const safeRemaining = Number.isFinite(remainingValue)
    ? Math.max(0, remainingValue)
    : 0;

  const addressText = useMemo(() => {
    if (!address) {
      return order.deliveryType === "PICKUP" ? "Pickup by customer" : "-";
    }

    return [
      address.recipientName,
      address.phoneNumber ? `(${address.phoneNumber})` : null,
      address.line1,
      address.line2,
      address.subdistrict,
      address.district,
      address.city,
      address.province,
      address.postalCode,
    ]
      .filter((part) => Boolean(part && String(part).trim()))
      .join(", ");
  }, [address, order.deliveryType]);

  return (
    <div className="border-border/60 p-5">
      <div className="grid gap-2.5 md:grid-cols-2">
        <div className="bg-card/70 border-border/60 flex flex-col gap-1.5 rounded-lg border px-4 py-3">
          <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Payment Phase
          </p>
          <p className="text-foreground text-sm font-semibold">
            {order.currentPaymentPhase ?? "-"}
          </p>
        </div>

        <div className="bg-card/70 border-border/60 flex flex-col gap-1.5 rounded-lg border px-4 py-3">
          <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Items
          </p>
          <p className="text-foreground text-sm font-semibold">
            {order.items?.length ?? 0} item
            {order.items?.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="bg-card/70 border-border/60 flex flex-col gap-1.5 rounded-lg border px-4 py-3">
          <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            </svg>
            Delivery Type
          </p>
          <p className="text-foreground text-sm font-semibold">
            {order.deliveryType}
          </p>
        </div>

        <div className="bg-primary/10 border-primary/20 flex flex-col gap-1.5 rounded-lg border px-4 py-3">
          <p className="text-primary/80 flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5M16 12a2 2 0 000 4h5v-4h-5z" />
            </svg>
            Remaining
          </p>
          <p className="text-primary text-sm font-semibold">
            {formatPrice(safeRemaining)}
          </p>
        </div>

        <div className="bg-card/70 border-border/60 flex flex-col gap-1.5 rounded-lg border px-4 py-3 md:col-span-2">
          <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 10a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            Address
          </p>
          <p className="text-foreground text-sm leading-relaxed font-semibold">
            {addressText}
          </p>
        </div>

        <div className="bg-card/70 border-border/60 flex flex-col gap-1.5 rounded-lg border px-4 py-3 md:col-span-2">
          <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Notes
          </p>
          <p className="text-foreground text-sm font-semibold">
            {order.notes?.trim() || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}
