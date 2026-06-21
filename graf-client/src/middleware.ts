import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_COOKIE,
  isPathProtected,
  decodeJwtExp,
  buildLoginRedirect
} from '@/lib/auth-gate';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isPathProtected(pathname)) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(AUTH_COOKIE)?.value;

  if (!cookie) {
    return redirectToLogin(req, pathname);
  }

  const exp = decodeJwtExp(cookie);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (exp === null || exp <= nowSeconds) {
    return redirectToLogin(req, pathname);
  }

  return NextResponse.next();
}

function redirectToLogin(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = buildLoginRedirect(pathname);
  url.search = '';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'
  ]
};
