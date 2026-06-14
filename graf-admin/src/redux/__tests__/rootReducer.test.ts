import { describe, expect, it } from 'vitest';

import { vi } from 'vitest';

vi.mock('../../utils/firebaseHelper', () => ({
  signOutUser: vi.fn(),
}));

vi.mock('../../utils/axios', () => ({
  clearAxiosState: vi.fn(),
}));

import rootReducer from '../rootReducer';
import { RESET_APP_STATE } from '../actions';

describe('rootReducer', () => {
  it('resets state on RESET_APP_STATE', () => {
    const initialState = rootReducer(undefined, { type: 'init' });
    const modifiedState = {
      ...initialState,
      ui: { ...initialState.ui, loading: true },
    };

    const nextState = rootReducer(modifiedState, { type: RESET_APP_STATE });

    expect(nextState).toEqual(initialState);
  });
});
