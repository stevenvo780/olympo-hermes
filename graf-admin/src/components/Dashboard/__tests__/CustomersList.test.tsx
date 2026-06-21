/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
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

  it('shows create customer button in empty state when onCreate is provided', () => {
    const onCreate = vi.fn();

    render(
      <CustomersList
        customers={[]}
        isLoading={false}
        storeId="store-1"
        onCreate={onCreate}
      />
    );

    const button = screen.getByRole('button', { name: /Crear Primer Cliente/i });
    expect(button).toBeTruthy();

    fireEvent.click(button);
    expect(onCreate).toHaveBeenCalled();
  });

  it('hides create customer button when search has results but no customers', () => {
    const onCreate = vi.fn();

    render(
      <CustomersList
        customers={[]}
        isLoading={false}
        storeId="store-1"
        onCreate={onCreate}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Buscar clientes...'), {
      target: { value: 'search term' },
    });

    expect(screen.queryByRole('button', { name: /Crear Primer Cliente/i })).toBeNull();
  });

  it('renders badge-info with data-test-contrast attribute', () => {
    const customers = [buildCustomer({ loyaltyPoints: 123 })];
    render(<CustomersList customers={customers} isLoading={false} storeId="store-1" />);
    
    const badge = screen.getByText('123 pts');
    expect(badge).toBeTruthy();
    expect(badge.getAttribute('data-test-contrast')).toBe('badge-info');
  });

  it('validates badge colors contrast ratios by reading and parsing prizma-brand.css', () => {
    const cssPath = path.resolve(__dirname, '../../../styles/prizma-brand.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Simple regex to parse variables
    // Parse light mode variables under :root
    const rootBlockMatch = cssContent.match(/:root\s*{([^}]+)}/);
    expect(rootBlockMatch).not.toBeNull();
    const rootContent = rootBlockMatch![1];
    const lightBgMatch = rootContent.match(/--badge-info-bg:\s*(#[a-fA-F0-9]{3,8})/);
    const lightTextMatch = rootContent.match(/--badge-info-text:\s*(#[a-fA-F0-9]{3,8})/);

    expect(lightBgMatch).not.toBeNull();
    expect(lightTextMatch).not.toBeNull();
    const lightBg = lightBgMatch![1].trim();
    const lightText = lightTextMatch![1].trim();

    // Parse dark mode variables under [data-theme="dark"]
    const darkBlockMatch = cssContent.match(/\[data-theme="dark"\]\s*{([^}]+)}/);
    expect(darkBlockMatch).not.toBeNull();
    const darkContent = darkBlockMatch![1];
    const darkBgMatch = darkContent.match(/--badge-info-bg:\s*(#[a-fA-F0-9]{3,8})/);
    const darkTextMatch = darkContent.match(/--badge-info-text:\s*(#[a-fA-F0-9]{3,8})/);

    expect(darkBgMatch).not.toBeNull();
    expect(darkTextMatch).not.toBeNull();
    const darkBg = darkBgMatch![1].trim();
    const darkText = darkTextMatch![1].trim();

    function getLuminance(hexColor: string): number {
      const hex = hexColor.replace('#', '');
      let r = 0, g = 0, b = 0;
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16) / 255;
        g = parseInt(hex[1] + hex[1], 16) / 255;
        b = parseInt(hex[2] + hex[2], 16) / 255;
      } else {
        r = parseInt(hex.substring(0, 2), 16) / 255;
        g = parseInt(hex.substring(2, 4), 16) / 255;
        b = parseInt(hex.substring(4, 6), 16) / 255;
      }

      const a = [r, g, b].map(v => {
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });

      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    function getContrastRatio(hex1: string, hex2: string): number {
      const l1 = getLuminance(hex1);
      const l2 = getLuminance(hex2);
      const brightest = Math.max(l1, l2);
      const darkest = Math.min(l1, l2);
      return (brightest + 0.05) / (darkest + 0.05);
    }

    const lightContrast = getContrastRatio(lightBg, lightText);
    expect(lightContrast).toBeGreaterThanOrEqual(4.5);

    const darkContrast = getContrastRatio(darkBg, darkText);
    expect(darkContrast).toBeGreaterThanOrEqual(4.5);
  });
});
