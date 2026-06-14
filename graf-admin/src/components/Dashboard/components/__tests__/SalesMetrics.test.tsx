/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import SalesMetrics from '../SalesMetrics';
import { OrderStatus, type DashboardStatistics } from '@/types/dashboard';

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
  };
});

vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({
    children,
    label,
  }: {
    children?: React.ReactNode;
    label?: (args: { status: string; percentage: number }) => React.ReactNode;
  }) => (
    <div>
      {typeof label === 'function' ? label({ status: 'pending', percentage: 20 }) : null}
      {children}
    </div>
  ),
  Cell: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ formatter }: { formatter?: (value: number, name: string) => unknown }) => {
    if (formatter) {
      formatter(2, 'pending');
      formatter(1, 'missing');
    }
    return <div />;
  },
  Legend: ({ formatter }: { formatter?: (value: string) => React.ReactNode }) => (
    <div>{formatter ? formatter('shipped') : null}</div>
  ),
}));

afterEach(() => {
  cleanup();
});

describe('SalesMetrics', () => {
  it('renders summary cards and status labels', () => {
    const statistics: DashboardStatistics = {
      totalSales: 1500,
      totalOrders: 10,
      averageTicket: 150,
      ordersByStatus: [
        { status: OrderStatus.PENDING, count: 2, percentage: 20 },
        { status: OrderStatus.DELIVERED, count: 5, percentage: 50 },
        { status: 'unknown' as OrderStatus, count: 1, percentage: 10 },
      ],
      growthRate: -5,
      cancellationRate: 10,
      salesByPeriod: [],
      topProducts: [],
      lowStockProducts: [],
      topCustomers: [],
      geographicDistribution: [],
    };

    render(<SalesMetrics statistics={statistics} />);

    expect(screen.getByText('Total Ventas')).toBeTruthy();
    expect(screen.getByText('Tasa Cancelación')).toBeTruthy();
    expect(screen.getByText('Pendiente: 20%')).toBeTruthy();
    expect(screen.getByText('Enviado')).toBeTruthy();
    expect(screen.getByText('Pendiente')).toBeTruthy();
    expect(screen.getByText('Entregado')).toBeTruthy();
    expect(screen.getByText('unknown')).toBeTruthy();
    expect(screen.getAllByText('50%').length).toBeGreaterThan(0);
  });

  it('renders positive growth and fallback delivered percentage', () => {
    const statistics: DashboardStatistics = {
      totalSales: 2000,
      totalOrders: 4,
      averageTicket: 500,
      ordersByStatus: [
        { status: OrderStatus.PENDING, count: 4, percentage: 100 },
      ],
      growthRate: 12,
      cancellationRate: 0,
      salesByPeriod: [],
      topProducts: [],
      lowStockProducts: [],
      topCustomers: [],
      geographicDistribution: [],
    };

    render(<SalesMetrics statistics={statistics} />);

    expect(screen.getByText('Total Ventas')).toBeTruthy();
    expect(screen.getByText('12%')).toBeTruthy();
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0);
  });
});
