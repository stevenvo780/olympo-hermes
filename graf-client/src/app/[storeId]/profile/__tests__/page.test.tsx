/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ProfilePage from '../page';

// Mock Child Component
vi.mock('@/components/ProfileEditor', () => ({ default: (props: { storeId?: string }) => <div data-testid="profile-editor" data-store-id={props.storeId} /> }));

describe('ProfilePage', () => {
  it('renders ProfileEditor with storeId', async () => {
    const params = Promise.resolve({ storeId: '123' });
    const result = await ProfilePage({ params });

    expect(result).toBeDefined();
    expect((result as { props: { storeId: string } }).props.storeId).toBe('123');
  });

  it('handles missing storeId', async () => {
    const params = Promise.resolve({});
    const result = await ProfilePage({ params });
    expect((result as { props: { storeId: string } }).props.storeId).toBe('');
  });
});
