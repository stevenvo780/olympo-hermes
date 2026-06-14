import { afterEach, describe, expect, it } from 'vitest';

import routesConfig from '@/config/routesConfig.json';
import type { RoutesConfig } from '@/types/routes';
import robots from '@/app/robots';

const mutableConfig = routesConfig as RoutesConfig;
const originalPublicRoutes = [...mutableConfig.publicRoutes];
const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

const restoreEnv = () => {
  if (originalEnv === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    return;
  }

      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
  };
  
  afterEach(() => {
    mutableConfig.publicRoutes = [...originalPublicRoutes];
    restoreEnv();
  });
  
  describe('robots', () => {
    it('builds rules from route config', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://admin.example.com';
  
      const result = robots();
      const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
      const defaultRule = rules[0];
  
      expect(result.host).toBe('https://admin.example.com');
      expect(result.sitemap).toBe('https://admin.example.com/sitemap.xml');
  
      expect(defaultRule.allow).toEqual(
        expect.arrayContaining(['/register', '/privacyPolicies']),
      );
      expect(defaultRule.allow).not.toEqual(expect.arrayContaining(['/login']));
      expect(defaultRule.disallow).toEqual(
        expect.arrayContaining(['/api/*', '/dashboard/*', '/login', '/register', '/[storeId]/orders']),
      );
    });
  
    it('falls back to the default host when env is missing', () => {
      delete (process.env as any).NEXT_PUBLIC_SITE_URL;
  
      const result = robots();
  
      expect(result.host).toBe('https://Graf.com');
      expect(result.sitemap).toBe('https://Graf.com/sitemap.xml');
    });
  });
