"use client";

import {
  BanknoteArrowUp,
  Bell,
  Bot,
  CreditCard,
  Frame,
  LifeBuoy,
  Lock,
  Map,
  MapPin,
  Palette,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  User,
} from "lucide-react";
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
import { NavUser } from "./NavUser";
import { useUser } from "@/providers/UserProvider";
import { useNotificationStore } from "@/store/useNotificationStore";
import Link from "next/link";
import { useTheme } from "next-themes";

const data = {
  navMain: [
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: SquareTerminal,
    },
    {
      title: "Billing",
      url: "/dashboard/billing",
      icon: CreditCard,
    },
    {
      title: "Revenue",
      url: "/dashboard/revenue",
      icon: BanknoteArrowUp,
    },
    {
      title: "Products",
      url: "/dashboard/products",
      icon: Frame,
      items: [
        {
          title: "Component",
          url: "/dashboard/products/components",
        },
        {
          title: "Material",
          url: "/dashboard/products/materials",
        },
        {
          title: "Archived Products",
          url: "#",
        },
      ],
    },

    {
      title: "Designs",
      url: "/dashboard/designs",
      icon: Palette,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  profiles: [
    {
      name: "Profile Info",
      url: "/dashboard/profile",
      icon: User,
    },
    {
      name: "Address",
      url: "/dashboard/address",
      icon: MapPin,
    },
    {
      name: "Security",
      url: "/dashboard/security",
      icon: Lock,
    },
    {
      name: "Notifications",
      url: "/dashboard/notifications",
      icon: Bell,
    },
  ],
};

export function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { navUser } = useUser();
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadNotificationCount = notifications.filter(
    (item) => !item.isRead,
  ).length;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo.svg";

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex justify-center gap-2 md:justify-start">
                <Link href="/" className="flex items-center gap-2 font-medium">
                  <div className="text-primary-foreground flex items-center justify-center">
                    <Image src={logoSrc} alt="Logo" width={180} height={56} />
                  </div>
                </Link>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProfiles
          profiles={data.profiles}
          unreadNotificationCount={unreadNotificationCount}
        />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
