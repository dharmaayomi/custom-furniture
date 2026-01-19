import type { Metadata } from "next";
import "./globals.css";
import { montserrat } from "../../public/assets/font";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "@/providers/ReactQueryProviders";

export const metadata: Metadata = {
  title: "Custom Furniture",
  description: "BBPersona",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.className} antialiased`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </SessionProvider>
        <Toaster position="top-right" duration={2000} />
      </body>
    </html>
  );
}
