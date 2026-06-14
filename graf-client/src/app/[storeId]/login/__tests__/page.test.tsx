/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import LoginPage, { metadata, dynamic } from '../page';

// Mock Child Component
vi.mock('@/components/LoginClient', () => {
  const MockLoginClient = (props: { storeId: string }) => <div data-testid="login-client" data-store-id={props.storeId} />;
  MockLoginClient.displayName = 'MockLoginClient';
  return { default: MockLoginClient };
});

interface PageProps {
  params: Promise<{ storeId?: string }>;
}

interface JSXElement {
  props: {
    storeId: string;
  };
}

describe('LoginPage', () => {
  it('renders LoginClient with storeId', async () => {
    const params = Promise.resolve({ storeId: '123' });
    const result = await LoginPage({ params } as PageProps);

    expect(result).toBeDefined();
    expect((result as JSXElement).props.storeId).toBe('123');
  });

  it('handles missing storeId', async () => {
    const params = Promise.resolve({});
    const result = await LoginPage({ params } as PageProps);
    expect((result as JSXElement).props.storeId).toBe('');
  });

  it('has correct metadata', () => {
    expect(metadata.title).toBe('Iniciar Sesión');
    expect(metadata.description).toContain('Accede a tu cuenta');
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.openGraph?.title).toContain('Iniciar Sesión');
  });

  it('is forced dynamic', () => {
    expect(dynamic).toBe('force-dynamic');
  });
});
