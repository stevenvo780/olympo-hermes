/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AuthProvider } from '../AuthProvider';

const hookMocks = vi.hoisted(() => ({
  useFirebaseAuth: vi.fn(),
}));

vi.mock('@/hooks/useFirebaseAuth', () => ({
  default: hookMocks.useFirebaseAuth,
}));

afterEach(() => {
  cleanup();
  hookMocks.useFirebaseAuth.mockClear();
});

describe('AuthProvider', () => {
  it('invokes the firebase auth hook and renders children', () => {
    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    );

    expect(screen.getByText('child')).toBeTruthy();
    expect(hookMocks.useFirebaseAuth).toHaveBeenCalledTimes(1);
  });
});
