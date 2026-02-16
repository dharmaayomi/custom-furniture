import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import HeaderDashboard from "@/features/dashboard/components/HeaderDashboard";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Custom Furniture",
  description: "BBPersona",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session) {
    redirect("/login?reason=login_required");
  }

  return (
    <div className="min-h-dvh w-full">
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset className="dark:border flex h-[calc(100dvh-1rem)] flex-col overflow-hidden">
          <HeaderDashboard />
          <main className="flex-1 overflow-y-auto">
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
