// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname, searchParams } = req.nextUrl;

  // If a logged-in user hits /login, send them away
  if (pathname === "/login" && isLoggedIn) {
    const callbackUrl = searchParams.get("callbackUrl");

    // Only allow internal (relative) callback URLs to avoid open-redirect issues
    const safeCallback =
      callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/policies";

    return NextResponse.redirect(new URL(safeCallback, req.url));
  }

  const isProtected =
    pathname === "/policies" ||
    pathname.startsWith("/policies/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/");

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    const fullPath = req.nextUrl.pathname + req.nextUrl.search;
    loginUrl.searchParams.set("callbackUrl", fullPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/login",
    "/policies",
    "/policies/:path*",
    "/dashboard",
    "/dashboard/:path*",
  ],
};
