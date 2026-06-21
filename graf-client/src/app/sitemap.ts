import { MetadataRoute } from 'next';
import { Store } from '@/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hermes.com.co';

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

  const staticPaths = [
    '/',
    '/hermes',
    '/hermes/home',
    '/hermes/login',
    '/hermes/orders',
    '/hermes/privacyPolicies',
    '/hermes/profile',
    '/hermes/register'
  ];

  const staticRoutes = staticPaths.map(path => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: getChangeFrequency(path),
    priority: getPriority(path)
  }));

  const subPaths = ['', '/about', '/checkout', '/login', '/orders', '/profile', '/register'];
  const storeRoutes = stores.flatMap((store: Store) =>
    subPaths.map(sp => {
      const fullPath = `/${store.id}${sp}`;
      return {
        url: `${baseUrl}${fullPath}`,
        lastModified: new Date(),
        changeFrequency: getChangeFrequency(fullPath),
        priority: getPriority(fullPath)
      };
    })
  );
  return [...staticRoutes, ...storeRoutes];
}

function getChangeFrequency(path: string): "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" {
  switch (path) {
    case '/':
      return 'daily';
    case '/events':
    case '/ranking':
      return 'hourly';
    case '/library':
      return 'weekly';
    default:
      return 'monthly';
  }
}

function getPriority(path: string, type?: string): number {
  switch (path) {
    case '/':
      return 1.0;
    case '/events':
    case '/library':
      return 0.9;
    case '/about':
    case '/normativa':
      return 0.8;
    default:
      switch (type) {
        case 'article':
          return 0.7;
        case 'events':
          return 0.8;
        default:
          return 0.5;
      }
  }
}
