"use client";

import PaginationSection from "@/components/PaginationSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useGetNotifications from "@/hooks/api/notification/useGetNotifications";
import useMarkAllAsRead from "@/hooks/api/notification/useMarkAllAsRead";
import useMarkAsRead from "@/hooks/api/notification/useMarkAsRead";
import { Bell, CheckCheck } from "lucide-react";
import { useMemo, useState } from "react";

const notificationTabs = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
] as const;

type NotificationTab = (typeof notificationTabs)[number]["value"];

export const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const { data, isLoading, isError } = useGetNotifications({
    page,
    perPage,
    sortBy: "createdAt",
    orderBy: "desc",
  });
  const { mutate: markAsRead, isPending: isMarkingAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } =
    useMarkAllAsRead();

  const notifications = data?.data ?? [];
  const meta = data?.meta;
  const unreadCountFromItems = notifications.filter(
    (item) => !item.isRead,
  ).length;
  const unreadCount = Math.max(data?.unreadCount ?? 0, unreadCountFromItems);
  const visibleNotifications = useMemo(
    () =>
      activeTab === "unread"
        ? notifications.filter((item) => !item.isRead)
        : notifications,
    [activeTab, notifications],
  );

  const handleMarkAsRead = (id: number) => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <section>
      <header className="bg-card border-accent relative mb-8 overflow-hidden rounded-2xl border px-6 py-10 shadow-lg/5 sm:px-10">
        <div className="from-primary/5 to-primary/20 pointer-events-none absolute -top-17 -right-20 h-72 w-72 rounded-full bg-linear-to-br md:-top-14 md:-right-24 lg:-top-16 lg:-right-8" />
        <div className="from-primary/10 to-primary/30 pointer-events-none absolute -top-13 -right-28 h-64 w-64 rounded-full bg-linear-to-br md:-top-10 md:-right-32 lg:-top-12 lg:-right-12" />
        <div className="from-primary/20 to-primary/80 pointer-events-none absolute -top-9 -right-36 h-56 w-56 rounded-full bg-linear-to-br md:-top-6 md:-right-40 lg:-top-8 lg:-right-16" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <div className="bg-primary/10 rounded-lg p-2">
                <Bell className="text-primary h-5 w-5" />
              </div>
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                Notifications
              </h1>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              Track important updates from your account and orders.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={unreadCount > 0 ? "default" : "secondary"}>
              {unreadCount} unread
            </Badge>
            <Button
              onClick={handleMarkAllAsRead}
              className="shadow-primary/20 flex items-center gap-2 px-10 font-bold shadow-2xl transition-transform hover:scale-[1.02]"
              disabled={unreadCount === 0 || isMarkingAllAsRead}
            >
              <CheckCheck className="h-4 w-4" />
              {isMarkingAllAsRead ? "Marking..." : "Mark all as read"}
            </Button>
          </div>
        </div>
      </header>

      <div className="from-muted/60 to-background rounded-lg bg-linear-to-b px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value as NotificationTab);
              setPage(1);
            }}
            className="bg-card w-full rounded-full p-1.5 shadow-2xl/5 lg:w-auto"
          >
            <TabsList className="no-scrollbar h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0">
              {notificationTabs.map(({ value, label }) => {
                const count =
                  value === "all"
                    ? (meta?.total ?? notifications.length)
                    : unreadCount;
                return (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-background rounded-full border px-4 py-2 text-xs font-bold transition-all"
                  >
                    {label}
                    {count > 0 ? (
                      <span className="bg-chart-2 text-card ml-2 rounded-full px-1.5 py-0.5 text-[10px]">
                        {count}
                      </span>
                    ) : null}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-card rounded-lg border px-4 py-10 text-center shadow-sm">
              <p className="text-muted-foreground text-sm">
                Loading notifications...
              </p>
            </div>
          ) : null}

          {isError ? (
            <div className="bg-card rounded-lg border px-4 py-10 text-center shadow-sm">
              <p className="text-muted-foreground text-sm">
                Failed to load notifications.
              </p>
            </div>
          ) : null}

          {!isLoading && !isError && visibleNotifications.length === 0 ? (
            <div className="bg-card rounded-xl border border-dashed px-4 py-12 text-center shadow-sm">
              <Bell className="text-muted-foreground/30 mx-auto mb-4 h-14 w-14" />
              <p className="text-muted-foreground text-sm font-medium">
                {activeTab === "unread"
                  ? "No unread notifications"
                  : "You're all caught up"}
              </p>
            </div>
          ) : !isLoading && !isError ? (
            visibleNotifications.map((item) => (
              <div
                key={item.id}
                className={`group rounded-xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                  item.isRead
                    ? "bg-card hover:bg-muted/40"
                    : "border-primary/30 bg-primary/10 hover:bg-primary/15"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      {!item.isRead ? (
                        <span className="notification-dot bg-chart-2 h-2 w-2 rounded-full" />
                      ) : null}
                      <p className="text-foreground text-sm font-semibold sm:text-base">
                        {item.title}
                      </p>
                      {item.role ? (
                        <Badge variant="outline">{item.role}</Badge>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {item.message}
                    </p>
                    <p className="text-muted-foreground mt-2 text-xs">
                      {new Date(item.createdAt).toLocaleString("en-US")}
                    </p>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsRead(item.id)}
                      disabled={item.isRead || isMarkingAsRead}
                    >
                      {item.isRead ? "Read" : "Mark as Read"}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : null}
        </div>

        {!isLoading &&
        !isError &&
        activeTab === "all" &&
        meta &&
        meta.total > perPage ? (
          <div className="mt-8 flex justify-center">
            <PaginationSection
              page={meta.page}
              perPage={meta.perPage}
              total={meta.total}
              hasNext={meta.hasNext}
              hasPrevious={meta.hasPrevious}
              onChangePage={setPage}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
};
