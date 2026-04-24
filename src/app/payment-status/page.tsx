import { PaymentStatusPage } from "@/features/payment-status";
import { Suspense } from "react";

const PaymentStatus = () => {
  return (
    <div>
      <Suspense
        fallback={<div className="p-6 text-sm">Loading payment status...</div>}
      >
        <PaymentStatusPage />
      </Suspense>
    </div>
  );
};

export default PaymentStatus;
