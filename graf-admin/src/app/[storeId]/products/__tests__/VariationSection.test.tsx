/**
 * @vitest-environment jsdom
 */
/* eslint-disable @next/next/no-img-element */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import VariationSection from '../VariationSection';
import uiReducer from '@/redux/ui';
import type { Product } from '@/types';

// Mock axios
vi.mock('@/utils/axios', () => ({
  default: {
    delete: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ alt, ...props }: { alt: string }) => <img alt={alt} {...props} />,
}));

// Mock extractFirstValidImageUrl
vi.mock('@/components/ImageUploader', () => ({
  extractFirstValidImageUrl: vi.fn(() => '/test-image.jpg'),
}));

// Mock VariationModal
vi.mock('../VariationModal', () => ({
  default: ({ show, onHide }: { show: boolean; onHide: () => void }) =>
    show ? (
      <div data-testid="variation-modal">
        <button onClick={onHide}>Close Modal</button>
      </div>
    ) : null,
}));

const createTestStore = () =>
  configureStore({
    reducer: {
      ui: uiReducer,
    },
  });

const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  title: 'Test Product',
  basePrice: 100,
  stock: 10,
  sku: 'TEST-SKU',
  description: 'Test description',
  store: { id: 'store-1', name: 'Test Store' } as Product['store'],
  children: [],
  ...overrides,
});

const createMockVariation = (id: number, title: string): Product => ({
  id,
  title,
  basePrice: 50,
  stock: 5,
  sku: `VAR-${id}`,
  description: `Variation ${id}`,
  store: { id: 'store-1', name: 'Test Store' } as Product['store'],
  children: [],
});

