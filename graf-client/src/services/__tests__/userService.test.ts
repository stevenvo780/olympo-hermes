import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserBack } from '../userService';
import api from '@/utils/axios';
import { UserRole } from '@/types';

// Mock dependencies
vi.mock('@/utils/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('userService', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    getIdToken: vi.fn().mockResolvedValue('mock-token'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches existing user and profile successfully', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { id: 'user-id', email: 'test@example.com' } }) // /user/me/data
      .mockResolvedValueOnce({ data: { id: 'profile-id' } }); // /profile/get/my

    const result = await getUserBack(mockUser as any, UserRole.CUSTOMER);

    expect(mockUser.getIdToken).toHaveBeenCalled();
    expect(api.get).toHaveBeenCalledWith('/user/me/data', { headers: { Authorization: 'Bearer mock-token' } });
    expect(api.get).toHaveBeenCalledWith('/profile/get/my');
    expect(result).toEqual({
      user: { id: 'user-id', email: 'test@example.com' },
      profile: { id: 'profile-id' },
    });
  });

  it('registers new user if fetching fails with 404', async () => {
    // First get fails with 404
    vi.mocked(api.get)
      .mockRejectedValueOnce({ status: 404 })
      .mockResolvedValueOnce({ data: { id: 'profile-id' } }); // Profile fetch after register

    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'new-user-id' } });

    const result = await getUserBack(mockUser as any, UserRole.CUSTOMER);

    expect(api.get).toHaveBeenCalledWith('/user/me/data', expect.any(Object));
    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      id: 'test-uid',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.CUSTOMER,
    }, { headers: { Authorization: 'Bearer mock-token' } });

    expect(result.user).toEqual({ id: 'new-user-id' });
    expect(result.profile).toEqual({ id: 'profile-id' });
  });

  it('handles register error', async () => {
    vi.mocked(api.get).mockRejectedValueOnce({ status: 404 });
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Register failed'));

    await expect(getUserBack(mockUser as any)).rejects.toThrow('Register failed');
  });

  it('returns empty profile if profile fetch fails after register', async () => {
    vi.mocked(api.get)
      .mockRejectedValueOnce({ status: 404 }) // user fetch
      .mockRejectedValueOnce(new Error('Profile fetch failed')); // profile fetch

    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'new-user-id' } });

    const result = await getUserBack(mockUser as any);

    expect(result.user).toEqual({ id: 'new-user-id' });
    expect(result.profile).toEqual({});
  });

  it('uses default name if displayName is missing', async () => {
    const userNoName = { ...mockUser, displayName: null };
    vi.mocked(api.get).mockRejectedValueOnce({ status: 404 });
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'new-user-id' } });
    vi.mocked(api.get).mockResolvedValueOnce({ data: {} });

    await getUserBack(userNoName as any);

    expect(api.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({
      name: 'Usuario sin nombre'
    }), expect.any(Object));
  });

  it('registers if user data response is empty or missing id', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: {} });
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'new-user-id' } });
    vi.mocked(api.get).mockResolvedValueOnce({ data: { id: 'profile-id' } });

    const result = await getUserBack(mockUser as any);

    expect(api.post).toHaveBeenCalled();
    expect(result.user.id).toBe('new-user-id');
  });

  it('logs error and registers if fetching fails with non-404 status', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    vi.mocked(api.get).mockRejectedValueOnce({ status: 500 });
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'new-user-id' } });
    vi.mocked(api.get).mockResolvedValueOnce({ data: { id: 'profile-id' } });

    await getUserBack(mockUser as any);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user data:', expect.any(Object));
    expect(api.post).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('handles errors without status', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Network Error'));
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'new-user-id' } });
    vi.mocked(api.get).mockResolvedValueOnce({ data: { id: 'profile-id' } });

    await getUserBack(mockUser as any);

    expect(api.post).toHaveBeenCalled();
  });
});
