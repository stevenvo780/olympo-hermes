/* @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import authReducer, { login, initializeAuth, logoutReducer, logout } from '../auth';
import { clearAxiosState } from '@/utils/axios';
import { signOutUser } from '@/utils/firebaseHelper';
import { User, Profile } from '@/types';

vi.mock('@/utils/axios', () => ({
  clearAxiosState: vi.fn(),
}));

vi.mock('@/utils/firebaseHelper', () => ({
  signOutUser: vi.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('auth reducer', () => {
  const initialState = {
    isLoggedIn: false,
    userData: null,
  };

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should handle initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle login', () => {
    const user = { id: '1', email: 'test@test.com' } as unknown as User;
    const profile = { id: 1, name: 'Test' } as unknown as Profile;
    const action = login({ user, profile });
    const state = authReducer(initialState, action);

    expect(state.isLoggedIn).toBe(true);
    expect(state.userData).toEqual({ user, profile });
    expect(localStorage.getItem('userData')).toBeTruthy();
  });

  it('should handle initializeAuth', () => {
    const user = { id: '1', email: 'test@test.com' } as unknown as User;
    const profile = { id: 1, name: 'Test' } as unknown as Profile;
    localStorage.setItem('userData', JSON.stringify({ user, profile }));

    const state = authReducer(initialState, initializeAuth());
    expect(state.isLoggedIn).toBe(true);
    expect(state.userData).toEqual({ user, profile });
  });

  it('should ignore initializeAuth when no stored userData', () => {
    const state = authReducer(initialState, initializeAuth());
    expect(state).toEqual(initialState);
  });

  it('should handle logoutReducer', () => {
    const loggedInState = {
      isLoggedIn: true,
      userData: { user: {} as User, profile: {} as Profile }
    };
    const state = authReducer(loggedInState, logoutReducer());
    expect(state.isLoggedIn).toBe(false);
    expect(state.userData).toBeNull();
  });

  describe('logout thunk', () => {
    it('should clear local storage, dispatch logoutReducer, sign out user and clear axios state', async () => {
      const dispatch = vi.fn();
      localStorage.setItem('userData', 'something');

      await logout()(dispatch);

      expect(localStorage.getItem('userData')).toBeNull();
      expect(dispatch).toHaveBeenCalledWith({ type: 'auth/logoutReducer', payload: undefined });
      expect(signOutUser).toHaveBeenCalled();
      expect(clearAxiosState).toHaveBeenCalled();
    });

    it('clears axios state when signOutUser fails', async () => {
      const dispatch = vi.fn();
      (signOutUser as any).mockRejectedValueOnce(new Error('signout failed'));

      await logout()(dispatch);

      expect(clearAxiosState).toHaveBeenCalled();
    });
  });
});
