import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCurrentUserToken, refreshUserToken, signOutUser } from '../firebaseHelper';

type AuthUser = {
  getIdToken: (force?: boolean) => Promise<string>;
  getIdTokenResult?: () => Promise<{ expirationTime: string }>;
};

const mocks = vi.hoisted(() => {
  const auth = {
    onAuthStateChanged: vi.fn(),
    signOut: vi.fn(),
    currentUser: null as AuthUser | null,
  };
  return { auth };
});

vi.mock('../firebase', () => ({
  auth: mocks.auth,
}));

const scheduleAuthCallback = (currentUser: AuthUser | null) => {
  const unsubscribe = vi.fn();
  mocks.auth.onAuthStateChanged.mockImplementation(
    (cb: (user: AuthUser | null) => void) => {
      queueMicrotask(() => cb(currentUser));
      return unsubscribe;
    },
  );
  return unsubscribe;
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.currentUser = null;
});

describe('getCurrentUserToken', () => {
  it('returns token without refresh when expiration is far away', async () => {
    const now = 1700000000000;
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(now);
    const user: AuthUser = {
      getIdTokenResult: vi.fn().mockResolvedValue({
        expirationTime: new Date(now + 10 * 60 * 1000).toISOString(),
      }),
      getIdToken: vi.fn().mockResolvedValue('token'),
    };
    const unsubscribe = scheduleAuthCallback(user);

    const token = await getCurrentUserToken();

    expect(token).toBe('token');
    expect(user.getIdToken).toHaveBeenCalledWith(false);
    expect(unsubscribe).toHaveBeenCalledTimes(1);

    dateSpy.mockRestore();
  });

  it('refreshes token when expiration is near', async () => {
    const now = 1700000000000;
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(now);
    const user: AuthUser = {
      getIdTokenResult: vi.fn().mockResolvedValue({
        expirationTime: new Date(now + 2 * 60 * 1000).toISOString(),
      }),
      getIdToken: vi.fn().mockResolvedValue('token'),
    };
    scheduleAuthCallback(user);

    const token = await getCurrentUserToken();

    expect(token).toBe('token');
    expect(user.getIdToken).toHaveBeenCalledWith(true);

    dateSpy.mockRestore();
  });

  it('returns null when no user is available', async () => {
    const unsubscribe = scheduleAuthCallback(null);

    const token = await getCurrentUserToken();

    expect(token).toBeNull();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('returns null when token lookup fails', async () => {
    const error = new Error('token error');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user: AuthUser = {
      getIdTokenResult: vi.fn().mockRejectedValue(error),
      getIdToken: vi.fn().mockResolvedValue('token'),
    };
    scheduleAuthCallback(user);

    const token = await getCurrentUserToken();

    expect(token).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('Error getting user token:', error);
  });
});

describe('refreshUserToken', () => {
  it('refreshes when current user exists', async () => {
    const user: AuthUser = {
      getIdToken: vi.fn().mockResolvedValue('new-token'),
    };
    mocks.auth.currentUser = user;

    const token = await refreshUserToken();

    expect(token).toBe('new-token');
    expect(user.getIdToken).toHaveBeenCalledWith(true);
  });

  it('returns null when current user is missing', async () => {
    mocks.auth.currentUser = null;

    const token = await refreshUserToken();

    expect(token).toBeNull();
  });

  it('returns null when refresh fails', async () => {
    const error = new Error('refresh failed');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user: AuthUser = {
      getIdToken: vi.fn().mockRejectedValue(error),
    };
    mocks.auth.currentUser = user;

    const token = await refreshUserToken();

    expect(token).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('Error refreshing user token:', error);
  });
});

describe('signOutUser', () => {
  it('signs out without errors', async () => {
    mocks.auth.signOut.mockResolvedValue(undefined);

    await signOutUser();

    expect(mocks.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('logs errors from signOut', async () => {
    const error = new Error('sign out failed');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.auth.signOut.mockRejectedValue(error);

    await signOutUser();

    expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', error);
  });
});
