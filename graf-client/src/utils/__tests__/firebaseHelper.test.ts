/* @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getCurrentUserToken, refreshUserToken, signOutUser } from '../firebaseHelper';
import { auth } from '../firebase';
import { clearAxiosState } from '../axios';

vi.mock('../firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
    currentUser: null,
    signOut: vi.fn(),
  }
}));

vi.mock('../axios', () => ({
  clearAxiosState: vi.fn()
}));

describe('firebaseHelper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('getCurrentUserToken', () => {
    it('resolves with token when user exists', async () => {
      const mockUser = {
        getIdToken: vi.fn().mockResolvedValue('test-token')
      };

      (auth.onAuthStateChanged as any).mockImplementation((callback: any) => {
        // Run callback asynchronously to allow unsubscribe variable initialization
        setTimeout(() => callback(mockUser), 0);
        return vi.fn();
      });

      const token = await getCurrentUserToken();
      expect(token).toBe('test-token');
    });

    it('resolves with null when no user', async () => {
      (auth.onAuthStateChanged as any).mockImplementation((callback: any) => {
        setTimeout(() => callback(null), 0);
        return vi.fn();
      });

      const token = await getCurrentUserToken();
      expect(token).toBe(null);
    });

    it('rejects when getIdToken fails', async () => {
      const mockUser = {
        getIdToken: vi.fn().mockRejectedValue(new Error('Firebase error'))
      };

      (auth.onAuthStateChanged as any).mockImplementation((callback: any) => {
        setTimeout(() => callback(mockUser), 0);
        return vi.fn();
      });

      await expect(getCurrentUserToken()).rejects.toThrow('Error obteniendo token');
    });
  });

  describe('refreshUserToken', () => {
    it('returns new token if user exists', async () => {
      const mockUser = {
        getIdToken: vi.fn().mockResolvedValue('new-token')
      };
      (auth as any).currentUser = mockUser;

      const token = await refreshUserToken();
      expect(token).toBe('new-token');
      expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
    });

    it('returns null if no user', async () => {
      (auth as any).currentUser = null;
      const token = await refreshUserToken();
      expect(token).toBeNull();
    });

    it('returns null if getIdToken throws', async () => {
      const mockUser = {
        getIdToken: vi.fn().mockRejectedValue(new Error('Refresh error'))
      };
      (auth as any).currentUser = mockUser;

      const token = await refreshUserToken();
      expect(token).toBeNull();
    });
  });

  describe('signOutUser', () => {
    it('clears storage, axios state and signs out', async () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      localStorage.setItem('firebase:test', '123');
      localStorage.setItem('keep-me', '456');
      sessionStorage.setItem('firebase:session', '789');
      sessionStorage.setItem('myfirebase', 'foo');
      sessionStorage.setItem('user-token', 'bar');
      sessionStorage.setItem('keep-session', 'baz');

      await signOutUser();

      expect(clearAxiosState).toHaveBeenCalled();
      expect(auth.signOut).toHaveBeenCalled();

      // Check that firebase items are removed
      expect(removeItemSpy).toHaveBeenCalledWith('firebase:test');
      expect(removeItemSpy).toHaveBeenCalledWith('firebase:session');

      // Check that non-firebase items are kept (implementation detail dependent)
      // The implementation iterates over keys and calls removeItem.
      // Since we can't easily spy on the iteration order or state during iteration in jsdom,
      // we trust the spy calls.

      // Actually checking if item is gone:
      expect(localStorage.getItem('firebase:test')).toBeNull();
      expect(sessionStorage.getItem('firebase:session')).toBeNull();
      expect(sessionStorage.getItem('myfirebase')).toBeNull();
      expect(sessionStorage.getItem('user-token')).toBeNull();
      expect(sessionStorage.getItem('keep-session')).toBe('baz');
      // The implementation doesn't touch other keys
      expect(localStorage.getItem('keep-me')).toBe('456');
    });

    it('handles errors gracefully', async () => {
      (auth.signOut as any).mockRejectedValue(new Error('Sign out failed'));
      await expect(signOutUser()).resolves.not.toThrow();
    });
  });
});
