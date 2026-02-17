"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CheckCheck, Moon, Sun } from "lucide-react";
import { useUser } from "@/providers/UserProvider";
import { NavUser } from "./NavUser";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useTheme } from "next-themes";

const LABEL_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  address: "Address",
  create: "Create",
  edit: "Edit",
  revenue: "Revenue",
  settings: "Settings",
  notifications: "Notifications",
  profile: "Profile",
  orders: "Orders",
  billing: "Billing",
  products: "Products",
  designs: "Designs",
};

const formatSegment = (segment: string) => {
  const decoded = decodeURIComponent(segment);
  if (LABEL_MAP[decoded]) return LABEL_MAP[decoded];
  return decoded
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const HeaderDashboard = () => {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .filter((segment) => segment !== "dashboard");
  const filteredSegments = segments.filter((segment, index) => {
    const isNumeric = /^\d+$/.test(segment);
    const prevSegment = index > 0 ? segments[index - 1] : null;
    if (isNumeric && prevSegment === "address") {
      return false;
    }
    return true;
  });
  const { navUser } = useUser();
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const previewNotifications = notifications.slice(0, 4);

  const crumbs = filteredSegments.map((segment, index) => {
    const href = `/dashboard/${filteredSegments.slice(0, index + 1).join("/")}`;
    return {
      label: formatSegment(segment),
      href,
      isLast: index === filteredSegments.length - 1,
    };
  });
  const currentPageLabel =
    crumbs.length > 0 ? crumbs[crumbs.length - 1].label : "Dashboard";

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/75 sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b backdrop-blur sm:h-16">
      <div className="flex w-full items-center gap-2 px-2 sm:px-4">
        <SidebarTrigger className="ml-1 sm:ml-2" />
        <Separator
          orientation="vertical"
          className="mr-1 hidden data-[orientation=vertical]:h-4 sm:mr-2 sm:block"
        />
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <p className="truncate text-sm font-medium sm:hidden">
            {currentPageLabel}
          </p>
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              {crumbs.length > 0
                ? crumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.href}>
                      <BreadcrumbSeparator className="hidden md:block" />
                      {crumb.isLast ? (
                        <BreadcrumbItem>
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        </BreadcrumbItem>
                      ) : (
                        <BreadcrumbItem className="hidden md:block">
                          <BreadcrumbLink href={crumb.href}>
                            {crumb.label}
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      )}
                    </React.Fragment>
                  ))
                : null}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="mr-1 flex items-center gap-1.5 sm:mr-3 sm:gap-4 lg:gap-6">
            <div>
              <Button
                variant="ghost"
                size="icon"
                className="sm:block"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
                title="Toggle theme"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </Button>
            </div>
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell size={20} />
                    {unreadCount > 0 ? (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500" />
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between gap-2">
                    <span>Notifications</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={unreadCount === 0}
                      onClick={() => markAllAsRead()}
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all
                    </Button>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {previewNotifications.length === 0 ? (
                    <div className="text-muted-foreground px-2 py-4 text-center text-sm">
                      No notifications
                    </div>
                  ) : (
                    previewNotifications.map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        className="flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {!item.isRead ? (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                            ) : null}
                            <p className="truncate text-sm font-medium">
                              {item.title}
                            </p>
                          </div>
                          <p className="text-muted-foreground truncate text-xs">
                            {item.message}
                          </p>
                        </div>
                        {!item.isRead ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={(event) => {
                              event.preventDefault();
                              markAsRead(item.id);
                            }}
                          >
                            Read
                          </Button>
                        ) : null}
                      </DropdownMenuItem>
                    ))
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard/notifications")}
                    className="justify-center text-sm font-medium"
                  >
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {navUser ? <NavUser user={navUser} /> : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderDashboard;
