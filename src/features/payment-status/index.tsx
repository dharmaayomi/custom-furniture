import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const PaymentStatusPage = () => {
  return (
    <div className="bg-background relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      <div className="dot-background absolute inset-0 opacity-50 dark:opacity-55" />

      <div className="bg-background pointer-events-none absolute inset-0 flex items-center justify-center mask-[radial-gradient(ellipse_at_center,transparent_30%,black)]" />

      <div className="relative z-20 w-full max-w-xl px-4">
        <Card className="bg-card w-full rounded-lg px-8 py-10 shadow-lg">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive h-8 w-8" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-foreground text-center text-2xl font-semibold">
            Waiting for Payment Confirmation
          </h1>

          {/* Description */}
          <p className="text-muted-foreground mt-2 text-center text-sm">
            We are verifying your payment. This may take a few moments. Please
            do not close this page.
          </p>

          {/* Order Info */}
          <div className="mt-8 rounded-md border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-medium">#INV-123456</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-yellow-500">Pending</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button variant="outline">Back to Home</Button>
            <Button>Check Status</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
