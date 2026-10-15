import { NextResponse } from "next/server";
import { auth, isAdminSession } from "@/lib/auth";

/**
 * First line of defence for /admin and /api/admin. Pages and Server Actions
 * re-check the session server-side as well (see lib/auth/guard.ts).
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const ok = isAdminSession(req.auth);
  const noindex = { "X-Robots-Tag": "noindex, nofollow" };

  if (pathname.startsWith("/api/admin")) {
    if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noindex });
    return NextResponse.next({ headers: noindex });
  }

  const isLogin = pathname === "/admin/login";
  if (!ok && !isLogin) return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
  if (ok && isLogin) return NextResponse.redirect(new URL("/admin", req.nextUrl));
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
});

// Node.js runtime (stable since Next 15.5) — Auth.js/jose run without Edge shims.
export const config = { runtime: "nodejs", matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"] };
