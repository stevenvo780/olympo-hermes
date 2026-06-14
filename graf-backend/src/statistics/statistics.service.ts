import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, LessThan, MoreThanOrEqual } from 'typeorm';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { Store } from '../store/entities/store.entity';
import { Product } from '../product/entities/product.entity';
import { checkStoreAccess } from '../utils/permissions';
import {
  DashboardStatisticsDto,
  OrderStatusCount,
  TopProduct,
  TimePeriodSales,
  LowStockProduct,
  TopCustomer,
  GeographicDistribution,
} from './dto/dashboard-statistics.dto';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Store) private storeRepository: Repository<Store>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
  ) {}

  async getDashboardStatistics(
    userId: string,
    period: 'day' | 'week' | 'month' = 'month',
    startDate?: string,
    endDate?: string,
    storeId?: string,
  ): Promise<DashboardStatisticsDto> {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let storeIds: string[] = [];

    if (storeId) {
      await checkStoreAccess(this.storeRepository, storeId, user);
      storeIds = [storeId];
    } else if (user.role === UserRole.BUSINESS_OWNER) {
      const stores = await this.storeRepository.findBy({
        owner: { id: userId },
      });
      storeIds = stores.map((store) => store.id);
    }

    const whereConditions: Record<string, unknown> = {};
    const previousPeriodWhereConditions: Record<string, unknown> = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereConditions.createdAt = Between(start, end);
    } else {
      const {
        currentPeriodStart,
        currentPeriodEnd,
        previousPeriodStart,
        previousPeriodEnd,
      } = this.calculateDateRanges(period);
      whereConditions.createdAt = Between(currentPeriodStart, currentPeriodEnd);
      previousPeriodWhereConditions.createdAt = Between(
        previousPeriodStart,
        previousPeriodEnd,
      );
    }

    if (storeIds.length > 0) {
      whereConditions.store = { id: In(storeIds) };
      previousPeriodWhereConditions.store = { id: In(storeIds) };
    }

    const currentPeriodOrders = await this.orderRepository.find({
      where: whereConditions,
      relations: ['items', 'store', 'user', 'user.profile'],
    });

    let previousPeriodOrders: Order[] = [];
    if (!startDate || !endDate) {
      previousPeriodOrders = await this.orderRepository.find({
        where: previousPeriodWhereConditions,
      });
    }

    let periodLabel: string;
    const currentDate = new Date();

    if (startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      periodLabel = `${startDateObj.toLocaleDateString()} al ${endDateObj.toLocaleDateString()}`;
    } else {
      switch (period) {
        case 'day':
          periodLabel = `Hoy (${currentDate.toLocaleDateString()})`;
          break;
        case 'week':
          const weekStart = new Date(currentDate);
          weekStart.setDate(currentDate.getDate() - 6);
          periodLabel = `Últimos 7 días (${weekStart.toLocaleDateString()} - ${currentDate.toLocaleDateString()})`;
          break;
        case 'month':
          const monthStart = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1,
          );
          periodLabel = `Mes actual (${monthStart.toLocaleDateString()} - ${currentDate.toLocaleDateString()})`;
          break;
      }
    }

    const dashboardStats: DashboardStatisticsDto = {
      totalSales: this.calculateTotalSales(currentPeriodOrders),
      totalOrders: currentPeriodOrders.length,
      averageTicket: this.calculateAverageTicket(currentPeriodOrders),
      ordersByStatus: this.calculateOrdersByStatus(currentPeriodOrders),
      growthRate: this.calculateGrowthRate(
        currentPeriodOrders,
        previousPeriodOrders,
      ),
      cancellationRate: this.calculateCancellationRate(currentPeriodOrders),

      salesByPeriod: this.getSalesByPeriod(currentPeriodOrders, period),

      topProducts: this.getTopProducts(currentPeriodOrders, 5),
      lowStockProducts: await this.getLowStockProducts(storeIds),

      topCustomers: await this.getTopCustomers(storeIds, 5),
      geographicDistribution: await this.calculateGeographicDistribution(
        currentPeriodOrders,
      ),
      periodLabel: periodLabel,
    };

    return dashboardStats;
  }

  private calculateTotalSales(orders: Order[]): number {
    const validOrders = orders.filter((o) => o.status !== OrderStatus.CANCELED);
    return validOrders.reduce(
      (sum, order) => sum + Number(order.amount.total),
      0,
    );
  }

  private calculateAverageTicket(orders: Order[]): number {
    return orders.length > 0
      ? this.calculateTotalSales(orders) / orders.length
      : 0;
  }

  private calculateOrdersByStatus(orders: Order[]): OrderStatusCount[] {
    const statusCounts = Object.values(OrderStatus).map((status) => {
      const ordersWithStatus = orders.filter(
        (order) => order.status === status,
      );
      const count = ordersWithStatus.length;
      const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;

      return {
        status,
        count,
        percentage: Number(percentage.toFixed(2)),
      };
    });

    return statusCounts;
  }

  private getTopProducts(orders: Order[], limit: number): TopProduct[] {
    const productSales = new Map<
      number,
      {
        title: string;
        salesCount: number;
        revenue: number;
      }
    >();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = Number(item.product?.id);
        if (!productSales.has(productId)) {
          productSales.set(productId, {
            title: item.product?.title || 'Producto sin nombre',
            salesCount: 0,
            revenue: 0,
          });
        }

        const product = productSales.get(productId);
        const itemRevenue = Number(item.finalPrice) * item.quantity;

        product.salesCount += item.quantity;
        product.revenue += itemRevenue;

        productSales.set(productId, product);
      });
    });

    return Array.from(productSales.entries())
      .map(([productId, { title, salesCount, revenue }]) => ({
        productId,
        title,
        salesCount,
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  private getSalesByPeriod(
    orders: Order[],
    period: 'day' | 'week' | 'month',
  ): TimePeriodSales[] {
    switch (period) {
      case 'day':
        return this.calculateDailySales(orders);
      case 'week':
        return this.calculateWeeklySales(orders);
      case 'month':
        return this.calculateMonthlySales(orders);
      default:
        return this.calculateDailySales(orders);
    }
  }

  private calculateDailySales(orders: Order[]): TimePeriodSales[] {
    const dailySales = new Map<
      string,
      { totalSales: number; orderCount: number }
    >();

    orders.forEach((order) => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (!dailySales.has(dateStr)) {
        dailySales.set(dateStr, { totalSales: 0, orderCount: 0 });
      }

      const day = dailySales.get(dateStr);
      day.totalSales += Number(order.amount.total);
      day.orderCount += 1;
      dailySales.set(dateStr, day);
    });

    return Array.from(dailySales.entries())
      .map(([period, { totalSales, orderCount }]) => ({
        period,
        totalSales,
        orderCount,
        growthRate: 0,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  private calculateWeeklySales(orders: Order[]): TimePeriodSales[] {
    const weeklySales = new Map<
      string,
      { totalSales: number; orderCount: number }
    >();

    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      const year = date.getFullYear();
      const week = this.getWeekNumber(date);
      const weekStr = `${year}-W${week.toString().padStart(2, '0')}`;

      if (!weeklySales.has(weekStr)) {
        weeklySales.set(weekStr, { totalSales: 0, orderCount: 0 });
      }

      const weekData = weeklySales.get(weekStr);
      weekData.totalSales += Number(order.amount.total);
      weekData.orderCount += 1;
      weeklySales.set(weekStr, weekData);
    });

    return Array.from(weeklySales.entries())
      .map(([period, { totalSales, orderCount }]) => ({
        period,
        totalSales,
        orderCount,
        growthRate: 0,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  private calculateMonthlySales(orders: Order[]): TimePeriodSales[] {
    const monthlySales = new Map<
      string,
      { totalSales: number; orderCount: number }
    >();

    orders.forEach((order) => {
      const dateStr = order.createdAt.toISOString().slice(0, 7);
      if (!monthlySales.has(dateStr)) {
        monthlySales.set(dateStr, { totalSales: 0, orderCount: 0 });
      }

      const month = monthlySales.get(dateStr);
      month.totalSales += Number(order.amount.total);
      month.orderCount += 1;
      monthlySales.set(dateStr, month);
    });

    return Array.from(monthlySales.entries())
      .map(([period, { totalSales, orderCount }]) => ({
        period,
        totalSales,
        orderCount,
        growthRate: 0,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  private calculateCancellationRate(orders: Order[]): number {
    if (orders.length === 0) return 0;

    const canceledOrders = orders.filter(
      (order) => order.status === OrderStatus.CANCELED,
    );
    return Number(((canceledOrders.length / orders.length) * 100).toFixed(2));
  }

  private calculateGrowthRate(
    currentOrders: Order[],
    previousOrders: Order[],
  ): number {
    const currentSales = this.calculateTotalSales(currentOrders);
    const previousSales = this.calculateTotalSales(previousOrders);

    if (previousSales === 0) return currentSales > 0 ? 100 : 0;

    return Number(
      (((currentSales - previousSales) / previousSales) * 100).toFixed(2),
    );
  }

  private async getLowStockProducts(
    storeIds: string[],
  ): Promise<LowStockProduct[]> {
    const whereCondition: Record<string, unknown> = {};
    if (storeIds.length > 0) {
      whereCondition.store = { id: In(storeIds) };
    }

    whereCondition.stock = LessThan(20);
    whereCondition.stock = MoreThanOrEqual(0);

    const lowStockProducts = await this.productRepository.find({
      where: whereCondition,
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const productIds = lowStockProducts.map((p) => p.id);
    const orders = await this.orderRepository.find({
      where: {
        createdAt: MoreThanOrEqual(thirtyDaysAgo),
        store: { id: In(storeIds) },
      },
      relations: ['items'],
    });

    const recentSales = new Map<number, number>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const parsedId = Number(item.product?.id);
        if (productIds.includes(parsedId)) {
          recentSales.set(
            parsedId,
            (recentSales.get(parsedId) || 0) + item.quantity,
          );
        }
      });
    });

    const result: LowStockProduct[] = [];

    for (const product of lowStockProducts) {
      const unitsSoldRecently = recentSales.get(product.id) || 0;
      const salesVelocity = unitsSoldRecently / 30;

      result.push({
        productId: product.id,
        title: product.title,
        currentStock: product.stock,
        estimatedDaysRemaining:
          salesVelocity > 0 ? Math.round(product.stock / salesVelocity) : 9999,
      });
    }

    return result
      .sort((a, b) => a.estimatedDaysRemaining - b.estimatedDaysRemaining)
      .slice(0, 10);
  }

  private async getTopCustomers(
    storeIds: string[],
    limit: number,
  ): Promise<TopCustomer[]> {
    const orders = await this.orderRepository.find({
      where: {
        store: { id: In(storeIds) },
      },
      relations: ['user'],
    });

    const customerSales = new Map<
      string,
      {
        name: string;
        totalSpent: number;
        orderCount: number;
      }
    >();

    orders.forEach((order) => {
      if (!order.user || !order.user.id) return;

      const userId = order.user.id;
      if (!customerSales.has(userId)) {
        customerSales.set(userId, {
          name: order.user.name || 'Cliente',
          totalSpent: 0,
          orderCount: 0,
        });
      }

      const customer = customerSales.get(userId);
      customer.totalSpent += Number(order.amount.total);
      customer.orderCount += 1;

      customerSales.set(userId, customer);
    });

    return Array.from(customerSales.entries())
      .map(([userId, { name, totalSpent, orderCount }]) => ({
        userId,
        name,
        totalSpent,
        orderCount,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  private async calculateGeographicDistribution(
    orders: Order[],
  ): Promise<GeographicDistribution[]> {
    const distribution = new Map<
      string,
      {
        orderCount: number;
        salesAmount: number;
      }
    >();

    for (const order of orders) {
      let location = 'Desconocido';

      if (
        order.user &&
        order.user.profile &&
        order.user.profile.shippingAddress
      ) {
        location = order.user.profile.shippingAddress.city || 'Desconocido';
      }

      if (!distribution.has(location)) {
        distribution.set(location, {
          orderCount: 0,
          salesAmount: 0,
        });
      }

      const locationData = distribution.get(location);
      locationData.orderCount += 1;
      locationData.salesAmount += Number(order.amount.total);

      distribution.set(location, locationData);
    }

    return Array.from(distribution.entries())
      .map(([location, { orderCount, salesAmount }]) => ({
        location,
        orderCount,
        salesAmount,
      }))
      .sort((a, b) => b.salesAmount - a.salesAmount)
      .slice(0, 8);
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private calculateDateRanges(period: 'day' | 'week' | 'month') {
    const currentDate = new Date();
    let currentPeriodStart: Date;
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;
    const currentPeriodEnd = new Date(currentDate);
    currentPeriodEnd.setHours(23, 59, 59, 999);

    switch (period) {
      case 'day':
        currentPeriodStart = new Date(currentDate);
        currentPeriodStart.setHours(0, 0, 0, 0);

        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(currentPeriodStart.getDate() - 1);
        previousPeriodEnd = new Date(previousPeriodStart);
        previousPeriodEnd.setHours(23, 59, 59, 999);
        break;

      case 'week':
        currentPeriodStart = new Date(currentDate);
        currentPeriodStart.setDate(currentDate.getDate() - 6);
        currentPeriodStart.setHours(0, 0, 0, 0);

        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(currentPeriodStart.getDate() - 7);
        previousPeriodEnd = new Date(currentPeriodStart);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
        previousPeriodEnd.setHours(23, 59, 59, 999);
        break;

      case 'month':
        currentPeriodStart = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1,
        );
        currentPeriodStart.setHours(0, 0, 0, 0);

        if (currentDate.getMonth() === 0) {
          previousPeriodStart = new Date(currentDate.getFullYear() - 1, 11, 1);
          previousPeriodEnd = new Date(currentDate.getFullYear(), 0, 0);
        } else {
          previousPeriodStart = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - 1,
            1,
          );
          previousPeriodEnd = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            0,
          );
        }
        previousPeriodStart.setHours(0, 0, 0, 0);
        previousPeriodEnd.setHours(23, 59, 59, 999);
        break;
    }

    return {
      currentPeriodStart,
      currentPeriodEnd,
      previousPeriodStart,
      previousPeriodEnd,
    };
  }
}
