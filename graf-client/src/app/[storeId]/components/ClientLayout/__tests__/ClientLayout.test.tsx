/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ClientLayout from '../index';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useStoreConfig } from '@/hooks/useStoreConfig';
import { toggleFilterSidebar } from '@/redux/ui';

// Mock Dependencies
vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock('@/utils/firebase', () => ({
  auth: { currentUser: null },
  firestore: {},
  storage: {}
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/hooks/useStoreConfig', () => ({
  useStoreConfig: vi.fn()
}));

vi.mock('@/services/orderService', () => ({
  checkProfileComplete: vi.fn().mockReturnValue(true)
}));

// Mock Actions
vi.mock('@/redux/ui', () => ({
  setStore: vi.fn((store) => ({ type: 'setStore', payload: store })),
  toggleFilterSidebar: vi.fn(() => ({ type: 'toggleFilterSidebar' })),
  default: (state = {}) => state
}));

// Mock Subcomponents
// Using both relative paths to catch variations
vi.mock('../../Header', () => ({ default: () => <div data-testid="header">Header</div> }));
vi.mock('../Header', () => ({ default: () => <div data-testid="header">Header</div> }));
vi.mock('../../Footer', () => ({ default: () => <div data-testid="footer">Footer</div> }));
vi.mock('@/components/InfoAlert', () => ({ default: () => <div data-testid="info-alert">InfoAlert</div> }));
vi.mock('../BottomBar', () => ({
  default: ({ handleOpenFilters, handleWhatsAppClick }: any) => (
    <div data-testid="bottom-bar">
      <button onClick={handleOpenFilters}>Filters</button>
      <button onClick={handleWhatsAppClick}>WhatsApp</button>
    </div>
  )
}));
vi.mock('../FloatingCart', () => ({ default: () => <div data-testid="floating-cart">FloatingCart</div> }));

describe('ClientLayout', () => {
  const dispatch = vi.fn();
  const push = vi.fn();
  const initialStore = {
    id: 'test-store',
    phoneNumber: '123',
    phonePrefix: '57',
    configuration: { paymentLink: 'http://test.com' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useDispatch as unknown as ReturnType<typeof vi.fn>).mockReturnValue(dispatch);
    (useParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ storeId: 'test-store' });
    (usePathname as unknown as ReturnType<typeof vi.fn>).mockReturnValue('/test-store');
    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ push });

    // Default: Not loading
    (useStoreConfig as any).mockReturnValue({ loading: false });

    // Default Selector - defensively adding properties Header might need
    (useSelector as unknown as ReturnType<typeof vi.fn>).mockImplementation((cb) => cb({
      ui: { store: null, searchText: '' },
      auth: { userData: {} },
      cart: { carts: {} }
    }));
  });

  afterEach(() => {
    cleanup();
  });

  it('dispatches setStore with initialStore on mount if store is missing', () => {
    render(<ClientLayout initialStore={initialStore as any}>Child Content</ClientLayout>);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'setStore', payload: initialStore }));
  });

  it('renders loading spinner when config is loading', () => {
    (useStoreConfig as any).mockReturnValue({ loading: true });
    render(<ClientLayout initialStore={initialStore as any}>Child Content</ClientLayout>);
    expect(screen.getByText('Cargando...')).toBeTruthy();
    expect(screen.queryByTestId('header')).toBeNull();
  });

  it('renders layout components when not loading', () => {
    render(<ClientLayout initialStore={initialStore as any}>Child Content</ClientLayout>);
    expect(screen.getByTestId('header')).toBeTruthy();
    expect(screen.getByTestId('footer')).toBeTruthy();
    expect(screen.getByTestId('floating-cart')).toBeTruthy();
    // Since we are mocking Header but it might not be working perfectly, checking content ensures Layout renders children
    expect(screen.getByText('Child Content')).toBeTruthy();
  });

  it('handles filter sidebar toggle interaction', () => {
    render(<ClientLayout initialStore={initialStore as any}>Child Content</ClientLayout>);
    const bottomBar = screen.getByTestId('bottom-bar');
    fireEvent.click(within(bottomBar).getByText('Filters'));
    expect(toggleFilterSidebar).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalled();
  });

  it('handles WhatsApp click interaction', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ClientLayout initialStore={initialStore as any}>Child Content</ClientLayout>);

    const bottomBar = screen.getByTestId('bottom-bar');
    fireEvent.click(within(bottomBar).getByText('WhatsApp'));

    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });
});
