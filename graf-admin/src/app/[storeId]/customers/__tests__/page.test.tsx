/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import CustomersPage from '../page';

const mocks = vi.hoisted(() => ({
  useCustomers: vi.fn(),
  refetch: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ storeId: 'store-1' }),
}));

vi.mock('../hooks/useCustomers', () => ({
  useCustomers: mocks.useCustomers,
}));

vi.mock('@/components/Dashboard/CustomersList', () => ({
  CustomersList: ({
    customers,
    isLoading,
    onUpdateCustomer,
    onDeleteCustomer,
  }: {
    customers: unknown[];
    isLoading: boolean;
    onUpdateCustomer?: (id: number, data: Record<string, unknown>) => Promise<unknown>;
    onDeleteCustomer?: (id: number) => Promise<void>;
  }) => (
    <div data-testid="customers-list" data-loading={isLoading}>
      <button type="button" onClick={() => onUpdateCustomer?.(1, { name: 'Updated' })}>
        update
      </button>
      <button type="button" onClick={() => onDeleteCustomer?.(1)}>
        delete
      </button>
      {customers.length}
    </div>
  ),
}));

vi.mock('@/components/Dashboard/ExportModal', () => ({
  default: ({ show, onHide }: { show: boolean; onHide: () => void }) =>
    show ? (
      <div data-testid="export-modal">
        <button type="button" onClick={onHide}>
          close-export
        </button>
      </div>
    ) : null,
}));

vi.mock('@/components/Dashboard/ImportCustomersModal', () => ({
  default: ({
    show,
    onSuccess,
    onHide,
  }: {
    show: boolean;
    onSuccess: () => void;
    onHide: () => void;
  }) =>
    show ? (
      <div data-testid="import-modal">
        <button type="button" onClick={onSuccess}>
          mock-success
        </button>
        <button type="button" onClick={onHide}>
          close-import
        </button>
      </div>
    ) : null,
}));

afterEach(() => cleanup());

beforeEach(() => {
  mocks.refetch.mockReset();
  mocks.updateCustomer.mockReset();
  mocks.deleteCustomer.mockReset();
  mocks.useCustomers.mockReset();
  mocks.useCustomers.mockReturnValue({
    customers: [{ id: 1 }, { id: 2 }],
    isLoading: false,
    stats: {
      totalCustomers: 12,
      activeCustomers: 7,
      averageSpent: 1234.6,
    },
    refetch: mocks.refetch,
    updateCustomer: mocks.updateCustomer,
    deleteCustomer: mocks.deleteCustomer,
  });
});

describe('CustomersPage', () => {
  it('renders headline and stats cards', () => {
    render(<CustomersPage />);

    expect(screen.getByText(/Gesti.n de Clientes/)).toBeTruthy();

    const totalCard = screen.getByText('Total Clientes').closest('.card');
    expect(totalCard).not.toBeNull();
    expect(within(totalCard as HTMLElement).getByText('12')).toBeTruthy();

    const activeCard = screen.getByText('Clientes Activos').closest('.card');
    expect(activeCard).not.toBeNull();
    expect(within(activeCard as HTMLElement).getByText('7')).toBeTruthy();

    const averageDisplay = `$${Math.round(1234.6).toLocaleString()}`;
    const averageCard = screen.getByText('Promedio Gastado').closest('.card');
    expect(averageCard).not.toBeNull();
    expect(within(averageCard as HTMLElement).getByText(averageDisplay)).toBeTruthy();
  });

  it('opens the export modal when clicking the export button', () => {
    render(<CustomersPage />);

    expect(screen.queryByTestId('export-modal')).toBeNull();
    fireEvent.click(screen.getByText('Exportar Excel'));
    expect(screen.getByTestId('export-modal')).toBeTruthy();
    fireEvent.click(screen.getByText('close-export'));
    expect(screen.queryByTestId('export-modal')).toBeNull();
  });

  it('opens import modal and refetches on success', async () => {
    render(<CustomersPage />);

    expect(screen.queryByTestId('import-modal')).toBeNull();
    fireEvent.click(screen.getByText('Importar Excel'));
    const modal = screen.getByTestId('import-modal');
    fireEvent.click(within(modal).getByText('mock-success'));

    await waitFor(() => {
      expect(mocks.refetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('import-modal')).toBeNull();
    });
  });

  it('closes import modal when onHide is triggered', () => {
    render(<CustomersPage />);

    fireEvent.click(screen.getByText('Importar Excel'));
    expect(screen.getByTestId('import-modal')).toBeTruthy();

    fireEvent.click(screen.getByText('close-import'));
    expect(screen.queryByTestId('import-modal')).toBeNull();
  });

  it('uses fallback values when stats are missing', () => {
    mocks.useCustomers.mockReturnValueOnce({
      customers: [],
      isLoading: false,
      stats: null,
      refetch: mocks.refetch,
      updateCustomer: mocks.updateCustomer,
      deleteCustomer: mocks.deleteCustomer,
    });

    render(<CustomersPage />);

    const totalCard = screen.getByText('Total Clientes').closest('.card') as HTMLElement;
    expect(totalCard).not.toBeNull();
    expect(within(totalCard).getByText('0')).toBeTruthy();
    expect(screen.getByText('Promedio Gastado')).toBeTruthy();
  });

  it('wires update and delete callbacks to the list', async () => {
    render(<CustomersPage />);

    fireEvent.click(screen.getByText('update'));
    fireEvent.click(screen.getByText('delete'));

    await waitFor(() => {
      expect(mocks.updateCustomer).toHaveBeenCalledWith(1, { name: 'Updated' });
      expect(mocks.deleteCustomer).toHaveBeenCalledWith(1);
    });
  });
});
