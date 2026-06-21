import { vi, describe, it, expect } from 'vitest';
import { redirect } from 'next/navigation';
import HomePage from '../page';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('HomePage', () => {
  it('redirects to /hermes', async () => {
    await HomePage(); // It is async function
    expect(redirect).toHaveBeenCalledWith('/hermes');
  });
});
