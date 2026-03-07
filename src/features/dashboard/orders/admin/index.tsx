"use client";

import { Fragment, type ReactNode, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
} from "@/lib/orderStatus";
import { formatPrice } from "@/lib/price";
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
  CalendarIcon,
  Funnel,
  RotateCcw,
  CheckCircle2,
  CircleX,
  PackageCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpandedOrderContent } from "../components/ExpandedOrderContent";
import { SummaryStatCard } from "../components/SummaryStatCard";
import { AdminOrdersPageSkeleton } from "../components/AdminOrdersPageSkeleton";
import { useDebounceValue } from "usehooks-ts";

const orderFilterStatuses = [
  "ALL",
  "PENDING_PAYMENT",
  "AWAITING_PRODUCTION",
  "IN_PRODUCTION",
  "READY_TO_SHIP",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

type OrderFilterStatus = (typeof orderFilterStatuses)[number];

const statusTabs: Array<{
  value: OrderFilterStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "ALL", label: "All", icon: PackageCheck },
  {
    value: "PENDING_PAYMENT",
    label: "Waiting Payment",
    icon: CircleDollarSign,
  },
  { value: "AWAITING_PRODUCTION", label: "Awaiting Production", icon: Clock3 },
  { value: "IN_PRODUCTION", label: "In Production", icon: Hammer },
  { value: "READY_TO_SHIP", label: "Ready to Ship", icon: Truck },
  { value: "SHIPPED", label: "Shipped", icon: PackageCheck },
  { value: "COMPLETED", label: "Completed", icon: CheckCircle2 },
  { value: "CANCELLED", label: "Cancelled", icon: CircleX },
];

