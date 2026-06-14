/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import ClientLayout from '../ClientLayout';

vi.mock('@/utils/firebase', () => ({
  auth: { currentUser: null },
  firestore: {},
  storage: {}
}));

vi.mock('@/utils/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://test.com'
  }
}));

// Mock Hooks
const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  useParams: { storeId: 'test-store' },
  usePathname: '/test-store',
  useStoreConfig: { loading: false },
  useSearchParams: new URLSearchParams(),
  store: null,
  userData: { email: 'test@user.com' },
}));

vi.mock('react-redux', () => ({
  useDispatch: () => mocks.dispatch,
  useSelector: (selector: (state: Record<string, unknown>) => unknown) => selector({
    ui: { store: mocks.store },
    auth: { userData: mocks.userData },
    cart: { carts: {} }
  })
}));

vi.mock('next/navigation', () => ({
  useParams: () => mocks.useParams,
  usePathname: () => mocks.usePathname,
  useSearchParams: () => mocks.useSearchParams,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() })
}));

vi.mock('@/hooks/useStoreConfig', () => ({
  useStoreConfig: () => mocks.useStoreConfig
}));

vi.mock('@/redux/ui', () => ({
  setStore: (s: Record<string, unknown>) => ({ type: 'setStore', payload: s }),
  toggleFilterSidebar: () => ({ type: 'toggleFilterSidebar' }),
  default: (state = {}) => state // Mock reducer
}));

// Mock child components
vi.mock('../Header', () => ({ default: () => <div data-testid="header" /> }));
vi.mock('../Footer', () => ({ default: () => <div data-testid="footer" /> }));
vi.mock('@/components/InfoAlert', () => ({ default: () => <div data-testid="info-alert" /> }));
// These are inside ClientLayout folder, so path from __tests__ is ../ClientLayout/...
vi.mock('../ClientLayout/BottomBar', () => ({ default: () => <div data-testid="bottom-bar" /> }));
vi.mock('../ClientLayout/FloatingCart', () => ({ default: () => <div data-testid="floating-cart" /> }));
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
}));

describe('ClientLayout', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();
    mocks.store = null;
    mocks.useStoreConfig.loading = false;
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    container.remove();
  });

  const initialStore: Record<string, unknown> = { id: 'initial-store', configuration: {} };

  it('renders loading spinner when config is loading', async () => {
    mocks.useStoreConfig.loading = true;
    await act(async () => {
      root.render(<ClientLayout initialStore={initialStore as any}><div /></ClientLayout>);
    });
    expect(container.textContent).toContain('universos se están alineando');
  });

  it('renders layout components when loaded', async () => {
    mocks.useStoreConfig.loading = false;
    await act(async () => {
      root.render(<ClientLayout initialStore={initialStore as any}><div data-testid="child" /></ClientLayout>);
    });

    expect(container.querySelector('[data-testid="header"]')).toBeDefined();
    expect(container.querySelector('[data-testid="footer"]')).toBeDefined();
    expect(container.querySelector('[data-testid="child"]')).toBeDefined();
    expect(container.querySelector('[data-testid="bottom-bar"]')).toBeDefined();
  });

  it('dispatches setStore if store is not in state', async () => {
    await act(async () => {
      root.render(<ClientLayout initialStore={initialStore as any}><div /></ClientLayout>);
    });
    expect(mocks.dispatch).toHaveBeenCalledWith({ type: 'setStore', payload: initialStore });
  });
});
