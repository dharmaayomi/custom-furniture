// "use client";

// import { Fragment, type ReactNode, useEffect, useMemo, useState } from "react";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Calendar } from "@/components/ui/calendar";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Field, FieldLabel } from "@/components/ui/field";
// import { Input } from "@/components/ui/input";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import useGetAdminOrders from "@/hooks/api/order/useGetAdminOrders";
// import useStartOrder from "@/hooks/api/order/useStartOrder";
// import { getAvatarFallback } from "@/lib/avatar";
// import {
//   getOrderStatusBadgeClass,
//   getOrderStatusLabel,
// } from "@/lib/orderStatus";
// import { formatPrice } from "@/lib/price";
// import { CustomOrder, OrderStatus } from "@/types/customOrder";
// import {
//   ArrowUpRight,
//   ChevronDown,
//   ChevronRight,
//   Clock3,
//   CircleDollarSign,
//   Hammer,
//   TriangleAlert,
//   Truck,
//   Settings,
//   CogIcon,
//   Eye,
//   SquarePlayIcon,
//   CalendarIcon,
//   Funnel,
//   RotateCcw,
//   CheckCircle2,
//   CircleX,
//   PackageCheck,
// } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { cn } from "@/lib/utils";
// import { format } from "date-fns";
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { ExpandedOrderContent } from "../components/ExpandedOrderContent";
// import { SummaryStatCard } from "../components/SummaryStatCard";
// import { AdminOrdersPageSkeleton } from "../components/AdminOrdersPageSkeleton";
// import { useDebounceValue } from "usehooks-ts";

// const orderFilterStatuses = [
//   "ALL",
//   "PENDING_PAYMENT",
//   "AWAITING_PRODUCTION",
//   "IN_PRODUCTION",
//   "READY_TO_SHIP",
//   "SHIPPED",
//   "COMPLETED",
//   "CANCELLED",
// ] as const;

// type OrderFilterStatus = (typeof orderFilterStatuses)[number];

// const statusTabs: Array<{
//   value: OrderFilterStatus;
//   label: string;
//   icon: React.ComponentType<{ className?: string }>;
// }> = [
//   { value: "ALL", label: "All", icon: PackageCheck },
//   {
//     value: "PENDING_PAYMENT",
//     label: "Waiting Payment",
//     icon: CircleDollarSign,
//   },
//   { value: "AWAITING_PRODUCTION", label: "Awaiting Production", icon: Clock3 },
//   { value: "IN_PRODUCTION", label: "In Production", icon: Hammer },
//   { value: "READY_TO_SHIP", label: "Ready to Ship", icon: Truck },
//   { value: "SHIPPED", label: "Shipped", icon: PackageCheck },
//   { value: "COMPLETED", label: "Completed", icon: CheckCircle2 },
//   { value: "CANCELLED", label: "Cancelled", icon: CircleX },
// ];

// export const AdminOrdersPage = () => {
//   const router = useRouter();
//   const [page, setPage] = useState(1);
//   const [searchInput, setSearchInput] = useState("");
//   const [search] = useDebounceValue(searchInput, 350);
//   const [startDate, setStartDate] = useState<Date | undefined>(undefined);
//   const [endDate, setEndDate] = useState<Date | undefined>(undefined);
//   const [orderBy, setOrderBy] = useState<"asc" | "desc">("desc");
//   const [statusFilter, setStatusFilter] = useState<OrderFilterStatus>("ALL");
//   const [draftStartDate, setDraftStartDate] = useState<Date | undefined>(
//     undefined,
//   );
//   const [draftEndDate, setDraftEndDate] = useState<Date | undefined>(undefined);
//   const [draftOrderBy, setDraftOrderBy] = useState<"asc" | "desc">("desc");
//   const [draftStatusFilter, setDraftStatusFilter] =
//     useState<OrderFilterStatus>("ALL");
//   const [isFilterOpen, setIsFilterOpen] = useState(false);
//   const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
//   const [confirmStartOrder, setConfirmStartOrder] =
//     useState<CustomOrder | null>(null);
//   const [startOrderError, setStartOrderError] = useState<string | null>(null);
//   const perPage = 12;
//   const { mutateAsync: startOrder, isPending: isStartingOrder } =
//     useStartOrder();

