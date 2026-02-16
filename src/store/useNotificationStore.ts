import { create } from "zustand";

export type DashboardNotificationItem = {
  id: number;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: "order" | "promo" | "checkout";
};

const INITIAL_NOTIFICATIONS: DashboardNotificationItem[] = [
  {
    id: 1,
    title: "Order Updated",
    message: "Your order ORD-2026-1032 is now in progress.",
    time: "2 minutes ago",
    isRead: false,
    type: "order",
  },
  {
    id: 2,
    title: "Checkout Reminder",
    message: "You still have 2 items left before checkout.",
    time: "1 hour ago",
    isRead: false,
    type: "checkout",
  },
  {
    id: 3,
    title: "Promo Available",
    message: "Get 15% off for selected furniture this week.",
    time: "Yesterday",
    isRead: true,
    type: "promo",
  },
  {
    id: 4,
    title: "Order Delivered",
    message: "Your order ORD-2026-1030 has been delivered successfully.",
    time: "2 days ago",
    isRead: true,
    type: "order",
  },
];

interface NotificationStore {
  notifications: DashboardNotificationItem[];
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: INITIAL_NOTIFICATIONS,
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id ? { ...item, isRead: true } : item,
      ),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((item) => ({
        ...item,
        isRead: true,
      })),
    })),
}));
