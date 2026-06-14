/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import RegisterPage, { metadata, dynamic } from '../page';

// Mock Child Component
vi.mock('@/components/RegisterClient', () => ({ default: (props: { storeId?: string }) => <div data-testid="register-client" data-store-id={props.storeId} /> }));

describe('RegisterPage', () => {
  it('renders RegisterClient with storeId', async () => {
    const params = Promise.resolve({ storeId: '123' });
    const result = await RegisterPage({ params });

    expect(result).toBeDefined();
    expect((result as { props: { storeId: string } }).props.storeId).toBe('123');
  });

  it('handles missing storeId', async () => {
    const params = Promise.resolve({});
    const result = await RegisterPage({ params });
    expect((result as { props: { storeId: string } }).props.storeId).toBe('');
  });
  it('has correct metadata', () => {
    expect(metadata.title).toBe('Registro');
    expect(metadata.description).toContain('Regístrate');
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.keywords).toContain('registro');
  });

  it('is forced dynamic', () => {
    expect(dynamic).toBe('force-dynamic');
  });
});
