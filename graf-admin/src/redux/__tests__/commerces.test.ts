import { describe, expect, it } from 'vitest';

import type { Store } from '../../types';
import commercesReducer, { removeCommerce, setCommerces } from '../commerces';

const makeStore = (id: string): Store => ({ id } as Store);

describe('commerces reducer', () => {
  it('sets commerces list', () => {
    const commerces = [makeStore('s1'), makeStore('s2')];
    const state = commercesReducer(undefined, setCommerces(commerces));

    expect(state.commerces).toEqual(commerces);
  });

  it('removes a commerce by id', () => {
    const commerces = [makeStore('s1'), makeStore('s2')];
    const initial = commercesReducer(undefined, setCommerces(commerces));
    const state = commercesReducer(initial, removeCommerce('s1'));

    expect(state.commerces).toEqual([makeStore('s2')]);
  });
});
