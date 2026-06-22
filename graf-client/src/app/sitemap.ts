import { MetadataRoute } from 'next';
import { Store } from '@/types';

// Prevent prerendering sitemap - it requires API calls that may fail in build time
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  // Only include public, indexable routes — never routes that robots.ts disallows
  const staticPaths = [
    '/',
    '/graf',
    '/graf/home',
    '/graf/privacyPolicies',
    '/graf/about'
  ];

  const staticRoutes = staticPaths.map(path => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: getChangeFrequency(path),
    priority: getPriority(path)
  }));

  // Only public store sub-paths; private routes excluded to match robots.ts
  const subPaths = ['', '/about'];
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
