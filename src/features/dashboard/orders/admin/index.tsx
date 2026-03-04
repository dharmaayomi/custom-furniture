"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import useGetAdminOrders from "@/hooks/api/order/useGetAdminOrders";
import { formatPrice } from "@/lib/price";
import { getStatusBadgeClass } from "@/lib/statusStyles";
import { OrderStatus } from "@/types/customOrder";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";

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
  const perPage = 9;

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

  const pendingPaymentCount = sortedOrders.filter(
    (order) => order.status === "PENDING_PAYMENT",
  ).length;
  const inProductionCount = sortedOrders.filter(
    (order) =>
      order.status === "AWAITING_PRODUCTION" ||
      order.status === "IN_PRODUCTION",
  ).length;
  const readyToShipCount = sortedOrders.filter(
    (order) => order.status === "READY_TO_SHIP",
  ).length;

  if (isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </section>
    );
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

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="py-3">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Waiting Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingPaymentCount}</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">In Production</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{inProductionCount}</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Ready to Ship</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{readyToShipCount}</p>
          </CardContent>
        </Card>
      </div>

      {sortedOrders.length === 0 ? (
        <Card className="py-3">
          <CardContent className="py-10 text-center">
            <p className="text-sm">No orders available.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedOrders.map((order) => {
            const orderRef = order.orderNumber?.trim() || order.id;

            return (
              <Card key={order.id} className="py-3">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        Order #{orderRef}
                      </CardTitle>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {new Date(order.createdAt).toLocaleString("en-US")}
                      </p>
                    </div>
                    <Badge
                      className={getStatusBadgeClass(statusTone[order.status])}
                    >
                      {statusLabel[order.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between pt-0">
                  <p className="text-sm font-semibold">
                    {formatPrice(Number(order.grandTotalPrice ?? 0))}
                  </p>
                  <Button
                    size="sm"
                    onClick={() =>
                      router.push(`/dashboard/admin/orders/${order.id}`)
                    }
                  >
                    View Detail
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              Page {meta?.page ?? page} of{" "}
              {meta ? Math.max(1, Math.ceil(meta.total / meta.perPage)) : 1}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void setPage(Math.max(1, (meta?.page ?? page) - 1))}
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
    </section>
  );
};
