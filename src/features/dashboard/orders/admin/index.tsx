"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useGetAdminOrders from "@/hooks/api/order/useGetAdminOrders";
import useStartOrder from "@/hooks/api/order/useStartOrder";
import { getAvatarFallback } from "@/lib/avatar";
import {
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
} from "@/lib/orderStatus";
import { formatPrice } from "@/lib/price";
import { cn } from "@/lib/utils";
import { CustomOrder } from "@/types/customOrder";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronDown,
  CircleDollarSign,
  CogIcon,
  Eye,
  Funnel,
  Hammer,
  PackageCheck,
  RotateCcw,
  Settings,
  SquarePlayIcon,
  TriangleAlert,
  Truck,
  WalletCards,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { AdminOrdersPageSkeleton } from "../components/AdminOrdersPageSkeleton";
import { ExpandedOrderContent } from "../components/ExpandedOrderContent";
import { SummaryStatCard } from "../components/SummaryStatCard";

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
}> = [
  { value: "ALL", label: "All" },
  { value: "PENDING_PAYMENT", label: "Waiting Payment" },
  { value: "AWAITING_PRODUCTION", label: "Awaiting" },
  { value: "IN_PRODUCTION", label: "Production" },
  { value: "READY_TO_SHIP", label: "Ready" },
  { value: "COMPLETED", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
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

  const [draftOrderBy, setDraftOrderBy] = useState<"asc" | "desc">("desc");
  const [draftStartDate, setDraftStartDate] = useState<Date | undefined>(
    undefined,
  );
  const [draftEndDate, setDraftEndDate] = useState<Date | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [confirmStartOrder, setConfirmStartOrder] =
    useState<CustomOrder | null>(null);
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

  const handleDraftStartDateChange = (date?: Date) => {
    setDraftStartDate(date);

    if (date && draftEndDate && draftEndDate < date) {
      setDraftEndDate(undefined);
    }
  };

  const sortedOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const startBoundary = startDate
      ? new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
          0,
          0,
          0,
          0,
        )
      : undefined;
    const endBoundary = endDate
      ? new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
          23,
          59,
          59,
          999,
        )
      : undefined;

    return [...orders]
      .filter((order) => {
        if (statusFilter !== "ALL" && order.status !== statusFilter)
          return false;
        if (normalizedSearch) {
          const userMeta = getOrderUserMeta(order);
          if (!userMeta.firstName.toLowerCase().includes(normalizedSearch))
            return false;
        }
        const orderCreatedAt = new Date(order.createdAt);
        if (startBoundary && orderCreatedAt < startBoundary) return false;
        if (endBoundary && orderCreatedAt > endBoundary) return false;
        return true;
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return orderBy === "asc" ? aTime - bTime : bTime - aTime;
      });
  }, [orders, statusFilter, search, orderBy, startDate, endDate]);

  const toggleExpand = (orderId: string) => {
    setExpandedRows((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const statusCounts: Record<OrderFilterStatus, number> = {
    ALL: orders.length,
    PENDING_PAYMENT: orders.filter((o) => o.status === "PENDING_PAYMENT")
      .length,
    AWAITING_PRODUCTION: orders.filter(
      (o) => o.status === "AWAITING_PRODUCTION",
    ).length,
    IN_PRODUCTION: orders.filter((o) => o.status === "IN_PRODUCTION").length,
    READY_TO_SHIP: orders.filter((o) => o.status === "READY_TO_SHIP").length,
    SHIPPED: orders.filter((o) => o.status === "SHIPPED").length,
    COMPLETED: orders.filter((o) => o.status === "COMPLETED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
  };

  if (isLoading) return <AdminOrdersPageSkeleton />;

  return (
    <section className="space-y-8 px-1 pb-10">
      {/* --- Header Section --- */}

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
                Admin Orders
              </h1>
            </div>
            <p className="text-muted-foreground max-w-md text-sm">
              Manage production workflow and track order status globally.
            </p>
          </div>
        </div>
      </header>

      {/* --- Stats Section --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStatCard
          title="Waiting Payment"
          value={orders.filter((o) => o.status === "PENDING_PAYMENT").length}
          helperText="Need confirmation"
          icon={<CircleDollarSign className="text-primary" />}
        />
        <SummaryStatCard
          title="In Production"
          value={orders.filter((o) => o.status === "IN_PRODUCTION").length}
          helperText="Ongoing builds"
          icon={<Hammer className="text-primary" />}
        />
        <SummaryStatCard
          title="Ready to Ship"
          value={orders.filter((o) => o.status === "READY_TO_SHIP").length}
          helperText="Ready for pickup"
          icon={<Truck className="text-primary" />}
        />
        <SummaryStatCard
          title="Total Orders"
          value={orders.length}
          helperText="Lifetime orders"
          icon={<PackageCheck className="text-primary" />}
        />
      </div>

      {/* --- Filter & Tabs Section --- */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as OrderFilterStatus)}
          className="bg-card w-full rounded-full p-1.5 shadow-2xl/5 lg:w-auto"
        >
          <TabsList className="no-scrollbar h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0">
            {statusTabs.map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-background rounded-full border px-4 py-2 text-xs font-bold transition-all"
              >
                {label}
                {statusCounts[value] > 0 && (
                  <span className="bg-chart-2 text-card group-data-[state=active]:bg-background group-data-[state=active]:text-background ml-2 rounded-full px-1.5 py-0.5 text-[10px]">
                    {statusCounts[value]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* FILTERRR */}
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search customer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-2xl lg:w-64"
          />

          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="rounded-2xl border-dashed">
                <Funnel className="mr-2 h-4 w-4" /> Filter
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="w-85 rounded-3xl p-6 shadow-2xl"
              align="end"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-black tracking-widest uppercase">
                    Filter Tanggal
                  </h4>
                  <p className="text-muted-foreground text-[11px]">
                    Cari pesanan berdasarkan rentang waktu.
                  </p>
                </div>

                <div className="grid gap-4">
                  {/* Date Picker Section */}
                  <div className="grid grid-cols-2 gap-2">
                    <Field orientation="vertical" className="space-y-1.5">
                      <FieldLabel className="text-muted-foreground text-[10px] font-bold uppercase">
                        Dari
                      </FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start rounded-xl px-3 text-left font-normal",
                              !draftStartDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            <span className="text-xs">
                              {draftStartDate
                                ? format(draftStartDate, "dd/MM/yy")
                                : "Mulai"}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto rounded-2xl p-0"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={draftStartDate}
                            onSelect={handleDraftStartDateChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </Field>

                    <Field orientation="vertical" className="space-y-1.5">
                      <FieldLabel className="text-muted-foreground text-[10px] font-bold uppercase">
                        Sampai
                      </FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start rounded-xl px-3 text-left font-normal",
                              !draftEndDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            <span className="text-xs">
                              {draftEndDate
                                ? format(draftEndDate, "dd/MM/yy")
                                : "Selesai"}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto rounded-2xl p-0"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={draftEndDate}
                            disabled={(date) =>
                              draftStartDate ? date < draftStartDate : false
                            }
                            onSelect={setDraftEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </Field>
                  </div>

                  {/* Sort Order */}
                  <Field orientation="vertical" className="space-y-1.5">
                    <FieldLabel className="text-muted-foreground text-[10px] font-bold uppercase">
                      Urutkan
                    </FieldLabel>
                    <Select
                      value={draftOrderBy}
                      onValueChange={(v) =>
                        setDraftOrderBy(v as "asc" | "desc")
                      }
                    >
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="desc" className="rounded-lg text-xs">
                          Terbaru ke Terlama
                        </SelectItem>
                        <SelectItem value="asc" className="rounded-lg text-xs">
                          Terlama ke Terbaru
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="ghost"
                    className="h-10 flex-1 rounded-xl text-xs font-bold"
                    onClick={() => {
                      setDraftStartDate(undefined);
                      setDraftEndDate(undefined);
                      setDraftOrderBy("desc");
                      setStartDate(undefined);
                      setEndDate(undefined);
                      setOrderBy("desc");
                      setIsFilterOpen(false);
                    }}
                  >
                    <RotateCcw className="mr-2 h-3 w-3" /> Reset
                  </Button>
                  <Button
                    className="shadow-primary/20 h-10 flex-1 rounded-xl text-xs font-bold shadow-lg"
                    onClick={() => {
                      setStartDate(draftStartDate);
                      setEndDate(draftEndDate);
                      setOrderBy(draftOrderBy);
                      setPage(1);
                      setIsFilterOpen(false);
                    }}
                  >
                    Terapkan
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* --- Table Section (Modern Card Style) --- */}
      <div className="bg-card w-full overflow-x-auto overflow-y-visible rounded-2xl p-3 pb-6 shadow-lg/5">
        <Table className="border-separate border-spacing-y-3">
          <TableHeader>
            <TableRow className="border-none bg-transparent hover:bg-transparent">
              <TableHead className="text-muted-foreground px-6 text-[11px] font-bold tracking-[0.2em] uppercase">
                Order
              </TableHead>
              <TableHead className="text-muted-foreground text-[11px] font-bold tracking-[0.2em] uppercase">
                Customer
              </TableHead>
              <TableHead className="text-muted-foreground text-[11px] font-bold tracking-[0.2em] uppercase">
                Date
              </TableHead>
              <TableHead className="text-muted-foreground text-[11px] font-bold tracking-[0.2em] uppercase">
                Amount
              </TableHead>
              <TableHead className="text-muted-foreground text-[11px] font-bold tracking-[0.2em] uppercase">
                Status
              </TableHead>
              <TableHead className="text-muted-foreground text-right text-[11px] font-bold tracking-[0.2em] uppercase">
                Action
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.length === 0 ? (
              <TableRow className="bg-transparent hover:bg-transparent">
                <TableCell colSpan={7} className="px-6 py-14">
                  <div className="bg-muted/30 rounded-3xl border border-dashed p-8 text-center">
                    <p className="text-base font-bold">
                      No orders in{" "}
                      {statusTabs.find((tab) => tab.value === statusFilter)
                        ?.label ?? "this"}{" "}
                      tab
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Try another tab or adjust your search and filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedOrders.map((order) => {
                const orderRef = order.orderNumber?.trim() || order.id;
                const isExpanded = !!expandedRows[order.id];
                const userMeta = getOrderUserMeta(order);

                return (
                  <Fragment key={order.id}>
                    <TableRow
                      className={cn(
                        "group border-none transition-all duration-200 hover:-translate-y-0.5",
                        isExpanded ? "bg-primary/10" : "bg-muted/20",
                      )}
                    >
                      <TableCell
                        className={cn(
                          "rounded-l-3xl border-y border-l px-6 py-5 transition-colors",
                          isExpanded && "border-primary/20",
                        )}
                      >
                        <span
                          className={cn(
                            "rounded-lg border px-2.5 py-1 font-mono text-xs font-black transition-colors",
                            isExpanded
                              ? "bg-primary/15 border-primary/20 text-primary"
                              : "bg-muted",
                          )}
                        >
                          {orderRef}
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "border-y transition-colors",
                          isExpanded && "border-primary/20",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "text-primary flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold ring-2 transition-colors",
                              isExpanded
                                ? "bg-primary/15 ring-primary/15"
                                : "bg-primary/10 ring-primary/5",
                            )}
                          >
                            {getAvatarFallback({
                              firstName: userMeta.firstName,
                              name: userMeta.firstName,
                            })}
                          </div>
                          <span className="text-sm font-bold tracking-tight">
                            {userMeta.firstName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-muted-foreground border-y text-xs font-medium transition-colors",
                          isExpanded && "border-primary/20",
                        )}
                      >
                        {format(new Date(order.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "border-y text-sm font-black tracking-tight transition-colors",
                          isExpanded && "border-primary/20",
                        )}
                      >
                        {formatPrice(Number(order.grandTotalPrice ?? 0))}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "border-y transition-colors",
                          isExpanded && "border-primary/20",
                        )}
                      >
                        <Badge
                          className={cn(
                            "px-2.5 py-0.5 shadow-none",
                            getOrderStatusBadgeClass(order.status),
                          )}
                        >
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "border-y text-right transition-colors",
                          isExpanded && "border-primary/20",
                        )}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-9 w-9 rounded-xl transition-colors",
                                isExpanded
                                  ? "bg-primary/10 hover:bg-primary/15"
                                  : "hover:bg-muted",
                              )}
                            >
                              <Settings className="text-muted-foreground h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-52 rounded-2xl p-2 shadow-xl"
                          >
                            <div className="text-muted-foreground/70 px-2 py-1.5 text-[10px] font-bold tracking-widest uppercase">
                              Order Actions
                            </div>

                            {/* 1. View Detail (Selalu Ada) */}
                            <DropdownMenuItem
                              className="cursor-pointer rounded-lg py-2.5"
                              onClick={() =>
                                router.push(
                                  `/dashboard/admin/orders/${order.id}`,
                                )
                              }
                            >
                              <Eye className="mr-3 h-4 w-4 text-blue-500" />
                              <span className="font-medium">View Detail</span>
                            </DropdownMenuItem>

                            {/* 2. Start Production (Hanya untuk AWAITING_PRODUCTION) */}
                            <DropdownMenuItem
                              className="cursor-pointer rounded-lg py-2.5"
                              disabled={order.status !== "AWAITING_PRODUCTION"}
                              onClick={() => setConfirmStartOrder(order)}
                            >
                              <SquarePlayIcon className="mr-3 h-4 w-4 text-orange-500" />
                              <span className="font-medium">
                                Start Production
                              </span>
                            </DropdownMenuItem>

                            {/* 3. Process Order (Progress Produksi - Hanya untuk IN_PRODUCTION) */}
                            <DropdownMenuItem
                              className="cursor-pointer rounded-lg py-2.5"
                              disabled={order.status !== "IN_PRODUCTION"}
                              onClick={() =>
                                router.push(
                                  `/dashboard/admin/orders/${order.id}/process`,
                                )
                              }
                            >
                              <CogIcon className="mr-3 h-4 w-4 text-indigo-500" />
                              <span className="font-medium">
                                Update Progress
                              </span>
                            </DropdownMenuItem>

                            {/* 4. Deliver Order (Hanya untuk READY_TO_SHIP) */}
                            <DropdownMenuItem
                              className="cursor-pointer rounded-lg py-2.5"
                              disabled={order.status !== "READY_TO_SHIP"}
                              onClick={() =>
                                router.push(
                                  `/dashboard/admin/orders/${order.id}/deliver`,
                                )
                              }
                            >
                              <Truck className="mr-3 h-4 w-4 text-emerald-500" />
                              <span className="font-medium">Deliver Order</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "rounded-r-3xl border-y border-r pr-4 transition-colors",
                          isExpanded && "border-primary/20",
                        )}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8 transition-all duration-300",
                            isExpanded &&
                              "bg-primary/10 text-primary hover:bg-primary/15 rotate-180",
                          )}
                          onClick={() => toggleExpand(order.id)}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-transparent hover:bg-transparent">
                        <TableCell colSpan={7} className="p-0 pt-1 pb-4">
                          <div className="bg-muted/30 mx-2 rounded-3xl border border-dashed p-6 shadow-inner">
                            <ExpandedOrderContent order={order} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- Pagination --- */}
      <div className="flex items-center justify-between px-2">
        <p className="text-muted-foreground text-xs font-medium">
          Showing{" "}
          <span className="text-foreground font-bold">
            {sortedOrders.length}
          </span>{" "}
          of{" "}
          <span className="text-foreground font-bold">{meta?.total ?? 0}</span>{" "}
          orders
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl px-4"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!meta?.hasPrevious}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl px-4"
            onClick={() => setPage((p) => p + 1)}
            disabled={!meta?.hasNext}
          >
            Next
          </Button>
        </div>
      </div>

      {/* --- Dialogs (Start Production) --- */}
      <Dialog
        open={Boolean(confirmStartOrder)}
        onOpenChange={(o) => !o && setConfirmStartOrder(null)}
      >
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              Start Production?
            </DialogTitle>
            <DialogDescription>
              Order{" "}
              <span className="font-mono font-bold">
                {confirmStartOrder?.orderNumber}
              </span>{" "}
              will be moved to the production queue.
            </DialogDescription>
          </DialogHeader>
          <Alert className="bg-primary/5 border-primary/20 rounded-2xl">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle className="font-bold">Confirmation Required</AlertTitle>
            <AlertDescription className="text-xs">
              Ensure all materials and workshops are ready before proceeding.
            </AlertDescription>
          </Alert>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setConfirmStartOrder(null)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl px-8"
              onClick={async () => {
                if (confirmStartOrder) {
                  await startOrder({ orderId: confirmStartOrder.id });
                  setConfirmStartOrder(null);
                }
              }}
            >
              Confirm & Start
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

// Helper function
function getOrderUserMeta(order: CustomOrder) {
  const raw = order as any;
  const nameRaw =
    raw.user?.firstName ?? raw.firstName ?? raw.user?.userName ?? "Unknown";
  return { firstName: nameRaw.split(" ")[0] };
}
