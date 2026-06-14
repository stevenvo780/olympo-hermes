/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Providers } from '../index';

vi.mock('../ReduxProvider', () => ({
  ReduxProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="redux-provider">{children}</div>
  ),
}));

vi.mock('../AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

afterEach(() => {
  cleanup();
});

describe('Providers', () => {
  it('wraps children with Redux and Auth providers', () => {
    render(
      <Providers>
        <span>wrapped</span>
      </Providers>
    );

    expect(screen.getByTestId('redux-provider')).toBeTruthy();
    expect(screen.getByTestId('auth-provider')).toBeTruthy();
    expect(screen.getByText('wrapped')).toBeTruthy();
  });
});
