"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { NavMain } from "./NavMain";
import { NavProfiles } from "./NavProfiles";
import { NavSecondary } from "./NavSecondary";
import { useUser } from "@/providers/UserProvider";
import Link from "next/link";
import { normalizeRole } from "@/lib/dashboard-access";
import { useSession } from "next-auth/react";
import { getDashboardNavDataByRole } from "./dashboard-nav";
import useGetUnreadCount from "@/hooks/api/notification/useGetUnreadCount";
import useGetNotifications from "@/hooks/api/notification/useGetNotifications";

export function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { navUser } = useUser();
  const { data: session } = useSession();
  const { data: unreadData } = useGetUnreadCount();
  const { data: notificationsData } = useGetNotifications({
    page: 1,
    perPage: 20,
    sortBy: "createdAt",
    orderBy: "desc",
  });
  const unreadCountFromItems =
    notificationsData?.data?.filter((item) => !item.isRead).length ?? 0;
  const unreadNotificationCount = Math.max(
    unreadData?.unreadCount ?? 0,
    unreadCountFromItems,
  );
  const role = normalizeRole(navUser?.role ?? session?.user?.role ?? null);

  const navData = React.useMemo(() => getDashboardNavDataByRole(role), [role]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex justify-center gap-2 md:justify-start">
                <Link href="/" className="flex items-center gap-2 font-medium">
                  <div className="text-primary-foreground flex items-center justify-center">
                    <Image
                      src="/logo-dark.svg"
                      alt="Logo"
                      width={180}
                      height={56}
                    />
                  </div>
                </Link>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
        <NavProfiles
          profiles={navData.profiles}
          unreadNotificationCount={unreadNotificationCount}
        />
        <NavSecondary items={navData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
