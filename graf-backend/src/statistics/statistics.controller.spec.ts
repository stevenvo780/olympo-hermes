import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { DashboardStatisticsDto } from './dto/dashboard-statistics.dto';
import { OrderStatus } from '../order/entities/order.entity';
import { UserRole } from '../user/entities/user.entity';
import { RequestWithUser } from '../auth/types';

describe('StatisticsController', () => {
  let controller: StatisticsController;
  let service: StatisticsService;

  const mockStatisticsService = {
    getDashboardStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [
        {
          provide: StatisticsService,
          useValue: mockStatisticsService,
        },
      ],
    })
      .overrideGuard(require('../auth/firebase-auth.guard').FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(require('../auth/roles.guard').RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<StatisticsController>(StatisticsController);
    service = module.get<StatisticsService>(StatisticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics with default parameters', async () => {
      const req = {
        user: { id: '1', role: UserRole.SUPER_ADMIN },
      } as RequestWithUser;

      const expectedStatistics: DashboardStatisticsDto = {
        totalSales: 1500.0,
        totalOrders: 25,
        averageTicket: 60.0,
        ordersByStatus: [
          { status: OrderStatus.PENDING, count: 5, percentage: 20 },
          { status: OrderStatus.DELIVERED, count: 20, percentage: 80 },
        ],
        growthRate: 5.5,
        cancellationRate: 2.1,
        salesByPeriod: [
          { period: '2024-01', totalSales: 800.0, orderCount: 15 },
        ],
        topProducts: [
          { productId: 1, title: 'Product 1', salesCount: 50, revenue: 500.0 },
        ],
        lowStockProducts: [
          {
            productId: 1,
            title: 'Product 1',
            currentStock: 5,
            estimatedDaysRemaining: 3,
          },
        ],
        topCustomers: [
          { userId: '1', name: 'Customer 1', totalSpent: 500.0, orderCount: 5 },
        ],
        geographicDistribution: [
          { location: 'Ciudad A', orderCount: 15, salesAmount: 900.0 },
        ],
        periodLabel: 'Enero 2024',
      };

      mockStatisticsService.getDashboardStatistics.mockResolvedValue(
        expectedStatistics,
      );

      const result = await controller.getDashboardStats(req);

      expect(result).toEqual(expectedStatistics);
      expect(service.getDashboardStatistics).toHaveBeenCalledWith(
        req.user.id,
        'month',
        undefined,
        undefined,
        undefined,
      );
    });

    it('should return dashboard statistics with custom period', async () => {
      const req = {
        user: { id: '1', role: UserRole.BUSINESS_OWNER },
      } as RequestWithUser;

      const period = 'week';
      const expectedStatistics: DashboardStatisticsDto = {
        totalSales: 800.0,
        totalOrders: 15,
        averageTicket: 53.33,
        ordersByStatus: [
          { status: OrderStatus.PENDING, count: 3, percentage: 20 },
          { status: OrderStatus.DELIVERED, count: 12, percentage: 80 },
        ],
        growthRate: 3.2,
        cancellationRate: 1.5,
        salesByPeriod: [],
        topProducts: [],
        lowStockProducts: [],
        topCustomers: [],
        geographicDistribution: [],
        periodLabel: 'Semana actual',
      };

      mockStatisticsService.getDashboardStatistics.mockResolvedValue(
        expectedStatistics,
      );

      const result = await controller.getDashboardStats(req, period);

      expect(result).toEqual(expectedStatistics);
      expect(service.getDashboardStatistics).toHaveBeenCalledWith(
        req.user.id,
        period,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should return dashboard statistics with date range', async () => {
      const req = {
        user: { id: '1', role: UserRole.SUPER_ADMIN },
      } as RequestWithUser;

      const period = 'day';
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const expectedStatistics: DashboardStatisticsDto = {
        totalSales: 400.0,
        totalOrders: 8,
        averageTicket: 50.0,
        ordersByStatus: [
          { status: OrderStatus.DELIVERED, count: 8, percentage: 100 },
        ],
        growthRate: 2.1,
        cancellationRate: 0,
        salesByPeriod: [],
        topProducts: [],
        lowStockProducts: [],
        topCustomers: [],
        geographicDistribution: [],
        periodLabel: 'Enero 1-31, 2024',
      };

      mockStatisticsService.getDashboardStatistics.mockResolvedValue(
        expectedStatistics,
      );

      const result = await controller.getDashboardStats(
        req,
        period,
        startDate,
        endDate,
      );

      expect(result).toEqual(expectedStatistics);
      expect(service.getDashboardStatistics).toHaveBeenCalledWith(
        req.user.id,
        period,
        startDate,
        endDate,
        undefined,
      );
    });

    it('should return dashboard statistics for specific store', async () => {
      const req = {
        user: { id: '1', role: UserRole.BUSINESS_OWNER },
      } as RequestWithUser;

      const storeId = 'store1';
      const expectedStatistics: DashboardStatisticsDto = {
        totalSales: 300.0,
        totalOrders: 6,
        averageTicket: 50.0,
        ordersByStatus: [
          { status: OrderStatus.PENDING, count: 1, percentage: 17 },
          { status: OrderStatus.DELIVERED, count: 5, percentage: 83 },
        ],
        growthRate: 1.8,
        cancellationRate: 0.5,
        salesByPeriod: [],
        topProducts: [],
        lowStockProducts: [],
        topCustomers: [],
        geographicDistribution: [],
        periodLabel: 'Tienda específica',
      };

      mockStatisticsService.getDashboardStatistics.mockResolvedValue(
        expectedStatistics,
      );

      const result = await controller.getDashboardStats(
        req,
        'month',
        undefined,
        undefined,
        storeId,
      );

      expect(result).toEqual(expectedStatistics);
      expect(service.getDashboardStatistics).toHaveBeenCalledWith(
        req.user.id,
        'month',
        undefined,
        undefined,
        storeId,
      );
    });

    it('should return dashboard statistics with all parameters', async () => {
      const req = {
        user: { id: '1', role: UserRole.SUPER_ADMIN },
      } as RequestWithUser;

      const period = 'week';
      const startDate = '2024-02-01';
      const endDate = '2024-02-07';
      const storeId = 'store2';

      const expectedStatistics: DashboardStatisticsDto = {
        totalSales: 150.0,
        totalOrders: 3,
        averageTicket: 50.0,
        ordersByStatus: [
          { status: OrderStatus.DELIVERED, count: 3, percentage: 100 },
        ],
        growthRate: 0.5,
        cancellationRate: 0,
        salesByPeriod: [],
        topProducts: [],
        lowStockProducts: [],
        topCustomers: [],
        geographicDistribution: [],
        periodLabel: 'Febrero 1-7, 2024',
      };

      mockStatisticsService.getDashboardStatistics.mockResolvedValue(
        expectedStatistics,
      );

      const result = await controller.getDashboardStats(
        req,
        period,
        startDate,
        endDate,
        storeId,
      );

      expect(result).toEqual(expectedStatistics);
      expect(service.getDashboardStatistics).toHaveBeenCalledWith(
        req.user.id,
        period,
        startDate,
        endDate,
        storeId,
      );
    });
  });
});