//   useEffect(() => {
//     setPage(1);
//   }, [search]);

//   const { data, isLoading, isError } = useGetAdminOrders({
//     page,
//     perPage,
//     sortBy: "createdAt",
//     orderBy: "desc",
//   });
//   const orders = data?.data ?? [];
//   const meta = data?.meta;

//   const sortedOrders = useMemo(() => {
//     const normalizedSearch = search.trim().toLowerCase();
//     const fromTime = startDate
//       ? new Date(
//           startDate.getFullYear(),
//           startDate.getMonth(),
//           startDate.getDate(),
//           0,
//           0,
//           0,
//           0,
//         ).getTime()
//       : null;
//     const toTime = endDate
//       ? new Date(
//           endDate.getFullYear(),
//           endDate.getMonth(),
//           endDate.getDate(),
//           23,
//           59,
//           59,
//           999,
//         ).getTime()
//       : null;

//     return [...orders]
//       .filter((order) => {
//         if (statusFilter !== "ALL" && order.status !== statusFilter) {
//           return false;
//         }

//         if (normalizedSearch) {
//           const raw = order as CustomOrder & {
//             user?: {
//               firstName?: string | null;
//               lastName?: string | null;
//               userName?: string | null;
//             };
//             firstName?: string | null;
//             lastName?: string | null;
//             userName?: string | null;
//           };
//           const fullName = [
//             raw.user?.firstName ?? raw.firstName ?? "",
//             raw.user?.lastName ?? raw.lastName ?? "",
//           ]
//             .join(" ")
//             .trim()
//             .toLowerCase();
//           const userName = (
//             raw.user?.userName ??
//             raw.userName ??
//             ""
//           ).toLowerCase();
//           if (
//             !fullName.includes(normalizedSearch) &&
//             !userName.includes(normalizedSearch)
//           ) {
//             return false;
//           }
//         }

//         if (fromTime !== null || toTime !== null) {
//           const createdAt = new Date(order.createdAt).getTime();
//           if (fromTime !== null && createdAt < fromTime) return false;
//           if (toTime !== null && createdAt > toTime) return false;
//         }

//         return true;
//       })
//       .sort((a, b) => {
//         const aTime = new Date(a.createdAt).getTime();
//         const bTime = new Date(b.createdAt).getTime();
//         return orderBy === "asc" ? aTime - bTime : bTime - aTime;
//       });
//   }, [endDate, orders, orderBy, search, startDate, statusFilter]);

//   const expandedColSpan = 7;

//   const toggleExpand = (orderId: string) => {
//     setExpandedRows((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
//   };

//   const pendingPaymentCount = orders.filter(
//     (order) => order.status === "PENDING_PAYMENT",
//   ).length;
//   const awaitingProductionCount = orders.filter(
//     (order) => order.status === "AWAITING_PRODUCTION",
//   ).length;
//   const inProductionCount = orders.filter(
//     (order) => order.status === "IN_PRODUCTION",
//   ).length;
//   const readyToShipCount = orders.filter(
//     (order) => order.status === "READY_TO_SHIP",
//   ).length;
//   const shippedCount = orders.filter(
//     (order) => order.status === "SHIPPED",
//   ).length;
//   const completedCount = orders.filter(
//     (order) => order.status === "COMPLETED",
//   ).length;
//   const cancelledCount = orders.filter(
//     (order) => order.status === "CANCELLED",
//   ).length;

//   const statusCounts: Record<OrderFilterStatus, number> = {
//     ALL: orders.length,
//     PENDING_PAYMENT: pendingPaymentCount,
//     AWAITING_PRODUCTION: awaitingProductionCount,
//     IN_PRODUCTION: inProductionCount,
//     READY_TO_SHIP: readyToShipCount,
//     SHIPPED: shippedCount,
//     COMPLETED: completedCount,
//     CANCELLED: cancelledCount,
//   };