export const AdminOrdersPage = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search] = useDebounceValue(searchInput, 350);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [orderBy, setOrderBy] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<OrderFilterStatus>("ALL");
  const [draftStartDate, setDraftStartDate] = useState<Date | undefined>(
    undefined,
  );
  const [draftEndDate, setDraftEndDate] = useState<Date | undefined>(undefined);
  const [draftOrderBy, setDraftOrderBy] = useState<"asc" | "desc">("desc");
  const [draftStatusFilter, setDraftStatusFilter] =
    useState<OrderFilterStatus>("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [confirmStartOrder, setConfirmStartOrder] =
    useState<CustomOrder | null>(null);
  const [startOrderError, setStartOrderError] = useState<string | null>(null);
  const perPage = 12;
  const { mutateAsync: startOrder, isPending: isStartingOrder } =
    useStartOrder();

  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data, isLoading, isError } = useGetAdminOrders({
    page,
    perPage,
    sortBy: "createdAt",
    orderBy: "desc",
  });
  const orders = data?.data ?? [];
  const meta = data?.meta;

  const sortedOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const fromTime = startDate
      ? new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
          0,
          0,
          0,
          0,
        ).getTime()
      : null;
    const toTime = endDate
      ? new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
          23,
          59,
          59,
          999,
        ).getTime()
      : null;

    return [...orders]
      .filter((order) => {
        if (statusFilter !== "ALL" && order.status !== statusFilter) {
          return false;
        }

        if (normalizedSearch) {
          const raw = order as CustomOrder & {
            user?: {
              firstName?: string | null;
              lastName?: string | null;
              userName?: string | null;
            };
            firstName?: string | null;
            lastName?: string | null;
            userName?: string | null;
          };
          const fullName = [
            raw.user?.firstName ?? raw.firstName ?? "",
            raw.user?.lastName ?? raw.lastName ?? "",
          ]
            .join(" ")
            .trim()
            .toLowerCase();
          const userName = (
            raw.user?.userName ??
            raw.userName ??
            ""
          ).toLowerCase();
          if (
            !fullName.includes(normalizedSearch) &&
            !userName.includes(normalizedSearch)
          ) {
            return false;
          }
        }

        if (fromTime !== null || toTime !== null) {
          const createdAt = new Date(order.createdAt).getTime();
          if (fromTime !== null && createdAt < fromTime) return false;
          if (toTime !== null && createdAt > toTime) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return orderBy === "asc" ? aTime - bTime : bTime - aTime;
      });
  }, [endDate, orders, orderBy, search, startDate, statusFilter]);

  const expandedColSpan = 7;

  const toggleExpand = (orderId: string) => {
    setExpandedRows((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const pendingPaymentCount = orders.filter(
    (order) => order.status === "PENDING_PAYMENT",
  ).length;
  const awaitingProductionCount = orders.filter(
    (order) => order.status === "AWAITING_PRODUCTION",
  ).length;
  const inProductionCount = orders.filter(
    (order) => order.status === "IN_PRODUCTION",
  ).length;
  const readyToShipCount = orders.filter(
    (order) => order.status === "READY_TO_SHIP",
  ).length;
  const shippedCount = orders.filter(
    (order) => order.status === "SHIPPED",
  ).length;
  const completedCount = orders.filter(
    (order) => order.status === "COMPLETED",
  ).length;
  const cancelledCount = orders.filter(
    (order) => order.status === "CANCELLED",
  ).length;

  const statusCounts: Record<OrderFilterStatus, number> = {
    ALL: orders.length,
    PENDING_PAYMENT: pendingPaymentCount,
    AWAITING_PRODUCTION: awaitingProductionCount,
    IN_PRODUCTION: inProductionCount,
    READY_TO_SHIP: readyToShipCount,
    SHIPPED: shippedCount,
    COMPLETED: completedCount,
    CANCELLED: cancelledCount,
  };

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
      <div className="flex justify-between">
        <Tabs
          value={statusFilter}
          onValueChange={(value) => {
            const next = value as OrderFilterStatus;
            setStatusFilter(next);
            setPage(1);
          }}
        >
          <TabsList className="h-auto flex-wrap justify-start">
            {statusTabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="group flex items-center gap-2"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs">{label}</span>
                <span className="bg-muted text-muted-foreground group-data-[state=active]:bg-primary/15 group-data-[state=active]:text-primary inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold">
                  {statusCounts[value]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Input
            type="search"
            placeholder="Search customer name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                onClick={() => {
                  setDraftStatusFilter(statusFilter);
                  setDraftOrderBy(orderBy);
                  setDraftStartDate(startDate);
                  setDraftEndDate(endDate);
                }}
              >
                <span className="flex gap-2">
                  <Funnel />
                  Filter
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-105 space-y-3 p-4" align="end">
              <div className="grid grid-cols-2 gap-2">
                <Field className="w-full" orientation="vertical">
                  <FieldLabel htmlFor="orders-filter-status">Status</FieldLabel>
                  <Select
                    value={draftStatusFilter}
                    onValueChange={(value) =>
                      setDraftStatusFilter(value as OrderFilterStatus)
                    }
                  >
                    <SelectTrigger id="orders-filter-status" className="w-full">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="PENDING_PAYMENT">
                        Waiting Payment
                      </SelectItem>
                      <SelectItem value="AWAITING_PRODUCTION">
                        Awaiting Production
                      </SelectItem>
                      <SelectItem value="IN_PRODUCTION">
                        In Production
                      </SelectItem>
                      <SelectItem value="READY_TO_SHIP">
                        Ready to Ship
                      </SelectItem>
                      <SelectItem value="SHIPPED">Shipped</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field className="w-full" orientation="vertical">
                  <FieldLabel htmlFor="orders-filter-sort">Sort By</FieldLabel>
                  <Select
                    value={draftOrderBy}
                    onValueChange={(value) =>
                      setDraftOrderBy(value as "asc" | "desc")
                    }
                  >
                    <SelectTrigger id="orders-filter-sort" className="w-full">
                      <SelectValue placeholder="Sort by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field className="w-full" orientation="vertical">
                  <FieldLabel htmlFor="orders-filter-start-date">
                    Start Date
                  </FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="orders-filter-start-date"
                        className="justify-start px-2.5 text-left font-normal"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        {draftStartDate ? (
                          format(draftStartDate, "LLL dd, y")
                        ) : (
                          <span className="text-muted-foreground">
                            Pick start date
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={draftStartDate}
                        onSelect={(date) => {
                          setDraftStartDate(date);
                          if (
                            date &&
                            draftEndDate &&
                            draftEndDate.getTime() < date.getTime()
                          ) {
                            setDraftEndDate(undefined);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </Field>

                <Field className="w-full" orientation="vertical">
                  <FieldLabel htmlFor="orders-filter-end-date">
                    End Date
                  </FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="orders-filter-end-date"
                        className="justify-start px-2.5 text-left font-normal"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        {draftEndDate ? (
                          format(draftEndDate, "LLL dd, y")
                        ) : (
                          <span className="text-muted-foreground">
                            Pick end date
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={draftEndDate}
                        disabled={(date) =>
                          draftStartDate
                            ? date <
                              new Date(
                                draftStartDate.getFullYear(),
                                draftStartDate.getMonth(),
                                draftStartDate.getDate(),
                              )
                            : false
                        }
                        onSelect={(date) => {
                          if (
                            !draftStartDate ||
                            !date ||
                            date.getTime() >= draftStartDate.getTime()
                          ) {
                            setDraftEndDate(date);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </Field>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDraftStatusFilter("ALL");
                    setDraftOrderBy("desc");
                    setDraftStartDate(undefined);
                    setDraftEndDate(undefined);
                    setSearchInput("");
                    setStatusFilter("ALL");
                    setOrderBy("desc");
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setPage(1);
                    setIsFilterOpen(false);
                  }}
                >
                  <span className="flex gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </span>
                </Button>
                <Button
                  onClick={() => {
                    setStatusFilter(draftStatusFilter);
                    setOrderBy(draftOrderBy);
                    setStartDate(draftStartDate);
                    setEndDate(draftEndDate);
                    setPage(1);
                    setIsFilterOpen(false);
                  }}
                >
                  Apply Filter
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
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
                  const canProcessOrder = order.status === "IN_PRODUCTION";
                  const canDeliverOrder = order.status === "READY_TO_SHIP";

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
                            className={getOrderStatusBadgeClass(order.status)}
                          >
                            {getOrderStatusLabel(order.status)}
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
                                  disabled={!canStartProduction}
                                  onClick={() => setConfirmStartOrder(order)}
                                >
                                  <span className="flex gap-2">
                                    <SquarePlayIcon className="h-4 w-4" />
                                    Start Order
                                  </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={!canProcessOrder}
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
                                  disabled={!canDeliverOrder}
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/admin/orders/${order.id}/deliver`,
                                    )
                                  }
                                >
                                  <span className="flex gap-2">
                                    <Truck className="h-4 w-4" />
                                    Deliver Order
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
