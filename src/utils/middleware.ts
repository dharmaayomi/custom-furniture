import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  canAccessDashboardPath,
  getDashboardFallbackPath,
  normalizeRole,
} from "@/lib/dashboard-access";

export default auth((req) => {
  const { pathname, origin } = req.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const session = req.auth;
  if (!session?.user) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("reason", "login_required");
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = normalizeRole(session.user.role);
  if (!role) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("reason", "invalid_role");
    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessDashboardPath(role, pathname)) {
    return NextResponse.redirect(
      new URL(getDashboardFallbackPath(role), origin),
    );
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-dashboard-pathname", pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
