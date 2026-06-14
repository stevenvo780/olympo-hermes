/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
    currentUser: null,
  },
  firestore: {},
  storage: {},
}));

const loadStore = async () => {
  process.env.NEXT_PUBLIC_API_URL = 'http://api.test';
  vi.resetModules();
  return import('../store');
};

describe('redux store', () => {
  it('initializes store and persistor', async () => {
    const { default: store, persistor } = await loadStore();
    expect(store.getState()).toBeDefined();
    expect(persistor).toBeDefined();
  });

  it('dispatches actions through middleware', async () => {
    const { default: store } = await loadStore();
    const result = store.dispatch({ type: 'test/action', payload: { ok: true } });
    expect(result).toBeDefined();
  });
});
