import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, sessionToken, internalKey } from "@/lib/auth";

// Auth gate for the whole logistics app. This is an internal tool for a single
// dispatch office, so a shared-secret session cookie (set after password login)
// plus a distinct server-to-server key is the proportionate control. NOTHING
// under /api or the UI is reachable without it. Fails CLOSED if unconfigured.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public: login page and the auth endpoint that sets the cookie.
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = sessionToken();
  const intKey = internalKey();
  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  const header = req.headers.get("x-internal-key");

  // The session token is an opaque high-entropy secret; the cookie is httpOnly.
  const authorized =
    (!!session && !!cookie && cookie === session) ||
    (!!intKey && !!header && header === intKey);

  if (authorized) return NextResponse.next();

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // UI -> bounce to login, preserving where the user was headed.
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
