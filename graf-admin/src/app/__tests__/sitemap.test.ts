import { afterEach, describe, expect, it } from 'vitest';

import routesConfig from '@/config/routesConfig.json';
import type { RoutesConfig } from '@/types/routes';
import sitemap from '@/app/sitemap';

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

describe('sitemap', () => {
  it('builds entries for public routes with base url', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://admin.example.com';

    const result = sitemap();
    const urls = result.map(entry => entry.url);

    expect(urls).toEqual(expect.arrayContaining([
      'https://admin.example.com/register',
      'https://admin.example.com/privacyPolicies',
    ]));
    expect(urls).not.toContain('https://admin.example.com/login');

    const privacyEntry = result.find(entry => entry.url.endsWith('/privacyPolicies'));
    expect(privacyEntry?.priority).toBe(0.7);
    expect(privacyEntry?.changeFrequency).toBe('monthly');
    expect(privacyEntry?.lastModified).toBeInstanceOf(Date);
  });

  it('uses special rules for known paths', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://admin.example.com';

    mutableConfig.publicRoutes = [
      ...originalPublicRoutes,
      {
        path: '/',
        name: 'Home',
        viewHeader: false,
        hidden: false,
        seo: {
          title: 'Home',
          description: 'Home',
          type: 'website',
        },
      },
      {
        path: '/events',
        name: 'Events',
        viewHeader: false,
        hidden: false,
        seo: {
          title: 'Events',
          description: 'Events',
          type: 'events',
        },
      },
    ];

    const result = sitemap();

    const homeEntry = result.find(entry => entry.url === 'https://admin.example.com/');
    expect(homeEntry?.changeFrequency).toBe('daily');
    expect(homeEntry?.priority).toBe(1);

    const eventsEntry = result.find(entry => entry.url.endsWith('/events'));
    expect(eventsEntry?.changeFrequency).toBe('hourly');
    expect(eventsEntry?.priority).toBe(0.9);
  });

  it('uses priority and frequency fallbacks for other routes', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://admin.example.com';

    mutableConfig.publicRoutes = [
      {
        path: '/library',
        name: 'Library',
        viewHeader: false,
        hidden: false,
        seo: { title: 'Library', description: 'Library', type: 'website' },
      },
      {
        path: '/about',
        name: 'About',
        viewHeader: false,
        hidden: false,
        seo: { title: 'About', description: 'About', type: 'website' },
      },
      {
        path: '/news',
        name: 'News',
        viewHeader: false,
        hidden: false,
        seo: { title: 'News', description: 'News', type: 'article' },
      },
      {
        path: '/misc',
        name: 'Misc',
        viewHeader: false,
        hidden: false,
        seo: { title: 'Misc', description: 'Misc', type: 'events' },
      },
    ];

    const result = sitemap();

    const libraryEntry = result.find(entry => entry.url.endsWith('/library'));
    expect(libraryEntry?.changeFrequency).toBe('weekly');
    expect(libraryEntry?.priority).toBe(0.9);

    const aboutEntry = result.find(entry => entry.url.endsWith('/about'));
    expect(aboutEntry?.priority).toBe(0.8);

    const articleEntry = result.find(entry => entry.url.endsWith('/news'));
    expect(articleEntry?.priority).toBe(0.7);

    const eventsEntry = result.find(entry => entry.url.endsWith('/misc'));
    expect(eventsEntry?.priority).toBe(0.8);
  });

  it('falls back to the default base url when env is missing', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const result = sitemap();
    const urls = result.map(entry => entry.url);

    expect(urls.some(url => url.startsWith('https://Graf.com'))).toBe(true);
  });
});
