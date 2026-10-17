import { NextResponse, type NextRequest } from "next/server";
import { auth, isAdminSession } from "@/lib/auth";

/**
 * First line of defence for /admin and /api/admin. Pages and Server Actions
 * re-check the session server-side as well (see lib/auth/guard.ts).
 *
 * The admin area is invisible to anyone who isn't signed in: every /admin URL
 * returns a plain 404 unless it's the login page opened with the secret key
 * (/admin/login?k=ADMIN_LOGIN_KEY). This keeps a public sign-in page off the
 * site, which Google Safe Browsing can mistake for phishing.
 */
const noindex = { "X-Robots-Tag": "noindex, nofollow" };

function notFound(req: NextRequest) {
  const res = NextResponse.rewrite(new URL("/__not-found", req.nextUrl), { status: 404 });
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

function hasLoginKey(req: NextRequest) {
  const key = process.env.ADMIN_LOGIN_KEY;
  return !!key && req.nextUrl.searchParams.get("k") === key;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const ok = isAdminSession(req.auth);

  if (pathname.startsWith("/api/admin")) {
    if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noindex });
    return NextResponse.next({ headers: noindex });
  }

  const isLogin = pathname === "/admin/login";
  if (ok && isLogin) return NextResponse.redirect(new URL("/admin", req.nextUrl));
  if (!ok && !(isLogin && hasLoginKey(req))) return notFound(req);

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
});

// Node.js runtime (stable since Next 15.5) — Auth.js/jose run without Edge shims.
export const config = { runtime: "nodejs", matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"] };