//   if (isLoading) {
//     return <AdminOrdersPageSkeleton />;
//   }

//   if (isError) {
//     return (
//       <Card>
//         <CardHeader>
//           <CardTitle>Admin Orders</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <p className="text-sm">Failed to load orders.</p>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <section className="space-y-6">
//       <div className="bg-muted/60 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
//         <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
//           Admin Orders
//         </h1>
//         <p className="text-muted-foreground mt-2 text-sm">
//           All orders with production status labels.
//         </p>
//       </div>

//       <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
//         <SummaryStatCard
//           title="Waiting Payment"
//           value={pendingPaymentCount}
//           helperText="Need payment confirmation"
//           icon={<CircleDollarSign className="text-primary h-4 w-4" />}
//         />
//         <SummaryStatCard
//           title="Awaiting Production"
//           value={awaitingProductionCount}
//           helperText="Waiting to be started"
//           icon={<Clock3 className="text-primary h-4 w-4" />}
//         />
//         <SummaryStatCard
//           title="In Production"
//           value={inProductionCount}
//           helperText="Currently being processed"
//           icon={<Hammer className="text-primary h-4 w-4" />}
//         />
//         <SummaryStatCard
//           title="Ready to Ship"
//           value={readyToShipCount}
//           helperText="Ready for delivery handoff"
//           icon={<Truck className="text-primary h-4 w-4" />}
//         />
//       </div>
//       <div className="flex justify-between">
//         <Tabs
//           value={statusFilter}
//           onValueChange={(value) => {
//             const next = value as OrderFilterStatus;
//             setStatusFilter(next);
//             setPage(1);
//           }}
//         >
//           <TabsList className="h-auto flex-wrap justify-start">
//             {statusTabs.map(({ value, label, icon: Icon }) => (
//               <TabsTrigger
//                 key={value}
//                 value={value}
//                 className="group flex items-center gap-2"
//               >
//                 <Icon className="h-3.5 w-3.5" />
//                 <span className="text-xs">{label}</span>
//                 <span className="bg-muted text-muted-foreground group-data-[state=active]:bg-primary/15 group-data-[state=active]:text-primary inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold">
//                   {statusCounts[value]}
//                 </span>
//               </TabsTrigger>
//             ))}
//           </TabsList>
//         </Tabs>

//         <div className="flex gap-2">
//           <Input
//             type="search"
//             placeholder="Search customer name..."
//             value={searchInput}
//             onChange={(e) => setSearchInput(e.target.value)}
//             className="w-64"
//           />
//           <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
//             <PopoverTrigger asChild>
//               <Button
//                 onClick={() => {
//                   setDraftStatusFilter(statusFilter);
//                   setDraftOrderBy(orderBy);
//                   setDraftStartDate(startDate);
//                   setDraftEndDate(endDate);
//                 }}
//               >
//                 <span className="flex gap-2">
//                   <Funnel />
//                   Filter
//                 </span>
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent className="w-105 space-y-3 p-4" align="end">
//               <div className="grid grid-cols-2 gap-2">
//                 <Field className="w-full" orientation="vertical">
//                   <FieldLabel htmlFor="orders-filter-status">Status</FieldLabel>
//                   <Select
//                     value={draftStatusFilter}
//                     onValueChange={(value) =>
//                       setDraftStatusFilter(value as OrderFilterStatus)
//                     }
//                   >
//                     <SelectTrigger id="orders-filter-status" className="w-full">
//                       <SelectValue placeholder="All Status" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="ALL">All Status</SelectItem>
//                       <SelectItem value="PENDING_PAYMENT">
//                         Waiting Payment
//                       </SelectItem>
//                       <SelectItem value="AWAITING_PRODUCTION">
//                         Awaiting Production
//                       </SelectItem>
//                       <SelectItem value="IN_PRODUCTION">
//                         In Production
//                       </SelectItem>
//                       <SelectItem value="READY_TO_SHIP">
//                         Ready to Ship
//                       </SelectItem>
//                       <SelectItem value="SHIPPED">Shipped</SelectItem>
//                       <SelectItem value="COMPLETED">Completed</SelectItem>
//                       <SelectItem value="CANCELLED">Cancelled</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </Field>

