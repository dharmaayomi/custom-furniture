import { CheckoutPage } from "@/features/checkout";
import { CheckoutPageNew } from "@/features/checkout/CheckoutPageNew";
import { Suspense } from "react";

const Checkout = () => {
  return (
    <div>
      <Suspense
        fallback={<div className="p-6 text-sm">Loading checkout...</div>}
      >
        <CheckoutPageNew />
      </Suspense>
    </div>
  );
};

export default Checkout;
