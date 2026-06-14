import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../order/entities/order.entity';

export class OrderStatusCount {
  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty()
  count: number;

  @ApiProperty()
  percentage: number;
}

export class TopProduct {
  @ApiProperty()
  productId: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  salesCount: number;

  @ApiProperty()
  revenue: number;
}

export class TimePeriodSales {
  @ApiProperty()
  period: string;

  @ApiProperty()
  totalSales: number;

  @ApiProperty()
  orderCount: number;

  @ApiProperty()
  growthRate?: number;
}

export class LowStockProduct {
  @ApiProperty()
  productId: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  currentStock: number;

  @ApiProperty()
  estimatedDaysRemaining: number;
}

export class TopCustomer {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  orderCount: number;

  @ApiProperty()
  totalSpent: number;
}

export class GeographicDistribution {
  @ApiProperty()
  location: string;

  @ApiProperty()
  orderCount: number;

  @ApiProperty()
  salesAmount: number;
}

export class DashboardStatisticsDto {
  @ApiProperty()
  totalSales: number;

  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  averageTicket: number;

  @ApiProperty({ type: [OrderStatusCount] })
  ordersByStatus: OrderStatusCount[];

  @ApiProperty()
  growthRate: number;

  @ApiProperty()
  cancellationRate: number;

  @ApiProperty({ type: [TimePeriodSales] })
  salesByPeriod: TimePeriodSales[];

  @ApiProperty({ type: [TopProduct] })
  topProducts: TopProduct[];

  @ApiProperty({ type: [LowStockProduct] })
  lowStockProducts: LowStockProduct[];

  @ApiProperty({ type: [TopCustomer] })
  topCustomers: TopCustomer[];

  @ApiProperty({ type: [GeographicDistribution] })
  geographicDistribution: GeographicDistribution[];

  @ApiProperty({
    description: 'Etiqueta descriptiva del período de tiempo representado',
  })
  periodLabel: string;
}