//                 <Field className="w-full" orientation="vertical">
//                   <FieldLabel htmlFor="orders-filter-sort">Sort By</FieldLabel>
//                   <Select
//                     value={draftOrderBy}
//                     onValueChange={(value) =>
//                       setDraftOrderBy(value as "asc" | "desc")
//                     }
//                   >
//                     <SelectTrigger id="orders-filter-sort" className="w-full">
//                       <SelectValue placeholder="Sort by date" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="desc">Newest First</SelectItem>
//                       <SelectItem value="asc">Oldest First</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </Field>
//               </div>

//               <div className="grid grid-cols-2 gap-2">
//                 <Field className="w-full" orientation="vertical">
//                   <FieldLabel htmlFor="orders-filter-start-date">
//                     Start Date
//                   </FieldLabel>
//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         id="orders-filter-start-date"
//                         className="justify-start px-2.5 text-left font-normal"
//                       >
//                         <CalendarIcon className="h-4 w-4" />
//                         {draftStartDate ? (
//                           format(draftStartDate, "LLL dd, y")
//                         ) : (
//                           <span className="text-muted-foreground">
//                             Pick start date
//                           </span>
//                         )}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0" align="start">
//                       <Calendar
//                         mode="single"
//                         selected={draftStartDate}
//                         onSelect={(date) => {
//                           setDraftStartDate(date);
//                           if (
//                             date &&
//                             draftEndDate &&
//                             draftEndDate.getTime() < date.getTime()
//                           ) {
//                             setDraftEndDate(undefined);
//                           }
//                         }}
//                       />
//                     </PopoverContent>
//                   </Popover>
//                 </Field>

//                 <Field className="w-full" orientation="vertical">
//                   <FieldLabel htmlFor="orders-filter-end-date">
//                     End Date
//                   </FieldLabel>
//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         id="orders-filter-end-date"
//                         className="justify-start px-2.5 text-left font-normal"
//                       >
//                         <CalendarIcon className="h-4 w-4" />
//                         {draftEndDate ? (
//                           format(draftEndDate, "LLL dd, y")
//                         ) : (
//                           <span className="text-muted-foreground">
//                             Pick end date
//                           </span>
//                         )}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0" align="start">
//                       <Calendar
//                         mode="single"
//                         selected={draftEndDate}
//                         disabled={(date) =>
//                           draftStartDate
//                             ? date <
//                               new Date(
//                                 draftStartDate.getFullYear(),
//                                 draftStartDate.getMonth(),
//                                 draftStartDate.getDate(),
//                               )
//                             : false
//                         }
//                         onSelect={(date) => {
//                           if (
//                             !draftStartDate ||
//                             !date ||
//                             date.getTime() >= draftStartDate.getTime()
//                           ) {
//                             setDraftEndDate(date);
//                           }
//                         }}
//                       />
//                     </PopoverContent>
//                   </Popover>
//                 </Field>
//               </div>

//               <div className="flex justify-end gap-2">
//                 <Button
//                   variant="outline"
//                   onClick={() => {
//                     setDraftStatusFilter("ALL");
//                     setDraftOrderBy("desc");
//                     setDraftStartDate(undefined);
//                     setDraftEndDate(undefined);
//                     setSearchInput("");
//                     setStatusFilter("ALL");
//                     setOrderBy("desc");
//                     setStartDate(undefined);
//                     setEndDate(undefined);
//                     setPage(1);
//                     setIsFilterOpen(false);
//                   }}
//                 >
//                   <span className="flex gap-2">
//                     <RotateCcw className="h-4 w-4" />
//                     Reset
//                   </span>
//                 </Button>
//                 <Button
//                   onClick={() => {
//                     setStatusFilter(draftStatusFilter);
//                     setOrderBy(draftOrderBy);
//                     setStartDate(draftStartDate);
//                     setEndDate(draftEndDate);
//                     setPage(1);
//                     setIsFilterOpen(false);
//                   }}
//                 >
//                   Apply Filter
//                 </Button>
//               </div>
//             </PopoverContent>
//           </Popover>
//         </div>
//       </div>

