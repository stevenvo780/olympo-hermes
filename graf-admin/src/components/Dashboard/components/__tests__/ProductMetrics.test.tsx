/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import ProductMetrics from '../ProductMetrics';

vi.mock('react-bootstrap', () => {
  const Card = Object.assign(
    ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    {
      Body: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    }
  );

  return {
    Row: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Col: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Card,
    ProgressBar: ({
      now,
      variant,
    }: {
      now?: number;
      variant?: string;
    }) => <div data-testid="progress" data-now={now} data-variant={variant} />,
  };
});

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: ({ formatter }: { formatter?: (value: number, name: string) => unknown }) => {
    if (formatter) {
      formatter(1000, 'Ingresos');
      formatter(5, 'Unidades Vendidas');
    }
    return <div />;
  },
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

afterEach(() => {
  cleanup();
});

describe('ProductMetrics', () => {
  it('shows empty low-stock state', () => {
    render(
      <ProductMetrics
        topProducts={[
          {
            productId: 1,
            title: 'Producto Demo',
            salesCount: 10,
            revenue: 1000,
          },
          {
            productId: 2,
            title: 'Producto Sin Ventas',
            salesCount: 0,
            revenue: 0,
          },
          {
            productId: 3,
            title: 'Producto con un titulo demasiado largo para la tabla',
            salesCount: 5,
            revenue: 500,
          },
        ]}
        lowStockProducts={[]}
      />
    );

    expect(screen.getByText('No hay productos con bajo stock')).toBeTruthy();
    expect(screen.getByText('Producto Demo')).toBeTruthy();
  });

  it('renders gracefully with empty top products', () => {
    render(
      <ProductMetrics
        topProducts={[]}
        lowStockProducts={[]}
      />
    );
    expect(screen.getByText('Productos Más Vendidos')).toBeTruthy();
  });

  it('renders low-stock badges and progress values', () => {
    render(
      <ProductMetrics
        topProducts={[
          {
            productId: 1,
            title: 'Producto Demo',
            salesCount: 10,
            revenue: 1000,
          },
        ]}
        lowStockProducts={[
          {
            productId: 10,
            title: 'Sin Ventas',
            currentStock: 5,
            estimatedDaysRemaining: 9999,
          },
          {
            productId: 11,
            title: 'Stock Critico',
            currentStock: 10,
            estimatedDaysRemaining: 5,
          },
          {
            productId: 12,
            title: 'Stock Medio',
            currentStock: 8,
            estimatedDaysRemaining: 10,
          },
          {
            productId: 13,
            title: 'Stock Alto',
            currentStock: 15,
            estimatedDaysRemaining: 20,
          },
        ]}
      />
    );

    expect(screen.getByText('Sin ventas')).toBeTruthy();
    expect(screen.getByText('5 días')).toBeTruthy();
    const progressBars = screen.getAllByTestId('progress');
    expect(progressBars[1]?.getAttribute('data-now')).toBe('50');
    expect(progressBars[1]?.getAttribute('data-variant')).toBe('danger');
  });
});
