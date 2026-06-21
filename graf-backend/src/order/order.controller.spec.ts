import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderStatus, DistOrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import {
  createTestUser,
  createTestOrder,
  createTestStore,
  createMockRequestWithUser,
  createMockRepository,
} from '../test/test-utils';
import { UserRole } from '../user/entities/user.entity';
import { RequestWithUser } from '../auth/types';

describe('OrderController', () => {
  let controller: OrderController;
  let orderService: any;

  beforeEach(async () => {
    const mockOrderService = {
      createOrder: jest.fn(),
      findOne: jest.fn(),
      findOrdersByCustomer: jest.fn(),
      findOrdersByStore: jest.fn(),
      findStoreCustomers: jest.fn(),
      exportCustomersToExcel: jest.fn(),
      exportOrdersToExcel: jest.fn(),
      updateOrder: jest.fn(),
      removeOrder: jest.fn(),
      validateOrder: jest.fn(),
      updateDelivery: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    orderService = module.get(OrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an order successfully', async () => {
      const user = createTestUser();
      const request = createMockRequestWithUser(user) as any;
      const createOrderDto: CreateOrderDto = {
        store: createTestStore({ id: 'store-123' }),
        items: [
          {
            product: { id: 1 } as any,
            quantity: 2,
          },
        ],
        customAnswers: [{ question: 'Nombre', answer: 'Test Customer' }],
      };

      const expectedOrder = createTestOrder();
      orderService.createOrder.mockResolvedValue(expectedOrder);

      const result = await controller.create(request, createOrderDto);

      expect(orderService.createOrder).toHaveBeenCalledWith(
        user,
        createOrderDto,
      );
      expect(result).toBe(expectedOrder);
    });

    it('should create order without authenticated user (guest)', async () => {
      const request = createMockRequestWithUser() as any;
      request.user = undefined as any;
      const createOrderDto: CreateOrderDto = {
        store: createTestStore({ id: 'store-123' }),
        items: [
          {
            product: { id: 1 } as any,
            quantity: 2,
          },
        ],
        customAnswers: [{ question: 'Nombre', answer: 'Test Customer' }],
      };

      const expectedOrder = createTestOrder();
      orderService.createOrder.mockResolvedValue(expectedOrder);

      const result = await controller.create(request, createOrderDto);

      expect(orderService.createOrder).toHaveBeenCalledWith(
        undefined,
        createOrderDto,
      );
      expect(result).toBe(expectedOrder);
    });
  });

  describe('findMyOrders', () => {
    it('should return customer orders with default pagination', async () => {
      const user = createTestUser({ role: UserRole.CUSTOMER });
      const request = createMockRequestWithUser(user) as any;
      const expectedOrders = [createTestOrder(), createTestOrder()];

      orderService.findOrdersByCustomer.mockResolvedValue(expectedOrders);

      const result = await controller.findMyOrders(request);

      expect(orderService.findOrdersByCustomer).toHaveBeenCalledWith(user, {
        page: 1,
        limit: 10,
      });
      expect(result).toBe(expectedOrders);
    });

    it('should return customer orders with custom pagination', async () => {
      const user = createTestUser({ role: UserRole.CUSTOMER });
      const request = createMockRequestWithUser(user) as any;
      const expectedOrders = [createTestOrder()];

      orderService.findOrdersByCustomer.mockResolvedValue(expectedOrders);

      const result = await controller.findMyOrders(request, '2', '5');

      expect(orderService.findOrdersByCustomer).toHaveBeenCalledWith(user, {
        page: 2,
        limit: 5,
      });
      expect(result).toBe(expectedOrders);
    });
  });

  describe('findStoreOrders', () => {
    it('should return store orders with default pagination', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const request = createMockRequestWithUser(user) as any;
      const storeId = 'store-123';
      const expectedOrders = [createTestOrder(), createTestOrder()];

      orderService.findOrdersByStore.mockResolvedValue(expectedOrders);

      const result = await controller.findStoreOrders(storeId, request);

      expect(orderService.findOrdersByStore).toHaveBeenCalledWith(
        storeId,
        user,
        {
          page: 1,
          limit: 10,
          search: undefined,
          status: undefined,
          startDate: undefined,
          endDate: undefined,
        },
      );
      expect(result).toBe(expectedOrders);
    });

    it('should return store orders with filters and custom pagination', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const request = createMockRequestWithUser(user) as any;
      const storeId = 'store-123';
      const expectedOrders = [createTestOrder()];

      orderService.findOrdersByStore.mockResolvedValue(expectedOrders);

      const result = await controller.findStoreOrders(
        storeId,
        request,
        '2',
        '20',
        'search-term',
        OrderStatus.PENDING,
        '2024-01-01',
        '2024-12-31',
      );

      expect(orderService.findOrdersByStore).toHaveBeenCalledWith(
        storeId,
        user,
        {
          page: 2,
          limit: 20,
          search: 'search-term',
          status: OrderStatus.PENDING,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
      );
      expect(result).toBe(expectedOrders);
    });
  });

  describe('findStoreCustomers', () => {
    it('should return store customers with pagination and filters', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const request = createMockRequestWithUser(user) as any;
      const storeId = 'store-123';
      const expected = { customers: [], total: 0 };

      orderService.findStoreCustomers.mockResolvedValue(expected);

      const result = await controller.findStoreCustomers(
        storeId,
        request,
        '2',
        '20',
        'john',
        '2024-01-01',
        '2024-12-31',
      );

      expect(result).toBe(expected);
      expect(orderService.findStoreCustomers).toHaveBeenCalledWith(
        storeId,
        user,
        {
          page: 2,
          limit: 20,
          search: 'john',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
      );
    });

    it('should return store customers with default pagination', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const request = createMockRequestWithUser(user) as any;
      const storeId = 'store-123';
      const expected = { customers: [], total: 0 };

      orderService.findStoreCustomers.mockResolvedValue(expected);

      const result = await controller.findStoreCustomers(storeId, request);

      expect(result).toBe(expected);
      expect(orderService.findStoreCustomers).toHaveBeenCalledWith(
        storeId,
        user,
        {
          page: 1,
          limit: 10,
          search: undefined,
          startDate: undefined,
          endDate: undefined,
        },
      );
    });
  });

  describe('exportStoreCustomers', () => {
    it('should send excel buffer with headers', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const request = createMockRequestWithUser(user) as any;
      const storeId = 'store-123';
      const res = { set: jest.fn(), send: jest.fn() } as any;
      const buffer = Buffer.from('excel');

      orderService.exportCustomersToExcel.mockResolvedValue(buffer);

      jest.useFakeTimers().setSystemTime(new Date('2024-01-02T00:00:00Z'));
      try {
        await controller.exportStoreCustomers(storeId, request, res);
      } finally {
        jest.useRealTimers();
      }

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': expect.stringContaining(
            `customers-${storeId}-2024-01-02.xlsx`,
          ),
          'Content-Length': buffer.length,
        }),
      );
      expect(res.send).toHaveBeenCalledWith(buffer);
    });

    it('should respect limit query param for customers export', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const request = createMockRequestWithUser(user) as any;
      const storeId = 'store-123';
      const res = { set: jest.fn(), send: jest.fn() } as any;
      const buffer = Buffer.from('excel');

      orderService.exportCustomersToExcel.mockResolvedValue(buffer);

      await controller.exportStoreCustomers(
        storeId,
        request,
        res,
        undefined,
        undefined,
        undefined,
        '25000',
      );

      expect(orderService.exportCustomersToExcel).toHaveBeenCalledWith(
        storeId,
        user,
        expect.objectContaining({ limit: 20000 }),
      );
    });
  });

  describe('exportStoreOrders', () => {
    it('should send excel buffer with headers', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const request = createMockRequestWithUser(user) as any;
      const storeId = 'store-123';
      const res = { set: jest.fn(), send: jest.fn() } as any;
      const buffer = Buffer.from('excel-orders');

      orderService.exportOrdersToExcel.mockResolvedValue(buffer);

      jest.useFakeTimers().setSystemTime(new Date('2024-01-02T00:00:00Z'));
      try {
        await controller.exportStoreOrders(storeId, request, res);
      } finally {
        jest.useRealTimers();
      }

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': expect.stringContaining(
            `orders-${storeId}-2024-01-02.xlsx`,
          ),
          'Content-Length': buffer.length,
        }),
      );
      expect(res.send).toHaveBeenCalledWith(buffer);
    });

    it('should respect limit query param for orders export', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const request = createMockRequestWithUser(user) as any;
      const storeId = 'store-123';
      const res = { set: jest.fn(), send: jest.fn() } as any;
      const buffer = Buffer.from('excel-orders');

      orderService.exportOrdersToExcel.mockResolvedValue(buffer);

      await controller.exportStoreOrders(
        storeId,
        request,
        res,
        undefined,
        undefined,
        undefined,
        undefined,
        '15000',
      );

      expect(orderService.exportOrdersToExcel).toHaveBeenCalledWith(
        storeId,
        user,
        expect.objectContaining({ limit: 15000 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an order by id with authorization check', async () => {
      const orderId = '123';
      const expectedOrder = createTestOrder({ id: 123 });
      const user = createTestUser();
      const mockRequest = createMockRequestWithUser(user) as RequestWithUser;

      orderService.findOne.mockResolvedValue(expectedOrder);

      const result = await controller.findOne(orderId, mockRequest);

      expect(orderService.findOne).toHaveBeenCalledWith(123, user);
      expect(result).toBe(expectedOrder);
    });
  });

  describe('updateDelivery', () => {
    it('should update delivery data successfully', async () => {
      const orderId = '123';
      const deliveryDto = { distStatus: DistOrderStatus.ROUTED, routeDate: '2024-06-01' };

      const expectedOrder = createTestOrder({
        id: 123,
        distStatus: DistOrderStatus.ROUTED,
        routeDate: '2024-06-01',
      });
      orderService.updateDelivery.mockResolvedValue(expectedOrder);

      const result = await controller.updateDelivery(orderId, deliveryDto as any);

      expect(orderService.updateDelivery).toHaveBeenCalledWith(123, deliveryDto);
      expect(result).toBe(expectedOrder);
    });
  });

  describe('update', () => {
    it('should update an order successfully', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const request = createMockRequestWithUser(user) as any;
      const orderId = '123';
      const updateOrderDto: UpdateOrderDto = {
        status: OrderStatus.PAID,
      };

      const expectedOrder = createTestOrder({
        id: 123,
        status: OrderStatus.PAID,
      });

      orderService.updateOrder.mockResolvedValue(expectedOrder);

      const result = await controller.update(request, orderId, updateOrderDto);

      expect(orderService.updateOrder).toHaveBeenCalledWith(
        123,
        updateOrderDto,
        user,
      );
      expect(result).toBe(expectedOrder);
    });

    it('should persist invoiceId and invoicePdfUrl via updateOrder', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const request = createMockRequestWithUser(user) as any;
      const updateDto: UpdateOrderDto = {
        invoiceId: 'INV-001',
        invoicePdfUrl: 'https://storage.example.com/invoice-001.pdf',
      };

      orderService.updateOrder.mockResolvedValue(createTestOrder({ id: 123 }));

      await controller.update(request, '123', updateDto);

      expect(orderService.updateOrder).toHaveBeenCalledWith(123, updateDto, user);
    });
  });

  describe('remove', () => {
    it('should remove an order successfully', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const request = createMockRequestWithUser(user) as any;
      const orderId = '123';

      orderService.removeOrder.mockResolvedValue(undefined);

      await controller.remove(request, orderId);

      expect(orderService.removeOrder).toHaveBeenCalledWith(123, user);
    });
  });

  describe('validateOrder', () => {
    it('should validate order and return calculated prices', async () => {
      const validateOrderDto: CreateOrderDto = {
        store: createTestStore({ id: 'store-123' }),
        items: [
          {
            product: { id: 1 } as any,
            quantity: 2,
          },
        ],
        customAnswers: [{ question: 'Nombre', answer: 'Test Customer' }],
      };

      const expectedValidation = {
        items: [
          {
            product: { id: 1 } as any,
            quantity: 2,
            basePrice: 100,
            unitPrice: 100,
            finalPrice: 100,
            totalPrice: 200,
          },
        ],
      };

      orderService.validateOrder.mockResolvedValue(expectedValidation);

      const result = await controller.validateOrder(validateOrderDto);

      expect(orderService.validateOrder).toHaveBeenCalledWith(validateOrderDto);
      expect(result).toBe(expectedValidation);
    });

    it('should handle validation with delivery cost', async () => {
      const validateOrderDto: CreateOrderDto = {
        store: createTestStore({ id: 'store-123' }),
        deliveryZoneId: 123,
        items: [
          {
            product: { id: 1 } as any,
            quantity: 1,
          },
        ],
        customAnswers: [{ question: 'Nombre', answer: 'Test Customer' }],
      };

      const expectedValidation = {
        items: [
          {
            product: { id: 1 } as any,
            quantity: 1,
            basePrice: 100,
            unitPrice: 100,
            finalPrice: 100,
            totalPrice: 100,
          },
        ],
        delivery: 50,
      };

      orderService.validateOrder.mockResolvedValue(expectedValidation);

      const result = await controller.validateOrder(validateOrderDto);

      expect(orderService.validateOrder).toHaveBeenCalledWith(validateOrderDto);
      expect(result).toBe(expectedValidation);
    });
  });

  describe('parameter parsing', () => {
    it('should handle invalid numeric parameters gracefully', async () => {
      const user = createTestUser({ role: UserRole.CUSTOMER });
      const request = createMockRequestWithUser(user) as any;

      orderService.findOrdersByCustomer.mockResolvedValue([]);

      await controller.findMyOrders(request, 'invalid', 'also-invalid');

      expect(orderService.findOrdersByCustomer).toHaveBeenCalledWith(user, {
        page: NaN,
        limit: NaN,
      });
    });

    it('should parse string numbers correctly', async () => {
      const user = createTestUser({ role: UserRole.CUSTOMER });
      const request = createMockRequestWithUser(user) as any;

      orderService.findOrdersByCustomer.mockResolvedValue([]);

      await controller.findMyOrders(request, '3', '25');

      expect(orderService.findOrdersByCustomer).toHaveBeenCalledWith(user, {
        page: 3,
        limit: 25,
      });
    });
  });
});
