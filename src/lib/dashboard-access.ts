import { Role } from "@/types/user";

const USER_ALLOWED_DASHBOARD_PREFIXES = [
  "/dashboard",
  "/dashboard/orders",
  "/dashboard/billing",
  "/dashboard/designs",
  "/dashboard/settings",
  "/dashboard/profile",
  "/dashboard/address",
  "/dashboard/security",
  "/dashboard/notifications",
] as const;

const ADMIN_ALLOWED_DASHBOARD_PREFIXES = [
  "/dashboard",
  "/dashboard/orders",
  "/dashboard/revenue",
  "/dashboard/products",
  "/dashboard/settings",
  "/dashboard/profile",
  "/dashboard/address",
  "/dashboard/security",
  "/dashboard/notifications",
] as const;

const matchesPrefix = (pathname: string, prefix: string) => {
  // Root dashboard should match only the dashboard home page.
  if (prefix === "/dashboard") {
    return pathname === prefix;
  }

  return pathname === prefix || pathname.startsWith(`${prefix}/`);
};

export const normalizeRole = (role?: string | null): Role | null => {
  const value = role?.trim().toUpperCase();
  if (!value) return null;

  if (value === Role.ADMIN || value === "ROLE_ADMIN") return Role.ADMIN;
  if (value === Role.USER || value === "ROLE_USER") return Role.USER;
  return null;
};

export const canAccessDashboardPath = (
  role: Role | null,
  pathname: string,
): boolean => {
  if (!matchesPrefix(pathname, "/dashboard")) return true;
  if (!role) return false;

  if (role === Role.ADMIN) {
    return ADMIN_ALLOWED_DASHBOARD_PREFIXES.some((prefix) =>
      matchesPrefix(pathname, prefix),
    );
  }

  return USER_ALLOWED_DASHBOARD_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix),
  );
};

export const getDashboardFallbackPath = (role: Role): string => {
  if (role === Role.ADMIN) return "/dashboard/admin";
  return "/dashboard";
};