//       {sortedOrders.length === 0 ? (
//         <Card className="py-3">
//           <CardContent className="py-10 text-center">
//             <p className="text-sm">No orders available.</p>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="space-y-4">
//           {/* table */}
//           <div className="border-border overflow-hidden rounded-xl border shadow-sm">
//             <Table>
//               <TableHeader>
//                 <TableRow className="bg-muted/50 hover:bg-muted/50">
//                   <TableHead className="text-foreground/90 h-12 font-semibold">
//                     Order Number
//                   </TableHead>
//                   <TableHead className="text-foreground/90 h-12 font-semibold">
//                     Name
//                   </TableHead>
//                   <TableHead className="text-foreground/90 h-12 font-semibold">
//                     Date
//                   </TableHead>
//                   <TableHead className="text-foreground/90 h-12 font-semibold">
//                     Grand Total
//                   </TableHead>
//                   <TableHead className="text-foreground/90 h-12 font-semibold">
//                     Status
//                   </TableHead>
//                   <TableHead className="text-foreground/90 h-12 text-right font-semibold">
//                     Action
//                   </TableHead>
//                   <TableHead className="h-12 w-10 px-2" />
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {sortedOrders.map((order, index) => {
//                   const orderRef = order.orderNumber?.trim() || order.id;
//                   const isExpanded = !!expandedRows[order.id];
//                   const userMeta = getOrderUserMeta(order);
//                   const canStartProduction =
//                     order.status === "AWAITING_PRODUCTION";
//                   const canProcessOrder = order.status === "IN_PRODUCTION";
//                   const canDeliverOrder = order.status === "READY_TO_SHIP";

//                   return (
//                     <Fragment key={order.id}>
//                       <TableRow
//                         className={cn(
//                           "h-15 transition-colors duration-150",
//                           index % 2 === 0 ? "bg-background" : "bg-muted/22",
//                           "hover:bg-muted/45",
//                           isExpanded && "bg-muted/55 border-b-0",
//                         )}
//                       >
//                         <TableCell className="text-foreground font-medium">
//                           <span className="bg-muted/40 border-border/70 rounded-md border px-2 py-0.5 font-mono text-sm font-bold">
//                             {orderRef}
//                           </span>
//                         </TableCell>
//                         <TableCell>
//                           <div className="flex items-center gap-2">
//                             <div className="bg-primary/15 ring-primary/60 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ring-2">
//                               {getAvatarFallback({
//                                 firstName: userMeta.firstName,
//                                 name: userMeta.firstName,
//                               })}
//                             </div>
//                             <span className="text-foreground text-sm font-medium">
//                               {userMeta.firstName}
//                             </span>
//                           </div>
//                         </TableCell>
//                         <TableCell className="text-muted-foreground text-sm">
//                           {new Date(order.createdAt).toLocaleString("en-US", {
//                             year: "numeric",
//                             month: "short",
//                             day: "2-digit",
//                           })}
//                         </TableCell>
//                         <TableCell className="text-foreground font-semibold">
//                           {formatPrice(Number(order.grandTotalPrice ?? 0))}
//                         </TableCell>
//                         <TableCell>
//                           <Badge
//                             className={getOrderStatusBadgeClass(order.status)}
//                           >
//                             {getOrderStatusLabel(order.status)}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-right">
//                           <div className="flex justify-end">
//                             <DropdownMenu>
//                               <DropdownMenuTrigger asChild>
//                                 <Button
//                                   type="button"
//                                   variant="ghost"
//                                   size="icon"
//                                   className="hover:bg-muted h-8 w-8"
//                                   aria-label={`Open actions for order ${orderRef}`}
//                                 >
//                                   <Settings className="h-4 w-4" />
//                                 </Button>
//                               </DropdownMenuTrigger>
//                               <DropdownMenuContent align="end" className="w-48">
//                                 <DropdownMenuItem
//                                   onClick={() =>
//                                     router.push(
//                                       `/dashboard/admin/orders/${order.id}`,
//                                     )
//                                   }
//                                 >
//                                   <span className="flex gap-2">
//                                     <Eye className="h-4 w-4" />
//                                     View Detail
//                                   </span>
//                                 </DropdownMenuItem>
//                                 <DropdownMenuItem
//                                   disabled={!canStartProduction}
//                                   onClick={() => setConfirmStartOrder(order)}
//                                 >
//                                   <span className="flex gap-2">
//                                     <SquarePlayIcon className="h-4 w-4" />
//                                     Start Order
//                                   </span>
//                                 </DropdownMenuItem>
//                                 <DropdownMenuItem
//                                   disabled={!canProcessOrder}
//                                   onClick={() =>
//                                     router.push(
//                                       `/dashboard/admin/orders/${order.id}/process`,
//                                     )
//                                   }
//                                 >
//                                   <span className="flex gap-2">
//                                     <CogIcon className="h-4 w-4" />
//                                     Process Order
//                                   </span>
//                                 </DropdownMenuItem>
//                                 <DropdownMenuItem
//                                   disabled={!canDeliverOrder}
//                                   onClick={() =>
//                                     router.push(
//                                       `/dashboard/admin/orders/${order.id}/deliver`,
//                                     )
//                                   }
//                                 >
//                                   <span className="flex gap-2">
//                                     <Truck className="h-4 w-4" />
//                                     Deliver Order
//                                   </span>
//                                 </DropdownMenuItem>
//                               </DropdownMenuContent>
//                             </DropdownMenu>
//                           </div>
//                         </TableCell>
//                         <TableCell>
//                           <Button
//                             type="button"
//                             variant="ghost"
//                             size="icon"
//                             className="hover:bg-muted h-7 w-7 transition-transform duration-200"
//                             onClick={() => toggleExpand(order.id)}
//                             aria-label={
//                               isExpanded
//                                 ? `Collapse order ${orderRef}`
//                                 : `Expand order ${orderRef}`
//                             }
//                           >
//                             {isExpanded ? (
//                               <ChevronDown className="h-4 w-4" />
//                             ) : (
//                               <ChevronRight className="h-4 w-4" />
//                             )}
//                           </Button>
//                         </TableCell>
//                       </TableRow>
//                       {isExpanded && (
//                         <TableRow className="bg-background/90 hover:bg-background/90">
//                           <TableCell
//                             colSpan={expandedColSpan}
//                             className="border-border/60 border-t py-3"
//                           >
//                             <ExpandedOrderContent order={order} />
//                           </TableCell>
//                         </TableRow>
//                       )}
//                     </Fragment>
//                   );
//                 })}
//               </TableBody>
//             </Table>
//           </div>

//           <div className="flex items-center justify-between">
//             <p className="text-muted-foreground text-xs">
//               Page {meta?.page ?? page} of{" "}
//               {meta ? Math.max(1, Math.ceil(meta.total / meta.perPage)) : 1}
//             </p>
//             <div className="flex gap-2">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() =>
//                   void setPage(Math.max(1, (meta?.page ?? page) - 1))
//                 }
//                 disabled={!meta?.hasPrevious}
//               >
//                 Previous
//               </Button>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => void setPage((meta?.page ?? page) + 1)}
//                 disabled={!meta?.hasNext}
//               >
//                 Next
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}

//       <Dialog
//         open={Boolean(confirmStartOrder)}
//         onOpenChange={(open) => {
//           if (isStartingOrder) return;
//           if (!open) {
//             setConfirmStartOrder(null);
//             setStartOrderError(null);
//           }
//         }}
//       >
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>Start Production?</DialogTitle>
//             <DialogDescription>
//               This will move the order to <strong>In Production</strong>.
//             </DialogDescription>
//           </DialogHeader>

//           <Alert className="border-amber-200 bg-amber-50 text-amber-900">
//             <TriangleAlert className="h-4 w-4" />
//             <AlertTitle>Preparation Checklist</AlertTitle>
//             <AlertDescription>
//               Ensure material, workshop slot, and assigned PIC are ready before
//               starting this order.
//             </AlertDescription>
//           </Alert>

//           {startOrderError && (
//             <Alert variant="destructive">
//               <AlertTitle>Failed to start order</AlertTitle>
//               <AlertDescription>{startOrderError}</AlertDescription>
//             </Alert>
//           )}

//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => {
//                 if (isStartingOrder) return;
//                 setConfirmStartOrder(null);
//                 setStartOrderError(null);
//               }}
//               disabled={isStartingOrder}
//             >
//               Cancel
//             </Button>
//             <Button
//               onClick={async () => {
//                 if (!confirmStartOrder) return;
//                 setStartOrderError(null);
//                 try {
//                   await startOrder({ orderId: confirmStartOrder.id });
//                   setConfirmStartOrder(null);
//                 } catch (error) {
//                   const message =
//                     (error as { response?: { data?: { message?: string } } })
//                       ?.response?.data?.message ??
//                     "Unable to start this order.";
//                   setStartOrderError(message);
//                 }
//               }}
//               disabled={isStartingOrder}
//             >
//               {isStartingOrder ? "Starting..." : "Yes, Start Production"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </section>
//   );
// };

// type OrderUserMeta = {
//   firstName: string;
// };

// function getOrderUserMeta(order: CustomOrder): OrderUserMeta {
//   const raw = order as CustomOrder & {
//     user?: {
//       firstName?: string | null;
//       userName?: string | null;
//     };
//     firstName?: string | null;
//     userName?: string | null;
//   };

//   const firstNameRaw =
//     raw.user?.firstName ??
//     raw.firstName ??
//     raw.user?.userName ??
//     raw.userName ??
//     "Unknown";

//   const firstName =
//     firstNameRaw.trim().split(/\s+/).filter(Boolean)[0] ?? "Unknown";

//   return {
//     firstName,
//   };
// }
"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
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
import { CustomOrder } from "@/types/customOrder";
import {
  ChevronDown,
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
  Clock3,
  WalletCards,
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
  const [draftStatusFilter, setDraftStatusFilter] =
    useState<OrderFilterStatus>("ALL");
  const [draftOrderBy, setDraftOrderBy] = useState<"asc" | "desc">("desc");
  const [draftStartDate, setDraftStartDate] = useState<Date | undefined>(
    undefined,
  );
  const [draftEndDate, setDraftEndDate] = useState<Date | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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

  const sortedOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return [...orders]
      .filter((order) => {
        if (statusFilter !== "ALL" && order.status !== statusFilter)
          return false;
        if (normalizedSearch) {
          const userMeta = getOrderUserMeta(order);
          if (!userMeta.firstName.toLowerCase().includes(normalizedSearch))
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return orderBy === "asc" ? aTime - bTime : bTime - aTime;
      });
  }, [orders, statusFilter, search, orderBy]);

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
          className="bg-muted/50 w-full rounded-full p-1 lg:w-auto"
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
                            onSelect={setDraftStartDate}
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
      <div className="w-full overflow-x-auto overflow-y-visible pb-6">
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
                        "group bg-card border-none transition-all duration-200 hover:-translate-y-0.5",
                      )}
                    >
                      <TableCell className="rounded-l-3xl border-y border-l px-6 py-5">
                        <span className="bg-muted rounded-lg border px-2.5 py-1 font-mono text-xs font-black">
                          {orderRef}
                        </span>
                      </TableCell>
                      <TableCell className="border-y">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary ring-primary/5 flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold ring-2">
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
                      <TableCell className="text-muted-foreground border-y text-xs font-medium">
                        {format(new Date(order.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="border-y text-sm font-black tracking-tight">
                        {formatPrice(Number(order.grandTotalPrice ?? 0))}
                      </TableCell>
                      <TableCell className="border-y">
                        <Badge
                          className={cn(
                            "px-2.5 py-0.5 shadow-none",
                            getOrderStatusBadgeClass(order.status),
                          )}
                        >
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="border-y text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-muted h-9 w-9 rounded-xl"
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
                      <TableCell className="rounded-r-3xl border-y border-r pr-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8 transition-transform duration-300",
                            isExpanded && "rotate-180",
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
