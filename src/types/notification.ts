import { PaginationMeta } from "./pagination";

export type NotificationSortBy = "id" | "title" | "createdAt" | "updatedAt";
export type NotificationOrderBy = "asc" | "desc";

export type GetNotificationsQuery = {
  page?: number;
  perPage?: number;
  sortBy?: NotificationSortBy;
  orderBy?: NotificationOrderBy;
  search?: string;
};

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  role: string | null;
  targetUserId: number | null;
  readByUserId: number[];
  createdAt: string;
  updatedAt: string;
  customOrderId: string | null;
  isRead: boolean;
};

export type GetNotificationsResponse = {
  data: NotificationItem[];
  unreadCount: number;
  meta: PaginationMeta;
};

export type GetUnreadCountResponse = {
  unreadCount: number;
};

export type MarkAllAsReadResponse = {
  updatedCount: number;
};
