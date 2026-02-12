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

  const crumbs = filteredSegments.map((segment, index) => {
    const href = `/dashboard/${filteredSegments
      .slice(0, index + 1)
      .join("/")}`;
    return {
      label: formatSegment(segment),
      href,
      isLast: index === filteredSegments.length - 1,
    };
  });

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 sm:h-16">
      <div className="flex w-full items-center gap-2 px-3 sm:px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex flex-1 items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">
                  Dashboard
                </BreadcrumbLink>
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

          <Avatar className="h-8 w-8 rounded-full">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default HeaderDashboard;
