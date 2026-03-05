"use client";

import {
  Folder,
  MoreHorizontal,
  Share,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavProfiles({
  profiles,
  unreadNotificationCount = 0,
}: {
  profiles: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
  unreadNotificationCount?: number;
}) {
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const pathname = usePathname();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-base">Profiles</SidebarGroupLabel>
      <SidebarMenu>
        {profiles.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              isActive={
                pathname === item.url || pathname.startsWith(`${item.url}/`)
              }
              className="text-base"
            >
              <Link href={item.url} className="group/navlink">
                <item.icon />
                <motion.span
                  animate={{
                    opacity: isCollapsed ? 0 : 1,
                    x: isCollapsed ? -8 : 0,
                    width: isCollapsed ? 0 : "auto",
                  }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="inline-block overflow-hidden whitespace-nowrap transition-transform duration-150 group-hover/navlink:translate-x-1"
                >
                  {item.name}
                </motion.span>
                {item.url === "/dashboard/notifications" &&
                unreadNotificationCount > 0 ? (
                  <span className="notification-dot bg-chart-2 ml-auto h-2 w-2 rounded-full" />
                ) : null}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-base">
            <MoreHorizontal />
            <motion.span
              animate={{
                opacity: isCollapsed ? 0 : 1,
                x: isCollapsed ? -8 : 0,
                width: isCollapsed ? 0 : "auto",
              }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="inline-block overflow-hidden whitespace-nowrap transition-transform duration-150 group-hover/menu-button:translate-x-1"
            >
              More
            </motion.span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
