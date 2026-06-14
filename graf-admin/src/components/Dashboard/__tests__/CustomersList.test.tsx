/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { CustomersList } from '../CustomersList';
import type { Customer } from '@/app/[storeId]/customers/hooks/useCustomers';

const buildCustomer = (overrides: Partial<Customer> = {}): Customer => ({
  id: 1,
  name: 'Ana Perez',
  email: 'ana@example.com',
  phone: '3001234567',
  documentNumber: 'CC123',
  address: 'Calle 1',
  city: 'Bogota',
  postalCode: '110111',
  birthDate: '1990-01-01',
  loyaltyPoints: 10,
  isActive: true,
  notes: 'VIP',
  totalSpent: 120000,
  totalOrders: 3,
  userId: 'user-1',
  storeId: 'store-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-05T00:00:00Z',
  ...overrides,
});

afterEach(() => cleanup());

describe('CustomersList', () => {
  it('renders loading state', () => {
    render(<CustomersList customers={[]} isLoading={true} storeId="store-1" />);

    expect(screen.getByText('Cargando clientes...')).toBeTruthy();
  });

  it('shows empty state when no customers', () => {
    render(<CustomersList customers={[]} isLoading={false} storeId="store-1" />);

    expect(screen.getByText('No hay clientes')).toBeTruthy();
    expect(screen.getByText(/clientes registrados/i)).toBeTruthy();
  });

  it('handles non-array customers input safely', () => {
    render(
      <CustomersList
        customers={null as unknown as Customer[]}
        isLoading={false}
        storeId="store-1"
      />
    );

    expect(screen.getByText('No hay clientes')).toBeTruthy();
  });

  it('filters customers by search term', () => {
    const customers = [
      buildCustomer(),
      buildCustomer({ id: 2, name: 'Carlos Gomez', email: 'carlos@example.com', city: 'Medellin' }),
    ];

    render(<CustomersList customers={customers} isLoading={false} storeId="store-1" />);

    expect(screen.getByText(/Clientes \(2\)/)).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('Buscar clientes...'), {
      target: { value: 'ana' },
    });

    expect(screen.getByText(/Clientes \(1\)/)).toBeTruthy();
    expect(screen.getByText('Ana Perez')).toBeTruthy();
    expect(screen.queryByText('Carlos Gomez')).toBeNull();
  });

  it('shows search empty state when no matches are found', () => {
    const customers = [
      buildCustomer(),
      buildCustomer({ id: 2, name: 'Carlos Gomez', email: 'carlos@example.com', city: 'Medellin' }),
    ];

    render(<CustomersList customers={customers} isLoading={false} storeId="store-1" />);

    fireEvent.change(screen.getByPlaceholderText('Buscar clientes...'), {
      target: { value: 'zzz' },
    });

    expect(screen.getByText(/No se encontraron clientes/i)).toBeTruthy();
  });

  it('opens the detail modal when a row is clicked', () => {
    const customers = [buildCustomer()];

    render(<CustomersList customers={customers} isLoading={false} storeId="store-1" />);

    fireEvent.click(screen.getByText('Ana Perez'));

    expect(screen.getByText('Detalle del Cliente')).toBeTruthy();
    const modal = screen.getByText('Detalle del Cliente').closest('.modal-content');
    expect(modal).not.toBeNull();
    expect(within(modal as HTMLElement).getByText('ana@example.com')).toBeTruthy();
  });

  it('renders fallback values in the detail modal', () => {
    const customers = [
      buildCustomer({
        email: undefined,
        phone: undefined,
        documentNumber: undefined,
        address: undefined,
        city: undefined,
        postalCode: undefined,
        isActive: false,
      }),
    ];

    render(<CustomersList customers={customers} isLoading={false} storeId="store-1" />);

    fireEvent.click(screen.getByText('Ana Perez'));

    const modal = screen.getByText('Detalle del Cliente').closest('.modal-content');
    expect(modal).not.toBeNull();
    expect(within(modal as HTMLElement).getAllByText('—').length).toBeGreaterThan(0);
    expect(within(modal as HTMLElement).getByText('Inactivo')).toBeTruthy();
  });

  it('closes the detail modal when the header close is clicked', async () => {
    const customers = [buildCustomer()];

    render(<CustomersList customers={customers} isLoading={false} storeId="store-1" />);

    fireEvent.click(screen.getByText('Ana Perez'));
    expect(screen.getByText('Detalle del Cliente')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Close'));
    await waitFor(() => {
      expect(screen.queryByText('Detalle del Cliente')).toBeNull();
    });
  });

  it('edits and saves customer changes', async () => {
    const customer = buildCustomer();
    const onUpdateCustomer = vi.fn().mockResolvedValue({
      ...customer,
      name: 'Ana Maria',
    });

    render(
      <CustomersList
        customers={[customer]}
        isLoading={false}
        storeId="store-1"
        onUpdateCustomer={onUpdateCustomer}
      />
    );

    fireEvent.click(screen.getByTitle('Editar'));
    fireEvent.change(screen.getByDisplayValue('Ana Perez'), {
      target: { value: 'Ana Maria' },
    });
    fireEvent.click(screen.getByText('Guardar cambios'));

    await waitFor(() => {
      expect(onUpdateCustomer).toHaveBeenCalledWith(
        customer.id,
        expect.objectContaining({ name: 'Ana Maria' })
      );
    });
  });

  it('updates edit fields and cancels', async () => {
    const customer = buildCustomer();

    render(
      <CustomersList
        customers={[customer]}
        isLoading={false}
        storeId="store-1"
      />
    );

    fireEvent.click(screen.getByTitle('Editar'));

    fireEvent.change(screen.getByDisplayValue('ana@example.com'), {
      target: { value: 'nuevo@example.com' },
    });
    fireEvent.change(screen.getByDisplayValue('3001234567'), {
      target: { value: '3115550000' },
    });
    fireEvent.change(screen.getByDisplayValue('CC123'), {
      target: { value: 'CC999' },
    });
    fireEvent.change(screen.getByDisplayValue('Calle 1'), {
      target: { value: 'Calle 9' },
    });
    fireEvent.change(screen.getByDisplayValue('Bogota'), {
      target: { value: 'Cali' },
    });
    fireEvent.change(screen.getByDisplayValue('110111'), {
      target: { value: '760001' },
    });
    fireEvent.click(screen.getByRole('checkbox'));

    expect(screen.getByDisplayValue('nuevo@example.com')).toBeTruthy();
    expect(screen.getByDisplayValue('3115550000')).toBeTruthy();
    expect(screen.getByDisplayValue('CC999')).toBeTruthy();
    expect(screen.getByDisplayValue('Calle 9')).toBeTruthy();
    expect(screen.getByDisplayValue('Cali')).toBeTruthy();
    expect(screen.getByDisplayValue('760001')).toBeTruthy();

    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => {
      expect(screen.queryByText('Editar Cliente')).toBeNull();
    });
  });

  it('closes the edit modal when the header close is clicked', async () => {
    const customer = buildCustomer();

    render(<CustomersList customers={[customer]} isLoading={false} storeId="store-1" />);

    fireEvent.click(screen.getByTitle('Editar'));
    expect(screen.getByText('Editar Cliente')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Close'));
    await waitFor(() => {
      expect(screen.queryByText('Editar Cliente')).toBeNull();
    });
  });

  it('renders status badges for active and inactive customers', () => {
    const customers = [
      buildCustomer({ id: 1, totalOrders: 0, isActive: true }),
      buildCustomer({ id: 2, name: 'Inactive', email: 'inactive@example.com', isActive: false }),
    ];

    render(<CustomersList customers={customers} isLoading={false} storeId="store-1" />);

    expect(screen.getByText('Sin pedidos')).toBeTruthy();
    expect(screen.getByText('Inactivo')).toBeTruthy();
  });

  it('does nothing when delete handler is missing', () => {
    const customer = buildCustomer();
    const confirmSpy = vi.spyOn(window, 'confirm');

    render(<CustomersList customers={[customer]} isLoading={false} storeId="store-1" />);

    fireEvent.click(screen.getByTitle('Eliminar'));

    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('returns early when update handler is missing', () => {
    const customer = buildCustomer();

    render(<CustomersList customers={[customer]} isLoading={false} storeId="store-1" />);

    fireEvent.click(screen.getByTitle('Editar'));
    fireEvent.click(screen.getByText('Guardar cambios'));

    expect(screen.getByText('Editar Cliente')).toBeTruthy();
  });

  it('confirms deletion before calling onDeleteCustomer', async () => {
    const customer = buildCustomer();
    const onDeleteCustomer = vi.fn().mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <CustomersList
        customers={[customer]}
        isLoading={false}
        storeId="store-1"
        onDeleteCustomer={onDeleteCustomer}
      />
    );

    fireEvent.click(screen.getByTitle('Eliminar'));

    await waitFor(() => {
      expect(onDeleteCustomer).toHaveBeenCalledWith(customer.id);
    });

    confirmSpy.mockRestore();
  });
});
