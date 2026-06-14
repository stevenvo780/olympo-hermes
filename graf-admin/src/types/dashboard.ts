export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELED = 'canceled',
}

export interface OrderStatusCount {
  status: OrderStatus;
  count: number;
  percentage: number;
}

export interface TopProduct {
  productId: number;
  title: string;
  salesCount: number;
  revenue: number;
}

export interface TimePeriodSales {
  period: string;
  totalSales: number;
  orderCount: number;
  growthRate?: number;
}

export interface LowStockProduct {
  productId: number;
  title: string;
  currentStock: number;
  estimatedDaysRemaining: number;
}

export interface TopCustomer {
  userId: string;
  name: string;
  orderCount: number;
  totalSpent: number;
}

export interface GeographicDistribution {
  location: string;
  orderCount: number;
  salesAmount: number;
}

export interface DashboardStatistics {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  ordersByStatus: OrderStatusCount[];
  growthRate: number;
  cancellationRate: number;
  salesByPeriod: TimePeriodSales[];
  topProducts: TopProduct[];
  lowStockProducts: LowStockProduct[];
  topCustomers: TopCustomer[];
  geographicDistribution: GeographicDistribution[];
}
