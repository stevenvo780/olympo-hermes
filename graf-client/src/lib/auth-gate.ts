export const AUTH_COOKIE = 'hermes_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export const PROTECTED_SUFFIXES = [
  '/orders',
  '/profile',
  '/checkout',
  '/vendedor'
];

const EXACT_PUBLIC_PATHS = new Set([
  '/',
  '/hermes',
  '/hermes/'
]);

function isStaticOrApiPath(pathname: string): boolean {
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/api/')) return true;
  if (pathname === '/favicon.ico') return true;
  if (pathname === '/robots.txt') return true;
  if (pathname === '/sitemap.xml') return true;
  return false;
}

function isPublicLoginRegister(pathname: string): boolean {
  if (pathname === '/login' || pathname.endsWith('/login')) return true;
  if (pathname === '/register' || pathname.endsWith('/register')) return true;
  if (pathname.endsWith('/forgot-password')) return true;
  return false;
}

export function isPathProtected(pathname: string): boolean {
  if (isStaticOrApiPath(pathname)) return false;
  if (EXACT_PUBLIC_PATHS.has(pathname)) return false;
  if (isPublicLoginRegister(pathname)) return false;
  return PROTECTED_SUFFIXES.some(
    (suffix) => pathname === suffix || pathname.endsWith(suffix)
  );
}

export function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '==='.slice((payload.length + 3) % 4);
    const json = atob(padded);
    const data = JSON.parse(json) as { exp?: number };
    return typeof data.exp === 'number' ? data.exp : null;
  } catch {
    return null;
  }
}

export function buildLoginRedirect(pathname: string): string {
  if (pathname.startsWith('/hermes/')) {
    return '/hermes/login';
  }
  const storeMatch = pathname.match(/^(\/[^/]+)\//);
  if (storeMatch) {
    return `${storeMatch[1]}/login`;
  }
  return '/hermes/login';
}
