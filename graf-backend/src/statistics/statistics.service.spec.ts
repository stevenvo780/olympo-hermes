import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { Store } from '../store/entities/store.entity';
import { Product } from '../product/entities/product.entity';
import { NotFoundException } from '@nestjs/common';
import {
  createMockRepository,
  createTestUser,
  createTestStore,
  createTestProduct,
  createTestOrder,
} from '../test/test-utils';

jest.mock('../utils/permissions', () => ({
  checkStoreAccess: jest.fn(),
}));

describe('StatisticsService', () => {
  let service: StatisticsService;
  let orderRepository: any;
  let userRepository: any;
  let storeRepository: any;
  let productRepository: any;

  beforeEach(async () => {
    const mockOrderRepository = createMockRepository();
    const mockUserRepository = createMockRepository();
    const mockStoreRepository = createMockRepository();
    const mockProductRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Store), useValue: mockStoreRepository },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
    orderRepository = module.get(getRepositoryToken(Order));
    userRepository = module.get(getRepositoryToken(User));
    storeRepository = module.get(getRepositoryToken(Store));
    productRepository = module.get(getRepositoryToken(Product));
  });

  describe('getDashboardStatistics', () => {
    it('should return aggregated stats for a month', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const store = createTestStore({ id: 's1', owner: user });

      userRepository.findOneBy.mockResolvedValue(user);
      storeRepository.findBy.mockResolvedValue([store]);

      const orders = [
        createTestOrder({
          id: 1,
          status: OrderStatus.PAID,
          amount: { total: 100 } as any,
          createdAt: new Date(),
          items: [
            {
              product: { id: 1, title: 'P1' },
              quantity: 1,
              finalPrice: 100,
            } as any,
          ],
        }),
        createTestOrder({
          id: 2,
          status: OrderStatus.CANCELED,
          amount: { total: 50 } as any,
          createdAt: new Date(),
          items: [
            {
              product: { id: 2, title: 'P2' },
              quantity: 1,
              finalPrice: 50,
            } as any,
          ],
        }),
      ];

      orderRepository.find
        .mockResolvedValueOnce(orders) // Current period
        .mockResolvedValueOnce([]) // Previous period
        .mockResolvedValueOnce([]) // Low stock history
        .mockResolvedValueOnce([]); // Top customers

      productRepository.find.mockResolvedValue([]); // Low stock check

      const result = await service.getDashboardStatistics('u1', 'month');

      expect(result.totalSales).toBe(100); // Excludes canceled
      expect(result.totalOrders).toBe(2);
      expect(result.cancellationRate).toBe(50); // 1 out of 2
      expect(result.topProducts.length).toBe(2);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);
      await expect(service.getDashboardStatistics('u1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should calculate geographic distribution', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const store = createTestStore({ id: 's1' });

      userRepository.findOneBy.mockResolvedValue(user);
      storeRepository.findBy.mockResolvedValue([store]);

      const orderUser = createTestUser();
      orderUser.profile = { shippingAddress: { city: 'Bogota' } } as any;

      const orders = [
        createTestOrder({
          id: 1,
          user: orderUser,
          amount: { total: 100 } as any,
          createdAt: new Date(),
        }),
      ];

      orderRepository.find
        .mockResolvedValueOnce(orders)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      productRepository.find.mockResolvedValue([]);

      const result = await service.getDashboardStatistics('u1');

      expect(result.geographicDistribution[0].location).toBe('Bogota');
    });

    it('should check store access if storeId provided', async () => {
      const user = createTestUser();
      const storeId = 's1';
      const { checkStoreAccess } = require('../utils/permissions');

      userRepository.findOneBy.mockResolvedValue(user);
      orderRepository.find.mockResolvedValue([]);
      productRepository.find.mockResolvedValue([]);

      await service.getDashboardStatistics(
        'u1',
        'month',
        undefined,
        undefined,
        storeId,
      );

      expect(checkStoreAccess).toHaveBeenCalled();
    });

    it('should calculate low stock products estimation', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      userRepository.findOneBy.mockResolvedValue(user);
      storeRepository.findBy.mockResolvedValue([createTestStore()]);

      orderRepository.find.mockResolvedValue([]);

      const product = createTestProduct({ id: 1, stock: 5, title: 'LowP' });
      productRepository.find.mockResolvedValue([product]);

      const salesHistory = [
        createTestOrder({
          items: [{ product: { id: 1 }, quantity: 30 } as any],
        }),
      ];
      orderRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(salesHistory);

      const result = await service.getDashboardStatistics('u1');

      expect(result.lowStockProducts[0].estimatedDaysRemaining).toBe(5);
    });

    it('should build period label for custom date range', async () => {
      const user = createTestUser();
      userRepository.findOneBy.mockResolvedValue(user);

      orderRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      productRepository.find.mockResolvedValue([]);

      const result = await service.getDashboardStatistics(
        'u1',
        'month',
        '2024-01-01',
        '2024-01-31',
      );

      expect(result.periodLabel).toContain('al');
    });

    it('should build week period label when period is week', async () => {
      const user = createTestUser();
      userRepository.findOneBy.mockResolvedValue(user);

      orderRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      productRepository.find.mockResolvedValue([]);

      const result = await service.getDashboardStatistics('u1', 'week');

      expect(result.periodLabel.startsWith('Últimos 7 días')).toBe(true);
    });

    it('should build day period label when period is day', async () => {
      const user = createTestUser();
      userRepository.findOneBy.mockResolvedValue(user);

      orderRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      productRepository.find.mockResolvedValue([]);

      const result = await service.getDashboardStatistics('u1', 'day');

      expect(result.periodLabel.startsWith('Hoy')).toBe(true);
    });

    it('should query all orders for regular user if no store restriction', async () => {
      const user = createTestUser({ role: UserRole.CUSTOMER }); // Not business owner
      userRepository.findOneBy.mockResolvedValue(user);
      orderRepository.find.mockResolvedValue([]);
      productRepository.find.mockResolvedValue([]);

      const calcSpy = jest.spyOn(service as any, 'calculateDateRanges');

      await service.getDashboardStatistics('u1');

      // Should calculate dates
      expect(calcSpy).toHaveBeenCalled();
      // Should query orders (store handling implies global access if no storeId and no business owner logic enforced differently?
      // The logic says if storeIds empty, no store filter. So global.)
      expect(orderRepository.find).toHaveBeenCalled();
    });

    it('should not calculate default date ranges if start/end provided', async () => {
      const user = createTestUser();
      userRepository.findOneBy.mockResolvedValue(user);
      orderRepository.find.mockResolvedValue([]);
      productRepository.find.mockResolvedValue([]);

      const calcSpy = jest.spyOn(service as any, 'calculateDateRanges');

      await service.getDashboardStatistics(
        'u1',
        'month',
        '2024-01-01',
        '2024-01-31',
      );

      expect(calcSpy).not.toHaveBeenCalled();
    });
  });

  describe('helper calculations', () => {
    it('calculates total sales and average ticket excluding canceled orders', () => {
      const orders = [
        createTestOrder({
          status: OrderStatus.PAID,
          amount: { total: 100 } as any,
        }),
        createTestOrder({
          status: OrderStatus.CANCELED,
          amount: { total: 50 } as any,
        }),
      ];

      const totalSales = (service as any).calculateTotalSales(orders);
      const averageTicket = (service as any).calculateAverageTicket(orders);

      expect(totalSales).toBe(100);
      expect(averageTicket).toBe(50);
    });

    it('returns zero percentages when there are no orders', () => {
      const statusCounts = (service as any).calculateOrdersByStatus([]);

      expect(statusCounts).toHaveLength(Object.values(OrderStatus).length);
      expect(
        statusCounts.every(
          (entry: any) => entry.count === 0 && entry.percentage === 0,
        ),
      ).toBe(true);
    });

    it('aggregates top products and applies fallback title', () => {
      const orders = [
        createTestOrder({
          items: [
            {
              product: { id: 1, title: 'P1' },
              quantity: 2,
              finalPrice: 10,
            } as any,
            {
              product: { id: 2, title: 'P2' },
              quantity: 1,
              finalPrice: 50,
            } as any,
          ],
        }),
        createTestOrder({
          items: [
            {
              product: { id: 1, title: 'P1' },
              quantity: 1,
              finalPrice: 10,
            } as any,
            {
              product: { id: 3 },
              quantity: 1,
              finalPrice: 5,
            } as any,
          ],
        }),
      ];

      const topProducts = (service as any).getTopProducts(orders, 3);

      expect(topProducts[0]).toMatchObject({ productId: 2, revenue: 50 });
      expect(topProducts[1]).toMatchObject({ productId: 1, revenue: 30 });
      expect(topProducts[2].title).toBe('Producto sin nombre');
    });

    it('calculates daily and weekly sales buckets', () => {
      const orders = [
        createTestOrder({
          createdAt: new Date('2024-05-10T10:00:00Z'),
          amount: { total: 100 } as any,
        }),
        createTestOrder({
          createdAt: new Date('2024-05-10T12:00:00Z'),
          amount: { total: 50 } as any,
        }),
        createTestOrder({
          createdAt: new Date('2024-05-18T10:00:00Z'),
          amount: { total: 200 } as any,
        }),
      ];

      const daily = (service as any).calculateDailySales(orders);
      expect(daily).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            period: '2024-05-10',
            totalSales: 150,
            orderCount: 2,
          }),
          expect.objectContaining({
            period: '2024-05-18',
            totalSales: 200,
            orderCount: 1,
          }),
        ]),
      );

      const weekly = (service as any).calculateWeeklySales(orders);
      expect(weekly).toHaveLength(2);
    });

    it('calculates monthly sales buckets', () => {
      const orders = [
        createTestOrder({
          createdAt: new Date('2024-05-10T10:00:00Z'),
          amount: { total: 100 } as any,
        }),
        createTestOrder({
          createdAt: new Date('2024-06-01T10:00:00Z'),
          amount: { total: 80 } as any,
        }),
      ];

      const monthly = (service as any).calculateMonthlySales(orders);

      expect(monthly).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            period: '2024-05',
            totalSales: 100,
            orderCount: 1,
          }),
          expect.objectContaining({
            period: '2024-06',
            totalSales: 80,
            orderCount: 1,
          }),
        ]),
      );
    });

    it('falls back to daily sales when period is invalid', () => {
      const dailySpy = jest.spyOn(service as any, 'calculateDailySales');

      (service as any).getSalesByPeriod([], 'year' as any);

      expect(dailySpy).toHaveBeenCalled();
    });

    it('returns sales buckets for day and week periods', () => {
      const daySales = (service as any).getSalesByPeriod([], 'day');
      const weekSales = (service as any).getSalesByPeriod([], 'week');

      expect(daySales).toEqual([]);
      expect(weekSales).toEqual([]);
    });

    it('handles growth and cancellation edge cases', () => {
      const emptyOrders: Order[] = [];
      const currentOrders = [
        createTestOrder({
          status: OrderStatus.PAID,
          amount: { total: 100 } as any,
        }),
      ];
      const previousOrders = [
        createTestOrder({
          status: OrderStatus.PAID,
          amount: { total: 200 } as any,
        }),
      ];

      expect((service as any).calculateCancellationRate(emptyOrders)).toBe(0);
      expect(
        (service as any).calculateGrowthRate(emptyOrders, emptyOrders),
      ).toBe(0);
      expect(
        (service as any).calculateGrowthRate(currentOrders, emptyOrders),
      ).toBe(100);
      expect(
        (service as any).calculateGrowthRate(currentOrders, previousOrders),
      ).toBe(-50);
    });

    it('calculates date ranges for day, week, and month', () => {
      jest.useFakeTimers().setSystemTime(new Date(2024, 0, 15, 12));

      try {
        const dayRanges = (service as any).calculateDateRanges('day');
        expect(dayRanges.currentPeriodStart.getHours()).toBe(0);
        expect(dayRanges.currentPeriodEnd.getHours()).toBe(23);
        expect(dayRanges.previousPeriodStart.getDate()).toBe(14);

        const weekRanges = (service as any).calculateDateRanges('week');
        expect(weekRanges.currentPeriodStart.getDate()).toBe(9);
        expect(weekRanges.previousPeriodEnd.getDate()).toBe(8);

        const monthRanges = (service as any).calculateDateRanges('month');
        expect(monthRanges.previousPeriodStart.getMonth()).toBe(11);
        expect(monthRanges.previousPeriodStart.getFullYear()).toBe(2023);
      } finally {
        jest.useRealTimers();
      }
    });

    it('calculates month ranges for non-January dates', () => {
      jest.useFakeTimers().setSystemTime(new Date(2024, 4, 15, 12));

      try {
        const monthRanges = (service as any).calculateDateRanges('month');
        expect(monthRanges.previousPeriodStart.getMonth()).toBe(3);
        expect(monthRanges.previousPeriodEnd.getMonth()).toBe(3);
      } finally {
        jest.useRealTimers();
      }
    });

    it('calculates ISO week number for known date', () => {
      const weekNumber = (service as any).getWeekNumber(
        new Date(2021, 0, 4, 12),
      );

      expect(weekNumber).toBe(1);
    });

    it('calculates week number when date is Sunday', () => {
      const weekNumber = (service as any).getWeekNumber(
        new Date(Date.UTC(2024, 0, 7, 12)),
      );

      expect(weekNumber).toBeGreaterThan(0);
    });

    it('aggregates top customers by total spent', async () => {
      const userA = createTestUser({ id: 'u1', name: 'Cliente A' });
      const userB = createTestUser({ id: 'u2', name: 'Cliente B' });

      orderRepository.find.mockResolvedValue([
        createTestOrder({
          user: userA,
          amount: { total: 100 } as any,
        }),
        createTestOrder({
          user: userA,
          amount: { total: 50 } as any,
        }),
        createTestOrder({
          user: userB,
          amount: { total: 200 } as any,
        }),
      ]);

      const result = await (service as any).getTopCustomers(['s1'], 2);

      expect(result[0]).toMatchObject({
        userId: 'u2',
        totalSpent: 200,
        orderCount: 1,
      });
      expect(result[1]).toMatchObject({
        userId: 'u1',
        totalSpent: 150,
        orderCount: 2,
      });
    });

    it('skips orders without user id and defaults empty names', async () => {
      orderRepository.find.mockResolvedValue([
        createTestOrder({ amount: { total: 10 } as any }),
        createTestOrder({
          user: { id: 'u3', name: '' } as any,
          amount: { total: 20 } as any,
        }),
      ]);

      const result = await (service as any).getTopCustomers(['s1'], 2);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: 'u3',
        name: 'Cliente',
      });
    });

    it('returns unknown location when shipping data is missing', async () => {
      const userWithCity = createTestUser();
      userWithCity.profile = { shippingAddress: { city: 'Bogota' } } as any;

      const userWithoutProfile = createTestUser({ id: 'u2' });

      const result = await (service as any).calculateGeographicDistribution([
        createTestOrder({
          user: userWithCity,
          amount: { total: 100 } as any,
        }),
        createTestOrder({
          user: userWithoutProfile,
          amount: { total: 50 } as any,
        }),
      ]);

      const unknown = result.find(
        (entry: any) => entry.location === 'Desconocido',
      );

      expect(unknown?.orderCount).toBe(1);
    });

    it('falls back to unknown location when city is empty', async () => {
      const userWithEmptyCity = createTestUser();
      userWithEmptyCity.profile = { shippingAddress: { city: '' } } as any;

      const result = await (service as any).calculateGeographicDistribution([
        createTestOrder({
          user: userWithEmptyCity,
          amount: { total: 100 } as any,
        }),
      ]);

      expect(result[0]).toMatchObject({ location: 'Desconocido' });
    });

    it('returns high remaining days when no recent sales', async () => {
      const product = createTestProduct({
        id: 10,
        stock: 10,
        title: 'Low Stock',
      });

      productRepository.find.mockResolvedValue([product]);
      orderRepository.find.mockResolvedValue([]);

      const result = await (service as any).getLowStockProducts(['s1']);

      expect(result[0]).toMatchObject({
        productId: 10,
        estimatedDaysRemaining: 9999,
      });
    });

    it('sorts low stock products by remaining days', async () => {
      const p1 = createTestProduct({ id: 1, stock: 5, title: 'P1' });
      const p2 = createTestProduct({ id: 2, stock: 1, title: 'P2' });

      productRepository.find.mockResolvedValue([p1, p2]);
      orderRepository.find.mockResolvedValueOnce([
        createTestOrder({
          items: [{ product: { id: 1 }, quantity: 30 } as any],
        }),
        createTestOrder({
          items: [{ product: { id: 2 }, quantity: 30 } as any],
        }),
      ]);

      const result = await (service as any).getLowStockProducts(['s1']);

      expect(result[0].productId).toBe(2);
    });
  });
});
