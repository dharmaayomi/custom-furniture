"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Bell, Moon } from "lucide-react";
import { useUser } from "@/providers/UserProvider";
import { NavUser } from "./NavUser";

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
    <header className="flex h-14 shrink-0 items-center gap-2 sm:h-16">
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
          <div className="mr-1 flex items-center gap-2 sm:mr-3 sm:gap-4 lg:gap-6">
            <div className="hidden sm:block">
              <Moon size={20} />
            </div>
            <div className="hidden sm:block">
              <Bell size={20} />
            </div>

            {navUser ? <NavUser user={navUser} /> : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderDashboard;
