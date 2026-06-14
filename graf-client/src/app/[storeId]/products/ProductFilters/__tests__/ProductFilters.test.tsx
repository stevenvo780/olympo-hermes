import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock firebase completely to avoid initialization errors
vi.mock('firebase/compat/app', () => {
  const mockAuth = () => ({
    currentUser: null,
    onAuthStateChanged: vi.fn(),
  });
  const mockFirestore = () => ({});
  const mockStorage = () => ({});

  return {
    default: {
      apps: [],
      initializeApp: vi.fn(),
      app: vi.fn(),
      auth: mockAuth,
      firestore: mockFirestore,
      storage: mockStorage,
    },
  };
});
vi.mock('firebase/compat/auth', () => ({}));
vi.mock('firebase/compat/firestore', () => ({}));
vi.mock('firebase/compat/storage', () => ({}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
}));

// Import component AFTER mocking
import ProductFilters from '../index';
import { setFilters, setActiveRange, setQuickFilterLabels, setLoadingFilters } from '@/redux/products';

// Mock dependencies
vi.mock('@/utils/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { minPrice: 100, maxPrice: 1000 } })),
  },
}));

vi.mock('../CategoryTree', () => ({
  default: () => <div data-testid="CategoryTree">CategoryTree</div>
}));

vi.mock('react-icons/bs', () => ({
  BsCurrencyDollar: () => <span data-testid="icon-dollar" />,
  BsCashStack: () => <span data-testid="icon-cash-stack" />,
  BsCashCoin: () => <span data-testid="icon-cash-coin" />,
  BsCash: () => <span data-testid="icon-cash" />,
  BsTrash: () => <span data-testid="icon-trash" />,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ storeId: 'test-store' }),
}));

vi.mock('lodash/debounce', () => ({
  default: (fn: any) => {
    const debounced = (...args: any[]) => fn(...args);
    debounced.cancel = vi.fn();
    return debounced;
  },
}));

const mockStore = configureStore([]);

describe('ProductFilters', () => {
  let store: any;
  let defaultState: any;

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    cleanup();
    defaultState = {
      categories: {
        categoriesHierarchy: [
          { id: 'cat1', name: 'Electronics', children: [] },
          { id: 'cat2', name: 'Clothing', children: [] },
        ],
      },
      products: {
        activeRange: '',
        filters: {
          minPrice: 0,
          maxPrice: 0,
          category: '',
          discount: '',
        },
        quickFilterLabels: {
          lowest: '',
          low: '',
          medium: '',
          high: '',
        },
        loadingFilters: false,
      },
    };
    store = mockStore(defaultState);
    store.dispatch = vi.fn();
  });

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={store}>
        <ProductFilters {...props} />
      </Provider>
    );
  };

  it('renders correctly', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: /limpiar filtros/i })).toBeTruthy();
    expect(screen.getByPlaceholderText('Precio mínimo')).toBeTruthy();
    expect(screen.getByPlaceholderText('Precio máximo')).toBeTruthy();
  });

  it('fetches price ranges on mount if labels are empty', async () => {
    renderComponent();

    // Initial dispatch to set loading
    expect(store.dispatch).toHaveBeenCalledWith(setLoadingFilters(true));

    await waitFor(() => {
      // Check if success action was dispatched
      expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: setQuickFilterLabels.type
      }));
    });
  });

  it('handles quick filter clicks', async () => {
    vi.useFakeTimers();
    // Preset labels
    defaultState.products.quickFilterLabels = {
      lowest: '100 - 300',
      low: '300 - 500',
      medium: '500 - 800',
      high: '800 - 1000',
    };
    store = mockStore(defaultState);
    store.dispatch = vi.fn();

    renderComponent();

    const lowestBtn = screen.getByText('100 - 300');
    fireEvent.click(lowestBtn);
    vi.runAllTimers();
    vi.useRealTimers();

    expect(store.dispatch).toHaveBeenCalledWith(setActiveRange('lowest'));
    // The second dispatch sets the actual min/max values
    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: setFilters.type,
      payload: expect.objectContaining({ minPrice: 100, maxPrice: 300 })
    }));
  });

  it('toggles quick filter off if clicked again', async () => {
    vi.useFakeTimers();
    defaultState.products.activeRange = 'lowest';
    defaultState.products.quickFilterLabels = { lowest: '100 - 300' };
    store = mockStore(defaultState);
    store.dispatch = vi.fn();

    renderComponent();

    const lowestBtn = screen.getByText('100 - 300');
    fireEvent.click(lowestBtn);
    vi.runAllTimers();
    vi.useRealTimers();

    expect(store.dispatch).toHaveBeenCalledWith(setActiveRange(''));
    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: setFilters.type,
      payload: expect.objectContaining({ minPrice: 0, maxPrice: 0 })
    }));
  });

  it('updates min/max price inputs', () => {
    renderComponent();

    const minInput = screen.getByPlaceholderText('Precio mínimo');
    fireEvent.change(minInput, { target: { value: '50' } });

    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: setFilters.type,
      payload: expect.objectContaining({ minPrice: 50 })
    }));
  });

  it('clears input on double click', () => {
    defaultState.products.filters.minPrice = 100;
    store = mockStore(defaultState);
    store.dispatch = vi.fn();

    renderComponent();
    const minInput = screen.getByPlaceholderText('Precio mínimo');

    fireEvent.doubleClick(minInput);
    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: setFilters.type,
      payload: { ...defaultState.products.filters, minPrice: 0 }
    }));
  });

  it('clears input on small X button click', () => {
    defaultState.products.filters.maxPrice = 200;
    store = mockStore(defaultState);
    store.dispatch = vi.fn();

    renderComponent();
    // There should be a "×" button next to max price.
    // Since we are mocking react-icons, the button might just contain text "×" or whatever clear-btn has.
    // In component: <Button variant="link" className="clear-btn" onClick={() => handleInputClear('maxPrice')}>×</Button>
    const clearBtns = screen.getAllByText('×');
    fireEvent.click(clearBtns[0]);

    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: setFilters.type,
      payload: { ...defaultState.products.filters, maxPrice: 0 }
    }));
  });

  it('handles discount filter toggles', () => {
    vi.useFakeTimers();
    renderComponent();

    const withDiscountBtn = screen.getByText('Con descuento');
    fireEvent.click(withDiscountBtn);
    vi.runAllTimers();
    vi.useRealTimers();

    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: setFilters.type,
      payload: { ...defaultState.products.filters, discount: 'true' }
    }));
  });

  it('resets all filters', () => {
    renderComponent();

    const resetBtn = screen.getByRole('button', { name: /limpiar filtros/i });
    fireEvent.click(resetBtn);

    expect(store.dispatch).toHaveBeenCalledWith(setActiveRange(''));
    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: setFilters.type,
      payload: {
        minPrice: 0,
        maxPrice: 0,
        category: '',
        discount: '',
      }
    }));
  });
});
