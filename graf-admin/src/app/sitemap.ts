import { MetadataRoute } from 'next';
import routesConfig from '@/config/routesConfig.json';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://Graf.com';

  const routes = routesConfig.publicRoutes.filter(route => 
    !route.hidden && 
    !route.path.includes('[') && 
    !route.seo?.robots?.includes('noindex')
  );

  return routes.map(route => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: getChangeFrequency(route.path),
    priority: getPriority(route.path, route.seo?.type)
  }));
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
