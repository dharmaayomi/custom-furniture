"use client";

import {
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
      title: "Products",
      url: "/dashboard/products",
      icon: Frame,
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
  const { navUser } = useUser();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex justify-center gap-2 md:justify-start">
                <a href="/" className="flex items-center gap-2 font-medium">
                  <div className="text-primary-foreground flex size-6 items-center justify-center rounded-md">
                    <Image src="/waw.jpg" alt="Logo" width={30} height={30} />
                  </div>
                  Custom Furniture
                </a>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProfiles profiles={data.profiles} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {navUser ? <NavUser user={navUser} /> : null}
      </SidebarFooter>
    </Sidebar>
  );
}
