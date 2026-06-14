/* @vitest-environment node */
import { describe, expect, it, vi } from 'vitest';
import authReducer, { initializeAuth, login, logout } from '../auth';
import { clearAxiosState } from '@/utils/axios';
import { signOutUser } from '@/utils/firebaseHelper';

vi.mock('@/utils/axios', () => ({
  clearAxiosState: vi.fn(),
}));

vi.mock('@/utils/firebaseHelper', () => ({
  signOutUser: vi.fn(),
}));

describe('auth reducer (node)', () => {
  it('handles login without window', () => {
    const initialState = { isLoggedIn: false, userData: null };
    const user = { id: '1', email: 'test@test.com' } as any;
    const profile = { id: 1, name: 'Test' } as any;
    const state = authReducer(initialState, login({ user, profile }));

    expect(state.isLoggedIn).toBe(true);
    expect(state.userData).toEqual({ user, profile });
  });

  it('does not initialize auth when window is undefined', () => {
    const initialState = { isLoggedIn: false, userData: null };
    const state = authReducer(initialState, initializeAuth());
    expect(state).toEqual(initialState);
  });

  it('logs out and clears axios state without window', async () => {
    const dispatch = vi.fn();
    await logout()(dispatch as any);

    expect(dispatch).toHaveBeenCalled();
    expect(signOutUser).toHaveBeenCalled();
    expect(clearAxiosState).toHaveBeenCalled();
  });
});
