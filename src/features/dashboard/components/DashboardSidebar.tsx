"use client";

import * as React from "react";
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  MapPin,
  Palette,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain } from "./NavMain";
import { NavProjects } from "./NavProjects";
import { NavSecondary } from "./NavSecondary";
import { NavUser } from "./NavUser";
import Image from "next/image";
import { useSession } from "next-auth/react";
import useGetUserDisplay from "@/hooks/api/user/useGetUserDisplay";

const data = {
  navMain: [
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: SquareTerminal,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Products",
      url: "/dashboard/products",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Address",
      url: "/dashboard/address",
      icon: MapPin,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Designs",
      url: "/dashboard/designs",
      icon: Palette,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
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
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

export function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const session = useSession();
  const userId = session.data?.user?.id;

  const { data: user, isLoading } = useGetUserDisplay(userId);
  const navUser = session.data?.user
    ? {
        userName: user?.userName ?? session.data.user.userName ?? "User",
        email: user?.email ?? session.data.user.email ?? "",
        avatar:
          "https://res.cloudinary.com/dhdpnfvfn/image/upload/v1768803916/user-icon_rbmcr4.png",
      }
    : null;

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
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {navUser ? <NavUser user={navUser} /> : null}
      </SidebarFooter>
    </Sidebar>
  );
}
