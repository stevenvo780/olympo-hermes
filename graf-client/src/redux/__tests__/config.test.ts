import { describe, expect, it } from 'vitest';
import configReducer, {
  clearConfig,
  setConfig,
  setConfigError,
  setConfigLoading,
} from '@/redux/config';
import type { Config } from '@/types';

describe('config slice', () => {
  it('sets loading and config values', () => {
    let state = configReducer(undefined, { type: 'init' });
    state = configReducer(state, setConfigLoading(true));

    const config = { id: 1 } as Config;
    state = configReducer(state, setConfig(config));

    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.config).toEqual(config);
  });

  it('handles errors and clears config', () => {
    let state = configReducer(undefined, { type: 'init' });
    state = configReducer(state, setConfigError('failed'));

    expect(state.error).toBe('failed');
    expect(state.loading).toBe(false);

    state = configReducer(state, clearConfig());
    expect(state.config).toBeNull();
    expect(state.error).toBeNull();
  });
});
