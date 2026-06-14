import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clearAxiosState: vi.fn(),
  purge: vi.fn(),
}));

vi.mock('../../utils/axios', () => ({
  clearAxiosState: mocks.clearAxiosState,
}));

vi.mock('../store', () => ({
  persistor: {
    purge: mocks.purge,
  },
}));

import { RESET_APP_STATE, resetAppState, resetAppStateAction } from '../actions';

afterEach(() => {
  vi.clearAllMocks();
});

describe('actions', () => {
  it('creates the reset action', () => {
    expect(resetAppStateAction()).toEqual({ type: RESET_APP_STATE });
  });

  it('dispatches reset and clears axios state', async () => {
    mocks.purge.mockResolvedValue(undefined);
    const dispatch = vi.fn();

    await resetAppState()(dispatch);

    expect(dispatch).toHaveBeenCalledWith({ type: RESET_APP_STATE });
    expect(mocks.clearAxiosState).toHaveBeenCalledTimes(1);
    expect(mocks.purge).toHaveBeenCalledTimes(1);
  });

  it('logs when persistor purge fails', async () => {
    const error = new Error('purge failed');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.purge.mockRejectedValue(error);
    const dispatch = vi.fn();

    await resetAppState()(dispatch);

    expect(consoleSpy).toHaveBeenCalledWith('Error al purgar el persistor:', error);
  });
});
