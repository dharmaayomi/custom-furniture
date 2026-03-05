"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sm">Dashboard</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasActiveSub =
            item.items?.some(
              (subItem) =>
                pathname === subItem.url ||
                pathname.startsWith(`${subItem.url}/`),
            ) ?? false;
          const isActive =
            item.isActive ??
            (!hasActiveSub &&
              (pathname === item.url || pathname.startsWith(`${item.url}/`)));
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isActive || hasActiveSub}
            >
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className="text-md"
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
                      {item.title}
                    </motion.span>
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isSubActive =
                            pathname === subItem.url ||
                            pathname.startsWith(`${subItem.url}/`);
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                                className="mt-1 text-sm"
                              >
                                <Link
                                  href={subItem.url}
                                  className="group/navsublink"
                                >
                                  <motion.span
                                    animate={{
                                      opacity: isCollapsed ? 0 : 1,
                                      x: isCollapsed ? -8 : 0,
                                      width: isCollapsed ? 0 : "auto",
                                    }}
                                    transition={{
                                      duration: 0.18,
                                      ease: "easeOut",
                                    }}
                                    className="inline-block overflow-hidden whitespace-nowrap transition-transform duration-150 group-hover/navsublink:translate-x-1"
                                  >
                                    {subItem.title}
                                  </motion.span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
