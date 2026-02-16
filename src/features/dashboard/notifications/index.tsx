"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/store/useNotificationStore";
import { Bell, CheckCheck } from "lucide-react";
import { useMemo } from "react";

const typeLabel: Record<"order" | "promo" | "checkout", string> = {
  order: "Order",
  promo: "Promo",
  checkout: "Checkout",
};

export const NotificationsPage = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

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
              disabled={unreadCount === 0}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          </div>
        </div>
      </div>

      <div className="from-muted/60 to-background rounded-lg bg-linear-to-b px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-card rounded-lg border border-dashed px-4 py-10 text-center shadow-sm">
              <Bell className="text-muted-foreground/40 mx-auto mb-3 h-12 w-12" />
              <p className="text-muted-foreground text-sm">
                No notifications available.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg border p-4 shadow-sm transition-colors ${
                  item.isRead
                    ? "bg-card"
                    : "border-blue-200 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/20"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      {!item.isRead ? (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      ) : null}
                      <p className="text-foreground text-sm font-semibold sm:text-base">
                        {item.title}
                      </p>
                      <Badge variant="outline">{typeLabel[item.type]}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">{item.message}</p>
                    <p className="text-muted-foreground mt-2 text-xs">{item.time}</p>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsRead(item.id)}
                      disabled={item.isRead}
                    >
                      {item.isRead ? "Read" : "Mark as Read"}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
