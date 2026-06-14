/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import store, { persistor } from '../store';
import { login } from '../auth';

vi.mock('@/utils/firebase', () => ({
  auth: { signOut: vi.fn() },
  storage: { ref: vi.fn() },
  firestore: vi.fn(),
}));

vi.mock('@/utils/env', () => ({
  env: { NEXT_PUBLIC_API_URL: 'http://test-api.com' }
}));

describe('store', () => {
  it('should be created with initial state', () => {
    const state = store.getState();
    expect(state).toHaveProperty('auth');
    expect(state).toHaveProperty('ui');
    expect(state).toHaveProperty('cart');
    expect(state).toHaveProperty('_persist'); // from redux-persist
  });

  it('should handle actions', () => {
    store.dispatch(login({ user: { id: 1 } as any, profile: {} as any }));
    const state = store.getState();
    expect(state.auth.isLoggedIn).toBe(true);
  });

  it('exports persistor', () => {
    expect(persistor).toBeDefined();
  });
});
