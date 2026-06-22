import { MetadataRoute } from 'next';
import { Store } from '@/types';

// Prevent prerendering robots - it requires API calls that may fail in build time
export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prizma-hermes.vercel.app';

  let stores: Store[] = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const storesRes = await fetch(`${apiUrl}/store`);
    if (storesRes.ok) {
      stores = await storesRes.json();
    } else {
    }
  } catch {
  }

  const staticAllowedRoutes = [
    '/',
    '/graf',
    '/graf/home',
    '/graf/privacyPolicies',
    '/graf/about'
  ];

  const publicSubPaths = ['', '/about', '/products'];
  const storeAllowedRoutes = stores.flatMap((store: Store) =>
    publicSubPaths.map(sp => `/${store.id}${sp}`)
  );

  const disallowedRoutes = [
    '/api/*',
    '/dashboard/*',
    '/login',
    '/register',
    '/graf/login',
    '/graf/register',
    '/graf/profile',
    '/graf/orders',
    ...stores.flatMap((store: Store) => [
      `/${store.id}/login`,
      `/${store.id}/register`,
      `/${store.id}/profile`,
      `/${store.id}/checkout`,
      `/${store.id}/orders`
    ])
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: [...staticAllowedRoutes, ...storeAllowedRoutes],
        disallow: disallowedRoutes,
      },
      {
        userAgent: 'Googlebot',
        allow: ['/*.js', '/*.css', '/*.png', '/*.jpg', '/*.gif'],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/*.js', '/*.css'],
        disallow: ['/api/*']
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
