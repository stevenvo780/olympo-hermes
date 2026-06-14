import { MetadataRoute } from 'next';
import routesConfig from '@/config/routesConfig.json';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://Graf.com';

  const allowedRoutes = routesConfig.publicRoutes
    .filter(route => !route.seo?.robots?.includes('noindex'))
    .map(route => route.path);

  const disallowedRoutes = [
    ...Object.values(routesConfig.roleRoutes)
      .flat()
      .map(route => route.path),
    '/api/*',
    '/login',
    '/register',
    '/dashboard/*',
    ...routesConfig.publicRoutes
      .filter(route => route.seo?.robots?.includes('noindex'))
      .map(route => route.path)
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: allowedRoutes,
        disallow: disallowedRoutes,
      },
      {
        userAgent: 'Googlebot',
        allow: ['/*.js', '/*.css', '/*.png', '/*.jpg', '/*.gif'],
        disallow: '/search',
      },
      {
        userAgent: 'Bingbot',
        allow: ['/*.js', '/*.css'],
        disallow: ['/search', '/api/*']
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
