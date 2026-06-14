import { describe, expect, it } from 'vitest';

import type { Config } from '../../types';
import configReducer, { setConfig, updateConfig } from '../config';

describe('config reducer', () => {
  it('sets config', () => {
    const config = { id: 1 } as Config;
    const state = configReducer(undefined, setConfig(config));

    expect(state.config).toBe(config);
  });

  it('updates config', () => {
    const config = { id: 2 } as Config;
    const state = configReducer(undefined, updateConfig(config));

    expect(state.config).toBe(config);
  });
});
