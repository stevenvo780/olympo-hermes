import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('uuid', () => ({
  v4: () => 'uuid-1',
}));

import uiReducer, {
  addCachedImage,
  addNotification,
  clearImageCache,
  closeCart,
  loading,
  openCart,
  removeNotification,
  setSearchText,
  setShowModalFilters,
  setStore,
  toggleFilterSidebar,
} from '@/redux/ui';
import type { Store } from '@/types';

describe('ui slice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles loading state and notifications', () => {
    let state = uiReducer(undefined, { type: 'init' });
    state = uiReducer(state, loading(true));

    expect(state.loading).toBe(true);

    state = uiReducer(state, addNotification({ message: 'Hello', color: 'green' }));
    expect(state.notifications[0]).toEqual({
      id: 'uuid-1',
      message: 'Hello',
      color: 'green',
    });

    state = uiReducer(state, removeNotification('uuid-1'));
    expect(state.notifications).toEqual([]);
  });

  it('updates store, search, and modal flags', () => {
    const store = { id: '1' } as Store;
    let state = uiReducer(undefined, { type: 'init' });
    state = uiReducer(state, setStore(store));
    state = uiReducer(state, setSearchText('query'));
    state = uiReducer(state, setShowModalFilters(true));

    expect(state.store).toEqual(store);
    expect(state.searchText).toBe('query');
    expect(state.modalFilters).toBe(true);
  });

  it('manages cached images and filter sidebar', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1234);
    let state = uiReducer(undefined, { type: 'init' });
    state = uiReducer(state, addCachedImage('/image.png'));

    expect(state.cachedImages['/image.png']).toBe(1234);

    state = uiReducer(state, clearImageCache());
    expect(state.cachedImages).toEqual({});

    state = uiReducer(state, toggleFilterSidebar());
    expect(state.showFilterSidebar).toBe(true);

    state = uiReducer(state, toggleFilterSidebar(false));
    expect(state.showFilterSidebar).toBe(false);

    nowSpy.mockRestore();
  });

  it('opens and closes cart', () => {
    let state = uiReducer(undefined, { type: 'init' });
    state = uiReducer(state, openCart());
    expect(state.cartOpen).toBe(true);

    state = uiReducer(state, closeCart());
    expect(state.cartOpen).toBe(false);
  });
});
