import { HeaderPayment } from "@/features/summary/components/HeaderPayment";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Furniture",
  description: "BBPersona",
};

export default function PaymentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <HeaderPayment />
      {children}
    </div>
  );
}
