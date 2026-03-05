import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { motion } from "motion/react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild size="sm">
                <a href={item.url} className="group/navlink">
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
                    {item.title}
                  </motion.span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
