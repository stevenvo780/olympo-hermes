/* @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from 'vitest';

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

import { signOutUser } from '../firebaseHelper';
import { auth } from '../firebase';
import { clearAxiosState } from '../axios';

describe('firebaseHelper (node)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs out and clears axios state without window', async () => {
    await signOutUser();

    expect(clearAxiosState).toHaveBeenCalled();
    expect(auth.signOut).toHaveBeenCalled();
  });
});
