/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EditUserPage from '../page';

// Mock Component
vi.mock('@/components/ProfileEditor', () => ({
  default: ({ storeId }: any) => <div data-testid="profile-editor">ProfileEditor: {storeId}</div>
}));

describe('EditUserPage', () => {
  it('renders ProfileEditor with correct storeId', async () => {
    const params = Promise.resolve({ storeId: 'test-store-123' });
    const jsx = await EditUserPage({ params });

    render(jsx);

    expect(screen.getByTestId('profile-editor')).toBeTruthy();
    expect(screen.getByText('ProfileEditor: test-store-123')).toBeTruthy();
  });

  it('handles missing storeId gracefully', async () => {
    const params = Promise.resolve({});
    const jsx = await EditUserPage({ params });

    render(jsx);

    expect(screen.getByText('ProfileEditor:')).toBeTruthy();
  });
});
