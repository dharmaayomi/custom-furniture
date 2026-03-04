"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import useGetOrders from "@/hooks/api/order/useGetOrders";
import { formatPrice } from "@/lib/price";
import { getStatusBadgeClass } from "@/lib/statusStyles";
import { OrderStatus } from "@/types/customOrder";
import { useRouter } from "next/navigation";

const statusLabel: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Waiting Payment",
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
  IN_PRODUCTION: "warning",
  READY_TO_SHIP: "info",
  SHIPPED: "info",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export const BillingTest = () => {
  const router = useRouter();
  const { data: orders = [], isLoading, isError } = useGetOrders();

  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </section>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Test</CardTitle>
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
          Billing Test
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Click one order to open the dedicated 4-phase payment stepper page.
        </p>
      </div>

      {sortedOrders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm">No orders available.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedOrders.map((order) => {
            const orderRef = order.orderNumber?.trim() || order.id;
            return (
              <Card key={order.id}>
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
                    <Badge className={getStatusBadgeClass(statusTone[order.status])}>
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
                    onClick={() => router.push(`/dashboard/billing-test/${order.id}`)}
                  >
                    Open Stepper
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