describe('VariationSection', () => {
  const mockFetchProducts = vi.fn();
  const storeId = 'store-1';
  const taxesOptions = [{ value: 1, label: 'Tax 1' }];
  const discountsOptions = [{ value: 1, label: 'Discount 1' }];
  const categoriesOptions = [{ value: 1, label: 'Category 1' }];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders variation table with children', () => {
    const variation1 = createMockVariation(2, 'Small Size');
    const variation2 = createMockVariation(3, 'Large Size');
    const parentProduct = createMockProduct({
      id: 1,
      title: 'Parent Product',
      children: [variation1, variation2],
    });

    const store = createTestStore();

    render(
      <Provider store={store}>
        <VariationSection
          currentProduct={parentProduct}
          storeId={storeId}
          fetchProducts={mockFetchProducts}
          taxesOptions={taxesOptions}
          discountsOptions={discountsOptions}
          categoriesOptions={categoriesOptions}
        />
      </Provider>
    );

    expect(screen.getByText('Small Size')).toBeTruthy();
    expect(screen.getByText('Large Size')).toBeTruthy();
  });

  it('shows delete confirmation modal when clicking delete button', async () => {
    const variation = createMockVariation(2, 'Test Variation');
    const parentProduct = createMockProduct({
      id: 1,
      children: [variation],
    });

    const store = createTestStore();

    render(
      <Provider store={store}>
        <VariationSection
          currentProduct={parentProduct}
          storeId={storeId}
          fetchProducts={mockFetchProducts}
          taxesOptions={taxesOptions}
          discountsOptions={discountsOptions}
          categoriesOptions={categoriesOptions}
        />
      </Provider>
    );

    // Click delete button
    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    fireEvent.click(deleteButtons[0]);

    // Check modal appears
    await waitFor(() => {
      expect(screen.getByText('Confirmar eliminación')).toBeTruthy();
      expect(screen.getByText('¿Está seguro que desea eliminar esta variación?')).toBeTruthy();
    });
  });

  it('calls API delete when confirming deletion', async () => {
    const api = await import('@/utils/axios');
    const mockDelete = vi.fn().mockResolvedValue({ data: { affected: 1 } });
    (api.default.delete as ReturnType<typeof vi.fn>).mockImplementation(mockDelete);

    const variation = createMockVariation(2, 'Test Variation');
    const parentProduct = createMockProduct({
      id: 1,
      children: [variation],
    });

    const store = createTestStore();

    render(
      <Provider store={store}>
        <VariationSection
          currentProduct={parentProduct}
          storeId={storeId}
          fetchProducts={mockFetchProducts}
          taxesOptions={taxesOptions}
          discountsOptions={discountsOptions}
          categoriesOptions={categoriesOptions}
        />
      </Provider>
    );

    // Click delete button
    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    fireEvent.click(deleteButtons[0]);

    // Wait for modal and click confirm
    await waitFor(() => {
      expect(screen.getByText('Confirmar eliminación')).toBeTruthy();
    });

    // The modal's Eliminar button is inside the modal footer - get all Eliminar buttons and pick the one in modal
    const allDeleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    const confirmButton = allDeleteButtons.find(btn => btn.classList.contains('btn-danger') && btn.closest('.modal-footer'));
    expect(confirmButton).toBeDefined();
    fireEvent.click(confirmButton!);

    // Verify API was called with correct endpoint
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('/products/store-1/2');
    });
  });

  it('shows success notification after successful deletion', async () => {
    const api = await import('@/utils/axios');
    const mockDelete = vi.fn().mockResolvedValue({ data: { affected: 1 } });
    (api.default.delete as ReturnType<typeof vi.fn>).mockImplementation(mockDelete);

    const variation = createMockVariation(2, 'Test Variation');
    const parentProduct = createMockProduct({
      id: 1,
      children: [variation],
    });

    const store = createTestStore();

    render(
      <Provider store={store}>
        <VariationSection
          currentProduct={parentProduct}
          storeId={storeId}
          fetchProducts={mockFetchProducts}
          taxesOptions={taxesOptions}
          discountsOptions={discountsOptions}
          categoriesOptions={categoriesOptions}
        />
      </Provider>
    );

    // Click delete button and confirm
    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirmar eliminación')).toBeTruthy();
    });

    // The modal's Eliminar button is inside the modal footer
    const allDeleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    const confirmButton = allDeleteButtons.find(btn => btn.classList.contains('btn-danger') && btn.closest('.modal-footer'));
    expect(confirmButton).toBeDefined();
    fireEvent.click(confirmButton!);

    // Verify fetchProducts was called to refresh the list
    await waitFor(() => {
      expect(mockFetchProducts).toHaveBeenCalled();
    });
  });

  it('handles API error gracefully', async () => {
    const api = await import('@/utils/axios');
    const mockDelete = vi.fn().mockRejectedValue({
      response: { data: { message: 'Error al eliminar' } },
    });
    (api.default.delete as ReturnType<typeof vi.fn>).mockImplementation(mockDelete);

    const variation = createMockVariation(2, 'Test Variation');
    const parentProduct = createMockProduct({
      id: 1,
      children: [variation],
    });

    const store = createTestStore();

    render(
      <Provider store={store}>
        <VariationSection
          currentProduct={parentProduct}
          storeId={storeId}
          fetchProducts={mockFetchProducts}
          taxesOptions={taxesOptions}
          discountsOptions={discountsOptions}
          categoriesOptions={categoriesOptions}
        />
      </Provider>
    );

    // Click delete button and confirm
    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirmar eliminación')).toBeTruthy();
    });

    // The modal's Eliminar button is inside the modal footer
    const allDeleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    const confirmButton = allDeleteButtons.find(btn => btn.classList.contains('btn-danger') && btn.closest('.modal-footer'));
    expect(confirmButton).toBeDefined();
    fireEvent.click(confirmButton!);

    // Verify API was called
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  it('renders nested sub-variations correctly', () => {
    const subVariation = createMockVariation(4, 'Sub-Variation');
    const variation = {
      ...createMockVariation(2, 'Main Variation'),
      children: [subVariation],
    };
    const parentProduct = createMockProduct({
      id: 1,
      children: [variation],
    });

    const store = createTestStore();

    render(
      <Provider store={store}>
        <VariationSection
          currentProduct={parentProduct}
          storeId={storeId}
          fetchProducts={mockFetchProducts}
          taxesOptions={taxesOptions}
          discountsOptions={discountsOptions}
          categoriesOptions={categoriesOptions}
        />
      </Provider>
    );

    expect(screen.getByText('Main Variation')).toBeTruthy();
    expect(screen.getByText('Sub-Variation')).toBeTruthy();
  });

  it('opens variation modal when clicking edit button', async () => {
    const variation = createMockVariation(2, 'Test Variation');
    const parentProduct = createMockProduct({
      id: 1,
      children: [variation],
    });

    const store = createTestStore();

    render(
      <Provider store={store}>
        <VariationSection
          currentProduct={parentProduct}
          storeId={storeId}
          fetchProducts={mockFetchProducts}
          taxesOptions={taxesOptions}
          discountsOptions={discountsOptions}
          categoriesOptions={categoriesOptions}
        />
      </Provider>
    );

    // Click edit button
    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    fireEvent.click(editButtons[0]);

    // Check modal appears
    await waitFor(() => {
      expect(screen.getByTestId('variation-modal')).toBeTruthy();
    });
  });

  it('opens variation modal when clicking add variation button', async () => {
    const parentProduct = createMockProduct({
      id: 1,
      children: [],
    });

    const store = createTestStore();

    render(
      <Provider store={store}>
        <VariationSection
          currentProduct={parentProduct}
          storeId={storeId}
          fetchProducts={mockFetchProducts}
          taxesOptions={taxesOptions}
          discountsOptions={discountsOptions}
          categoriesOptions={categoriesOptions}
        />
      </Provider>
    );

    // Click add variation button - use getAllByRole and find the primary one
    const addButtons = screen.getAllByRole('button', { name: /agregar/i });
    const primaryAddButton = addButtons.find(btn => btn.classList.contains('btn-primary'));
    expect(primaryAddButton).toBeDefined();
    fireEvent.click(primaryAddButton!);

    // Check modal appears
    await waitFor(() => {
      expect(screen.getByTestId('variation-modal')).toBeTruthy();
    });
  });
});
