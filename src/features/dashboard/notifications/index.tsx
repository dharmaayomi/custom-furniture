"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import useGetNotifications from "@/hooks/api/notification/useGetNotifications";
import useMarkAllAsRead from "@/hooks/api/notification/useMarkAllAsRead";
import useMarkAsRead from "@/hooks/api/notification/useMarkAsRead";
import { Bell, CheckCheck } from "lucide-react";

export const NotificationsPage = () => {
  const { data, isLoading, isError } = useGetNotifications({
    page: 1,
    perPage: 20,
    sortBy: "createdAt",
    orderBy: "desc",
  });
  const { mutate: markAsRead, isPending: isMarkingAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } =
    useMarkAllAsRead();

  const notifications = data?.data ?? [];
  const unreadCountFromItems = notifications.filter((item) => !item.isRead).length;
  const unreadCount = Math.max(data?.unreadCount ?? 0, unreadCountFromItems);

  const handleMarkAsRead = (id: number) => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <section>
      <div className="bg-muted/60 mb-8 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
              Notifications
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Track important updates from your account and orders.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={unreadCount > 0 ? "default" : "secondary"}>
              {unreadCount} unread
            </Badge>
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || isMarkingAllAsRead}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              {isMarkingAllAsRead ? "Marking..." : "Mark all as read"}
            </Button>
          </div>
        </div>
      </div>

      <div className="from-muted/60 to-background rounded-lg bg-linear-to-b px-4 py-6 sm:px-6 sm:py-8">
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

          {!isLoading && !isError && notifications.length === 0 ? (
            <div className="bg-card rounded-lg border border-dashed px-4 py-10 text-center shadow-sm">
              <Bell className="text-muted-foreground/40 mx-auto mb-3 h-12 w-12" />
              <p className="text-muted-foreground text-sm">
                No notifications available.
              </p>
            </div>
          ) : !isLoading && !isError ? (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg border p-4 shadow-sm transition-colors ${
                  item.isRead
                    ? "bg-card"
                    : "border-primary/25 bg-primary/10"
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
                      {item.role ? <Badge variant="outline">{item.role}</Badge> : null}
                    </div>
                    <p className="text-muted-foreground text-sm">{item.message}</p>
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
      </div>
    </section>
  );
};
