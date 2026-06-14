import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '@/types';
import { getUserBack } from '../userService';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/utils/axios', () => ({
  default: apiMocks,
}));

vi.mock('firebase/compat/app', () => ({
  default: {},
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getUserBack', () => {
  it('returns existing user data when available', async () => {
    const firebaseUser = {
      getIdToken: vi.fn().mockResolvedValue('token'),
      uid: 'user-1',
      email: 'user@example.com',
      displayName: 'Test User',
    } as never;
    const userData = { id: 'user-1', email: 'user@example.com' };
    apiMocks.get.mockResolvedValue({ data: userData });

    const result = await getUserBack(firebaseUser, UserRole.BUSINESS_OWNER);

    expect(apiMocks.get).toHaveBeenCalledWith('/user/me/data', {
      headers: { Authorization: 'Bearer token' },
    });
    expect(apiMocks.post).not.toHaveBeenCalled();
    expect(result).toEqual(userData);
  });

  it('creates a user when no data is returned', async () => {
    const firebaseUser = {
      getIdToken: vi.fn().mockResolvedValue('token'),
      uid: 'user-2',
      email: 'new@example.com',
      displayName: undefined,
    } as never;
    apiMocks.get.mockResolvedValue({ data: {} });
    apiMocks.post.mockResolvedValue({ data: { id: 'user-2' } });

    const result = await getUserBack(firebaseUser, UserRole.CUSTOMER);

    expect(apiMocks.post).toHaveBeenCalledWith(
      '/auth/register',
      {
        id: 'user-2',
        email: 'new@example.com',
        name: 'Usuario sin nombre',
        role: UserRole.CUSTOMER,
      },
      { headers: { Authorization: 'Bearer token' } },
    );
    expect(result).toEqual({ id: 'user-2' });
  });

  it('creates a user when the lookup returns 404', async () => {
    const firebaseUser = {
      getIdToken: vi.fn().mockResolvedValue('token'),
      uid: 'user-3',
      email: 'missing@example.com',
      displayName: 'Missing',
    } as never;
    apiMocks.get.mockRejectedValue({ status: 404 });
    apiMocks.post.mockResolvedValue({ data: { id: 'user-3' } });

    const result = await getUserBack(firebaseUser, UserRole.BUSINESS_OWNER);

    expect(apiMocks.post).toHaveBeenCalledWith(
      '/auth/register',
      {
        id: 'user-3',
        email: 'missing@example.com',
        name: 'Missing',
        role: UserRole.BUSINESS_OWNER,
      },
      { headers: { Authorization: 'Bearer token' } },
    );
    expect(result).toEqual({ id: 'user-3' });
  });

  it('creates a user when lookup fails with non-404 status', async () => {
    const firebaseUser = {
      getIdToken: vi.fn().mockResolvedValue('token'),
      uid: 'user-4',
      email: 'error@example.com',
      displayName: 'Error User',
    } as never;
    apiMocks.get.mockRejectedValue({ status: 500 });
    apiMocks.post.mockResolvedValue({ data: { id: 'user-4' } });

    const result = await getUserBack(firebaseUser, UserRole.BUSINESS_OWNER);

    expect(apiMocks.post).toHaveBeenCalled();
    expect(result).toEqual({ id: 'user-4' });
  });

  it('throws when token retrieval fails', async () => {
    const error = new Error('token-fail');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const firebaseUser = {
      getIdToken: vi.fn().mockRejectedValue(error),
      uid: 'user-5',
      email: 'fail@example.com',
      displayName: 'Fail User',
    } as never;

    await expect(getUserBack(firebaseUser, UserRole.BUSINESS_OWNER)).rejects.toBe(error);

    expect(consoleSpy).toHaveBeenCalledWith('Error en getUserBack:', error);
    consoleSpy.mockRestore();
  });
});
