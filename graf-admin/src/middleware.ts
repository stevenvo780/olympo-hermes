import { NextRequest, NextResponse } from "next/server";

// Auth gate for the whole hermes-admin app. hermes-admin uses Firebase Auth
// (client-side SDK) for its primary session, but the SDK keeps the session
// in IndexedDB/localStorage, NOT in a cookie, so the edge middleware cannot
// inspect it directly. This middleware acts as a defence-in-depth check: it
// requires a small "ga_session" cookie that the client must set on successful
// login (or that the server-side auth callback can stamp). The cookie value
// is treated as opaque presence-only here — full token verification happens
// in API routes / server components via the Firebase Admin SDK.
//
// Public paths (login, register, public home, Next internals, public assets)
// are allowed through. Everything else bounces to /login with a `next` param.
//
// Pattern adapted from hermes-logistica/src/middleware.ts.

const SESSION_COOKIE = "ga_session";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth",
  "/_next",
  "/favicon.ico",
  "/images",
  "/robots.txt",
  "/sitemap.xml",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const session = req.cookies.get(SESSION_COOKIE)?.value;

  if (session) {
    return NextResponse.next();
  }

  // API routes: return 401 JSON instead of redirecting.
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
  // Run on everything except Next internals, the favicon and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
