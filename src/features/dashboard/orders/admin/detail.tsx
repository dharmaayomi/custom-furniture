"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import useGetAdminOrder from "@/hooks/api/order/useGetAdminOrder";
import { formatPrice } from "@/lib/price";
import { getStatusBadgeClass } from "@/lib/statusStyles";
import { OrderStatus } from "@/types/customOrder";
import { useRouter } from "next/navigation";

type AdminOrderDetailPageProps = {
  orderId: string;
};

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

export const AdminOrderDetailPage = ({ orderId }: AdminOrderDetailPageProps) => {
  const router = useRouter();
  const { data: order, isLoading, isError } = useGetAdminOrder(orderId);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </section>
    );
  }

  if (isError || !order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order not found</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => router.push("/dashboard/admin/orders")}>
            Back to Orders
          </Button>
        </CardContent>
      </Card>
    );
  }

  const orderRef = order.orderNumber?.trim() || order.id;

  return (
    <section className="space-y-4">
      <Card className="py-3">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Order #{orderRef}</CardTitle>
              <p className="text-muted-foreground mt-1 text-xs">
                {new Date(order.createdAt).toLocaleString("en-US")}
              </p>
            </div>
            <Badge className={getStatusBadgeClass(statusTone[order.status])}>
              {statusLabel[order.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">Customer: {order.userId}</p>
          <p className="text-sm">Items: {order.items.length}</p>
          <p className="text-sm font-semibold">
            Total: {formatPrice(Number(order.grandTotalPrice ?? 0))}
          </p>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={() => router.push(`/dashboard/admin/orders/${order.id}/process`)}>
              Process Order
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/admin/orders")}>
              Back
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="py-3">
        <CardHeader>
          <CardTitle>Order Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>ID: {order.id}</p>
          <p>Order Number: {order.orderNumber ?? "-"}</p>
          <p>Status: {order.status}</p>
          <p>Current Payment Phase: {order.currentPaymentPhase ?? "-"}</p>
          <p>Delivery Type: {order.deliveryType}</p>
          <p>Delivery Fee: {formatPrice(Number(order.deliveryFee ?? 0))}</p>
          <p>Delivery Distance: {Number(order.deliveryDistance ?? order.deliveryDistancce ?? 0)}</p>
          <p>Total Weight: {Number(order.totalWeight ?? 0)}</p>
          <p>Subtotal: {formatPrice(Number(order.subtotalPrice ?? 0))}</p>
          <p>Grand Total: {formatPrice(Number(order.grandTotalPrice ?? 0))}</p>
          <p>Total Paid: {formatPrice(Number(order.totalPaid ?? 0))}</p>
          <p>Remaining: {formatPrice(Number(order.remaining ?? 0))}</p>
          <p>Created At: {new Date(order.createdAt).toLocaleString("en-US")}</p>
          <p>Updated At: {new Date(order.updatedAt).toLocaleString("en-US")}</p>
          <p>User: {(order as any).user?.firstName} {(order as any).user?.lastName} ({(order as any).user?.email})</p>
          <p>Preview URL: {order.previewUrl ?? "-"}</p>
          <p>Address: {order.snapShotAddress ? JSON.stringify(order.snapShotAddress) : "-"}</p>
        </CardContent>
      </Card>

      <Card className="py-3">
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items.length === 0 ? (
            <p className="text-sm">No items.</p>
          ) : (
            order.items.map((item) => (
              <div key={item.id} className="rounded-md border p-3 text-sm">
                <p>Item ID: {item.id}</p>
                <p>Product Base ID: {item.productBaseId}</p>
                <p>Material ID: {item.materialId ?? "-"}</p>
                <p>Locked Base Price: {formatPrice(Number(item.lockedBasePrice ?? 0))}</p>
                <p>Locked Material Price: {formatPrice(Number(item.lockedMaterialPrice ?? 0))}</p>
                <p>Item Total: {formatPrice(Number(item.itemTotalPrice ?? 0))}</p>
                <p>Components: {item.components.length}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="py-3">
        <CardHeader>
          <CardTitle>Raw API Response</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
            {JSON.stringify(order, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </section>
  );
};
