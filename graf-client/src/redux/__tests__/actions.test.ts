/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { resetAppState, RESET_APP_STATE } from '../actions';
import { clearAxiosState } from '@/utils/axios';

vi.mock('@/utils/axios', () => ({
  clearAxiosState: vi.fn()
}));

const mockPurge = vi.fn();
vi.mock('../store', () => ({
  persistor: {
    purge: () => mockPurge()
  }
}));

describe('redux actions', () => {
  it('resetAppState dispatches action and cleans state', async () => {
    const dispatch = vi.fn();
    await resetAppState()(dispatch);

    expect(dispatch).toHaveBeenCalledWith({ type: RESET_APP_STATE });
    expect(clearAxiosState).toHaveBeenCalled();
    expect(mockPurge).toHaveBeenCalled();
  });
});
