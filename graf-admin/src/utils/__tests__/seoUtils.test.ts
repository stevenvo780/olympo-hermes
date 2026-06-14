import { afterEach, describe, expect, it } from 'vitest';

import routesConfig from '../../config/routesConfig.json';
import type { RoutesConfig } from '../../types/routes';
import {
  getAllPublicRoutes,
  getDisallowedRoutes,
  getDynamicRoutePatterns,
  getSeoRoutesWithoutDynamicParams,
} from '../seoUtils';

const mutableConfig = routesConfig as RoutesConfig;
const originalPublicRoutes = [...mutableConfig.publicRoutes];

afterEach(() => {
  mutableConfig.publicRoutes = [...originalPublicRoutes];
});

describe('seoUtils', () => {
  it('filters out hidden public routes', () => {
    mutableConfig.publicRoutes = [
      ...originalPublicRoutes,
      {
        path: '/hidden',
        name: 'Hidden',
        viewHeader: false,
        hidden: true,
      },
    ];

    const routes = getAllPublicRoutes();
    expect(routes.some((route) => route.path === '/hidden')).toBe(false);
  });

  it('removes dynamic paths from SEO routes', () => {
    mutableConfig.publicRoutes = [
      ...originalPublicRoutes,
      {
        path: '/[slug]',
        name: 'Dynamic',
        viewHeader: false,
        hidden: false,
      },
    ];

    const routes = getSeoRoutesWithoutDynamicParams();
    expect(routes.some((route) => route.path.includes('['))).toBe(false);
  });

  it('builds patterns for dynamic public routes', () => {
    mutableConfig.publicRoutes = [
      ...originalPublicRoutes,
      {
        path: '/[slug]',
        name: 'Dynamic',
        viewHeader: false,
        hidden: false,
        seo: {
          title: 'Dynamic',
          description: 'Dynamic',
          type: 'article',
        },
      },
    ];

    const patterns = getDynamicRoutePatterns();
    expect(patterns).toEqual(expect.arrayContaining([{ pattern: '/[slug]', type: 'article' }]));
  });

  it('includes role routes and static paths as disallowed', () => {
    const disallowed = getDisallowedRoutes();
    expect(disallowed).toEqual(
      expect.arrayContaining(['/api', '/dashboard', '/login', '/register', '/[storeId]/orders']),
    );
  });
});
