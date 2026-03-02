import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import HeaderDashboard from "@/features/dashboard/components/HeaderDashboard";
import { auth } from "@/lib/auth";
import {
  canAccessDashboardPath,
  getDashboardFallbackPath,
  normalizeRole,
} from "@/lib/dashboard-access";
import type { Metadata } from "next";
import { headers } from "next/headers";
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
  const role = normalizeRole(session.user.role);
  if (!role) {
    redirect("/login?reason=invalid_role");
  }

  const pathname =
    (await headers()).get("x-dashboard-pathname") ?? "/dashboard";
  if (!canAccessDashboardPath(role, pathname)) {
    redirect(getDashboardFallbackPath(role));
  }

  return (
    <div className="min-h-dvh w-full">
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset className="flex h-[calc(100dvh-1rem)] flex-col overflow-hidden dark:border">
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
