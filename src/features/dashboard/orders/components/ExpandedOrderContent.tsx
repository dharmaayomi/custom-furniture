import { getDeliveryTypeLabel } from "@/lib/deliveryType";
import { formatPrice } from "@/lib/price";
import { CustomOrder } from "@/types/customOrder";
import { Box, CreditCard, NotepadText, Truck, Wallet } from "lucide-react";
import { useMemo } from "react";

export function ExpandedOrderContent({ order }: { order: CustomOrder }) {
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
            <CreditCard className="h-4 w-4" />
            Payment Phase
          </p>
          <p className="text-foreground text-sm font-semibold">
            {order.currentPaymentPhase ?? "-"}
          </p>
        </div>

        <div className="bg-card/70 border-border/60 flex flex-col gap-1.5 rounded-lg border px-4 py-3">
          <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
            <Box className="h-4 w-4" />
            Items
          </p>
          <p className="text-foreground text-sm font-semibold">
            {order.items?.length ?? 0} item
            {order.items?.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="bg-card/70 border-border/60 flex flex-col gap-1.5 rounded-lg border px-4 py-3">
          <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
            <Truck className="h-4 w-4" />
            Delivery Type
          </p>
          <p className="text-foreground text-sm font-semibold">
            {getDeliveryTypeLabel(order.deliveryType)}
          </p>
        </div>

        <div className="bg-primary/10 border-primary/20 flex flex-col gap-1.5 rounded-lg border px-4 py-3">
          <p className="text-primary/80 flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
            <Wallet className="h-4 w-4" />
            Remaining
          </p>
          <p className="text-primary text-sm font-semibold">
            {formatPrice(safeRemaining)}
          </p>
        </div>

        <div className="bg-card/70 border-border/60 flex flex-col gap-1.5 rounded-lg border px-4 py-3 md:col-span-2">
          <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
            <NotepadText className="h-4 w-4" />
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
