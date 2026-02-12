import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import HeaderDashboard from "@/features/dashboard/components/HeaderDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Furniture",
  description: "BBPersona",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh w-full">
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset className="dark:border">
          <HeaderDashboard />
          <main>
            <div className="flex flex-1 flex-col">
              <div className="@container/main m-3 flex flex-1 flex-col gap-2 sm:m-5">
                {children}
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
