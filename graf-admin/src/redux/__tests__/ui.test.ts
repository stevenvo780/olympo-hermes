import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Config } from '../../types';
import uiReducer, {
  addNotification,
  loading,
  removeNotification,
  setConfig,
  setMobileSidebarVisible,
  setSidebarCollapsed,
  toggleSidebar,
} from '../ui';

vi.mock('uuid', () => ({
  v4: () => 'notif-1',
}));

const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');
const originalWindow = globalThis.window;

const setWindow = (innerWidth: number) => {
  Object.defineProperty(globalThis, 'window', {
    value: { innerWidth },
    writable: true,
    configurable: true,
  });
};

beforeEach(() => {
  setWindow(1024);
});

afterEach(() => {
  if (hadWindow) {
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
  } else {
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  }
  vi.restoreAllMocks();
});

describe('ui reducer', () => {
  it('sets loading state', () => {
    const state = uiReducer(undefined, loading(true));
    expect(state.loading).toBe(true);
  });

  it('adds and removes notifications', () => {
    const withNotification = uiReducer(
      undefined,
      addNotification({ message: 'Saved', color: 'success' }),
    );

    expect(withNotification.notifications).toHaveLength(1);
    expect(withNotification.notifications[0]).toEqual({
      id: 'notif-1',
      message: 'Saved',
      color: 'success',
    });

    const cleared = uiReducer(withNotification, removeNotification('notif-1'));
    expect(cleared.notifications).toHaveLength(0);
  });

  it('updates config and sidebar states', () => {
    const config = { id: 1 } as Config;
    const withConfig = uiReducer(undefined, setConfig(config));
    expect(withConfig.config).toBe(config);

    const collapsed = uiReducer(withConfig, setSidebarCollapsed(false));
    expect(collapsed.sidebarCollapsed).toBe(false);

    const mobileVisible = uiReducer(collapsed, setMobileSidebarVisible(true));
    expect(mobileVisible.isMobileSidebarVisible).toBe(true);
  });

  it('toggles mobile sidebar on small screens', () => {
    setWindow(480);
    const state = uiReducer(undefined, toggleSidebar());
    expect(state.isMobileSidebarVisible).toBe(true);
  });

  it('toggles sidebar collapsed on large screens', () => {
    setWindow(1200);
    const state = uiReducer(undefined, toggleSidebar());
    expect(state.sidebarCollapsed).toBe(false);
  });
});
