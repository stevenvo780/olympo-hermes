import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrderService } from './order.service';
import { Order, OrderStatus, DiscountType } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Store } from '../store/entities/store.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { Product } from '../product/entities/product.entity';
import { DeliveryZone } from '../delivery-zone/entities/delivery-zone.entity';
import { ProductCoreService } from '../product/modules/core/product-core.service';
import { PluginService } from '../plugins/plugin.service';
import { ConfigService as AppConfigService } from '../config/config.service';
import { CustomerService } from '../customer/customer.service';
import { PrizmaHubService } from '../prizma/prizma-hub.service';
import { Tax } from '../tax/entities/tax.entity';
import {
  createMockRepository,
  createTestUser,
  createTestCustomer,
  createTestStore,
  createTestOrder,
  createTestProduct,
} from '../test/test-utils';
import { CreateOrderDto } from './dto/create-order.dto';
import { PLAN_DETAILS, PlanType } from '../user/entities/subscription.entity';

// Mock permissions
jest.mock('../utils/permissions', () => ({
  checkStoreAccess: jest.fn(),
  canAccessStore: jest.fn().mockReturnValue(true),
}));

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: any;
  let storeRepository: any;
  let userRepository: any;
  let productRepository: any;
  let deliveryZoneRepository: any;
  let taxRepository: any;
  let pluginService: any;
  let orderItemRepository: any;
  let customerService: any;
  let prizmaHub: any;

  beforeEach(async () => {
    const mockOrderRepository = createMockRepository();
    mockOrderRepository.count = jest.fn();

    const mockOrderItemRepository = createMockRepository();
    mockOrderItemRepository.query = jest.fn().mockResolvedValue([]);

    const mockStoreRepository = createMockRepository<Store>();
    const mockUserRepository = createMockRepository<User>();

    const mockProductRepository = createMockRepository<Product>();
    mockProductRepository.find = jest.fn().mockResolvedValue([]);
    mockProductRepository.findOne = jest.fn();

    const mockDeliveryZoneRepository = createMockRepository<DeliveryZone>();
    const mockTaxRepository = createMockRepository<Tax>();

    const mockProductCoreService = {
      findOne: jest.fn(),
      validateProducts: jest.fn(),
      calculatePrices: jest.fn().mockImplementation((product) => {
        if (product && product.enabled === false) {
          throw new BadRequestException(
            `Producto ${product.id} está deshabilitado`,
          );
        }
        return {
          basePrice: 100,
          totalPrice: 100,
          taxPrice: 0,
          discountPrice: 0,
        };
      }),
    };

    const mockPluginService = {
      emit: jest.fn(),
    };

    const mockAppConfigService = {
      findByStoreId: jest.fn(),
    };

    const mockCustomerService = {
      findOne: jest.fn(),
      create: jest.fn(),
      findByUser: jest.fn(),
      findByStore: jest.fn(),
      findOrCreateCustomerForOrder: jest
        .fn()
        .mockResolvedValue(createTestCustomer()),
      linkUserToCustomer: jest.fn(),
      updateCustomerOrderStats: jest.fn(),
    };

    const mockPrizmaHub = {
      orderPaid: jest.fn().mockResolvedValue(true),
      orderPendingApproval: jest.fn().mockResolvedValue(true),
      orderApproved: jest.fn().mockResolvedValue(true),
      customerCreated: jest.fn().mockResolvedValue(true),
    };

    const mockDataSource = {
      transaction: jest.fn((callback) => callback({
        createQueryBuilder: jest.fn().mockReturnThis(),
        save: jest.fn().mockResolvedValue({}),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(DeliveryZone),
          useValue: mockDeliveryZoneRepository,
        },
        {
          provide: getRepositoryToken(Tax),
          useValue: mockTaxRepository,
        },
        {
          provide: ProductCoreService,
          useValue: mockProductCoreService,
        },
        {
          provide: PluginService,
          useValue: mockPluginService,
        },
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
        },
        {
          provide: CustomerService,
          useValue: mockCustomerService,
        },
        {
          provide: PrizmaHubService,
          useValue: mockPrizmaHub,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get(getRepositoryToken(Order));
    storeRepository = module.get(getRepositoryToken(Store));
    userRepository = module.get(getRepositoryToken(User));
    productRepository = module.get(getRepositoryToken(Product));
    deliveryZoneRepository = module.get(getRepositoryToken(DeliveryZone));
    taxRepository = module.get(getRepositoryToken(Tax));
    pluginService = module.get<PluginService>(PluginService);
    orderItemRepository = module.get(getRepositoryToken(OrderItem));
    customerService = module.get(CustomerService);
    prizmaHub = module.get(PrizmaHubService);
  });

  describe('createOrder', () => {
    const user = createTestUser();
    const store = createTestStore({ owner: user });
    let product: any;
    let createOrderDto: CreateOrderDto;
    let stockSpy: jest.SpyInstance;

    beforeEach(() => {
      product = {
        ...createTestProduct({ enabled: true }),
        stock: 10,
      } as any;

      createOrderDto = {
        store: { id: store.id } as Store,
        items: [
          {
            product: { id: product.id } as any,
            quantity: 2,
          },
        ],
        customAnswers: [],
      };

      stockSpy = jest
        .spyOn(service as any, 'verifyAndUpdateProductStock')
        .mockResolvedValue([{ product, newStock: product.stock - 2 }]);
    });

    it('should create an order successfully with updated stock', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);
      orderRepository.create.mockReturnValue({});
      orderRepository.save.mockResolvedValue({ id: 1 });
      orderRepository.findOne.mockResolvedValue({ id: 1, store });

      await service.createOrder(user, createOrderDto);

      expect(productRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: product.id, stock: 8 }),
      );
      expect(pluginService.emit).toHaveBeenCalledWith(
        'order.created',
        expect.anything(),
        expect.anything(),
      );
    });

    it('should create an order with anonymous customer info when no user is provided', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      productRepository.find.mockResolvedValue([product]);
      orderRepository.create.mockReturnValue({});
      orderRepository.save.mockResolvedValue({ id: 1, store });
      orderRepository.findOne.mockResolvedValue({ id: 1, store });

      const guestOrderDto = {
        ...createOrderDto,
        buyerName: 'Invitado Uno',
        buyerPhone: '3001234567',
        buyerEmail: 'guest@test.com',
        buyerDocument: 'CC123',
        shippingAddress: {
          address: 'Calle 1 #2-3',
          city: 'Bogotá',
          department: 'Cundinamarca',
          country: 'Colombia',
        },
      } as any;

      await service.createOrder(undefined, guestOrderDto);

      expect(customerService.findOrCreateCustomerForOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Invitado Uno',
          email: 'guest@test.com',
          phone: '3001234567',
          documentNumber: 'CC123',
          address: 'Calle 1 #2-3',
          city: 'Bogotá',
        }),
        store.id,
        { forceNew: false },
      );
      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: null,
          shippingAddress: guestOrderDto.shippingAddress,
          buyerName: 'Invitado Uno',
          buyerPhone: '3001234567',
        }),
      );
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      stockSpy.mockRestore();
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);

      const lowStockDto = {
        ...createOrderDto,
        items: [{ product: { id: product.id } as any, quantity: 20 }],
      };

      await expect(service.createOrder(user, lowStockDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should apply delivery zone price', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);

      const zone = { id: 1, price: 50 };
      deliveryZoneRepository.findOne.mockResolvedValue(zone);

      orderRepository.create.mockReturnValue({});
      orderRepository.save.mockResolvedValue({ id: 1 });
      orderRepository.findOne.mockResolvedValue({ id: 1, store });

      const dtoWithZone = { ...createOrderDto, deliveryZoneId: 1 };
      await service.createOrder(user, dtoWithZone);

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expect.objectContaining({ delivery: 50 }),
        }),
      );
    });

    it('should parse delivery zone price from string', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);

      const zone = { id: 1, price: '75' };
      deliveryZoneRepository.findOne.mockResolvedValue(zone);

      orderRepository.create.mockReturnValue({});
      orderRepository.save.mockResolvedValue({ id: 1 });
      orderRepository.findOne.mockResolvedValue({ id: 1, store });

      const dtoWithZone = { ...createOrderDto, deliveryZoneId: 1 };
      await service.createOrder(user, dtoWithZone);

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expect.objectContaining({ delivery: 75 }),
        }),
      );
    });

    it('should apply free shipping threshold', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);

      const zone = { id: 1, price: 50, freeShippingThreshold: 100 };
      deliveryZoneRepository.findOne.mockResolvedValue(zone);

      orderRepository.create.mockReturnValue({});
      orderRepository.save.mockResolvedValue({ id: 1 });
      orderRepository.findOne.mockResolvedValue({ id: 1, store });

      const dtoWithZone = { ...createOrderDto, deliveryZoneId: 1 };
      await service.createOrder(user, dtoWithZone);

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expect.objectContaining({ delivery: 0 }),
        }),
      );
    });

    it('should apply percentage discount to totals', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);
      orderRepository.create.mockReturnValue({});
      orderRepository.save.mockResolvedValue({ id: 1 });
      orderRepository.findOne.mockResolvedValue({ id: 1, store });

      const dtoWithDiscount = {
        ...createOrderDto,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
      };

      await service.createOrder(user, dtoWithDiscount);

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expect.objectContaining({ discountTotal: 20 }),
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
        }),
      );
    });

    it('should apply fixed discount to totals', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);
      orderRepository.create.mockReturnValue({});
      orderRepository.save.mockResolvedValue({ id: 1 });
      orderRepository.findOne.mockResolvedValue({ id: 1, store });

      const dtoWithDiscount = {
        ...createOrderDto,
        discountType: DiscountType.FIXED,
        discountValue: 25,
      };

      await service.createOrder(user, dtoWithDiscount);

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expect.objectContaining({ discountTotal: 25 }),
          discountType: DiscountType.FIXED,
          discountValue: 25,
        }),
      );
    });

    it('should calculate global taxes', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);

      const tax = { id: 1, rate: 10, store };
      taxRepository.find.mockResolvedValue([tax]);

      orderRepository.create.mockReturnValue({});
      orderRepository.save.mockResolvedValue({ id: 1 });
      orderRepository.findOne.mockResolvedValue({ id: 1, store });

      const dtoWithTax = { ...createOrderDto, taxIds: [1] };
      await service.createOrder(user, dtoWithTax);

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expect.objectContaining({ taxTotal: 20 }),
        }),
      );
    });

    it('should parse tax rate from string', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);

      const tax = { id: 1, rate: '10', store };
      taxRepository.find.mockResolvedValue([tax]);

      orderRepository.create.mockReturnValue({});
      orderRepository.save.mockResolvedValue({ id: 1 });
      orderRepository.findOne.mockResolvedValue({ id: 1, store });

      const dtoWithTax = { ...createOrderDto, taxIds: [1] };
      await service.createOrder(user, dtoWithTax);

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expect.objectContaining({ taxTotal: 20 }),
        }),
      );
    });

    it('should throw NotFoundException if store not found', async () => {
      storeRepository.findOne.mockResolvedValue(null);

      await expect(service.createOrder(user, createOrderDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if userId is invalid', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(null);

      const dtoWithUserId = { ...createOrderDto, userId: 'missing' };

      await expect(
        service.createOrder(undefined, dtoWithUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if delivery zone is missing', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);
      deliveryZoneRepository.findOne.mockResolvedValue(null);

      const dtoWithZone = { ...createOrderDto, deliveryZoneId: 123 };

      await expect(service.createOrder(user, dtoWithZone)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if taxes do not match store', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);
      taxRepository.find.mockResolvedValue([]);

      const dtoWithTax = { ...createOrderDto, taxIds: [1] };

      await expect(service.createOrder(user, dtoWithTax)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when customerId is missing', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);
      (service as any).customerService.findOne.mockResolvedValue(null);

      const dtoWithCustomer = { ...createOrderDto, customerId: 99 };

      await expect(service.createOrder(user, dtoWithCustomer)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when customer belongs to another store', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);
      (service as any).customerService.findOne.mockResolvedValue({
        id: 1,
        store: { id: 'other-store' },
      });

      const dtoWithCustomer = { ...createOrderDto, customerId: 1 };

      await expect(service.createOrder(user, dtoWithCustomer)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should swallow customer stats update errors', async () => {
      const customer = createTestCustomer({ id: 99, store });

      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);
      customerService.findOne.mockResolvedValue(customer);
      customerService.updateCustomerOrderStats.mockRejectedValue(
        new Error('stats fail'),
      );
      orderRepository.create.mockReturnValue({});
      orderRepository.save.mockResolvedValue({ id: 1 });
      orderRepository.findOne.mockResolvedValue({ id: 1, store });

      const dtoWithCustomer = { ...createOrderDto, customerId: customer.id };

      const result = await service.createOrder(user, dtoWithCustomer);

      expect(result).toBeDefined();
    });

    it('should swallow hub central emit errors', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);
      orderRepository.create.mockReturnValue({});
      orderRepository.save.mockResolvedValue({ id: 1 });
      orderRepository.findOne.mockResolvedValue({ id: 1, store });
      pluginService.emit.mockRejectedValueOnce(new Error('emit fail'));

      const result = await service.createOrder(user, createOrderDto);

      expect(result).toBeDefined();
    });

    it('should exercise console ninja fallback on emit errors', async () => {
      const originalEval = global.eval;
      (global as any).eval = () => {
        throw new Error('eval fail');
      };

      try {
        storeRepository.findOne.mockResolvedValue(store);
        userRepository.findOne.mockResolvedValue(user);
        productRepository.find.mockResolvedValue([product]);
        orderRepository.create.mockReturnValue({});
        orderRepository.save.mockResolvedValue({ id: 1 });
        orderRepository.findOne.mockResolvedValue({ id: 1, store });
        pluginService.emit.mockImplementationOnce(() => {
          throw new Error('emit fail');
        });

        await service.createOrder(user, createOrderDto);
      } finally {
        (global as any).eval = originalEval;
      }
    });

    it('should use saved order when complete order is missing', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);
      orderRepository.create.mockReturnValue({});

      const savedOrder = { id: 1, store };
      orderRepository.save.mockResolvedValue(savedOrder);
      orderRepository.findOne.mockResolvedValue(null);

      const result = await service.createOrder(user, createOrderDto);

      expect(result).toEqual(savedOrder);
      expect(pluginService.emit).toHaveBeenCalledWith(
        'order.created',
        savedOrder,
        store,
      );
    });

    it('should enforce free plan monthly order limits', async () => {
      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(user);
      productRepository.find.mockResolvedValue([product]);
      orderRepository.count.mockResolvedValue(
        PLAN_DETAILS[PlanType.FREE].monthlyOrderLimit,
      );

      await expect(service.createOrder(user, createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should enforce paid plan order limits', async () => {
      const now = new Date();
      const paidUser = {
        ...user,
        subscription: {
          planType: PlanType.BASIC,
          lastPaymentSource: {
            active: true,
            nextCharge: new Date(now.getTime() + 100000),
            frequency: 'MONTHLY',
          },
        },
      };

      storeRepository.findOne.mockResolvedValue(store);
      userRepository.findOne.mockResolvedValue(paidUser);
      productRepository.find.mockResolvedValue([product]);
      orderRepository.count.mockResolvedValue(
        PLAN_DETAILS[PlanType.BASIC].monthlyOrderLimit,
      );

      await expect(
        service.createOrder(paidUser as User, createOrderDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkOrderLimit', () => {
    it('should throw when paid plan has no payment source', async () => {
      const future = new Date(Date.now() + 100000);
      const subscription = {
        planType: PlanType.BASIC,
        _calls: 0,
        get lastPaymentSource() {
          this._calls += 1;
          return this._calls === 1
            ? { active: true, nextCharge: future, frequency: 'MONTHLY' }
            : null;
        },
      };
      const paidUser = { id: 'u1', subscription } as any;

      userRepository.findOne.mockResolvedValue(paidUser);

      await expect((service as any).checkOrderLimit('u1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use annual frequency window for paid plans', async () => {
      const future = new Date(Date.now() + 100000);
      const paidUser = {
        id: 'u2',
        subscription: {
          planType: PlanType.PRO,
          lastPaymentSource: {
            active: true,
            nextCharge: future,
            frequency: 'ANNUALLY',
          },
        },
      } as any;

      userRepository.findOne.mockResolvedValue(paidUser);
      orderRepository.count.mockResolvedValue(0);

      await expect((service as any).checkOrderLimit('u2')).resolves.toBe(
        undefined,
      );
    });
  });

  describe('updateOrder', () => {
    const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
    const store = createTestStore({ owner: user });
    const product = {
      ...createTestProduct({ id: 1, enabled: true }),
      stock: 8,
    } as any;
    const orderItem = { id: 1, product, quantity: 2, order: {} } as any;
    const order = { id: 1, store, status: OrderStatus.PENDING } as any;

    it('should restore stock when canceled', async () => {
      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockImplementation((o) => Promise.resolve(o));

      productRepository.findOne.mockResolvedValue(product);
      productRepository.save.mockResolvedValue({});
      orderItemRepository.query.mockResolvedValue([orderItem]);

      await service.updateOrder(1, { status: OrderStatus.CANCELED }, user);

      expect(productRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, stock: 10 }),
      );
      expect(pluginService.emit).toHaveBeenCalledWith(
        'order.canceled',
        expect.anything(),
        expect.anything(),
      );
    });

    it('should persist invoiceId and invoicePdfUrl fields', async () => {
      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockImplementation((o) => Promise.resolve(o));

      await service.updateOrder(
        1,
        {
          invoiceId: 'INV-001',
          invoicePdfUrl: 'https://storage.example.com/invoice-001.pdf',
        } as any,
        user,
      );

      const savedCall = orderRepository.save.mock.calls[0][0];
      expect(savedCall.invoiceId).toBe('INV-001');
      expect(savedCall.invoicePdfUrl).toBe(
        'https://storage.example.com/invoice-001.pdf',
      );
    });

    it('should reduce stock when uncancelling', async () => {
      const cancelledOrder = { ...order, status: OrderStatus.CANCELED };
      orderRepository.findOne.mockResolvedValue(cancelledOrder);
      orderRepository.save.mockImplementation((o) => Promise.resolve(o));

      productRepository.findOne.mockResolvedValue({ ...product, stock: 10 });
      productRepository.save.mockResolvedValue({});

      orderItemRepository.query.mockResolvedValue([orderItem]);

      await service.updateOrder(1, { status: OrderStatus.PENDING }, user);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when order is missing', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(123)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOrdersByStore', () => {
    it('should return filtered orders', async () => {
      const store = { id: 's1' };
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([createTestOrder()]),
      };
      orderRepository.createQueryBuilder.mockReturnValue(qb);

      const user = createTestUser();
      await service.findOrdersByStore('s1', user, {
        page: 1,
        limit: 10,
        status: OrderStatus.PAID,
      });

      expect(qb.andWhere).toHaveBeenCalledWith('order_table.status = :status', {
        status: OrderStatus.PAID,
      });
    });

    it('should throw NotFoundException when store access fails', async () => {
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(null);

      await expect(
        service.findOrdersByStore('s1', createTestUser(), {
          page: 1,
          limit: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should apply date range and search filters', async () => {
      const store = { id: 's1' };
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([createTestOrder()]),
      };
      orderRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findOrdersByStore('s1', createTestUser(), {
        page: 1,
        limit: 10,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        search: 'john 123',
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'order_table.createdAt >= :start',
        expect.any(Object),
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'order_table.createdAt <= :end',
        expect.any(Object),
      );
      expect(
        qb.andWhere.mock.calls.some(([query]) =>
          String(query).includes('LOWER(user.name)'),
        ),
      ).toBe(true);
    });
  });

  describe('findOrdersByCustomer', () => {
    it('should return paginated orders for a customer', async () => {
      const order = createTestOrder();
      orderRepository.findAndCount.mockResolvedValue([[order], 1]);

      const result = await service.findOrdersByCustomer(createTestUser(), {
        page: 2,
        limit: 5,
      });

      expect(result.total).toBe(1);
      expect(orderRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });

  describe('exportOrdersToExcel', () => {
    it('should throw NotFoundException when store access fails', async () => {
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(null);

      await expect(
        service.exportOrdersToExcel('s1', createTestUser(), {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should export orders with filters', async () => {
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue({ id: 's1' });

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            status: OrderStatus.PAID,
            user: {
              name: 'John',
              email: 'john@example.com',
              profile: { additionalPhone: '123' },
            },
            items: [
              {
                product: { title: 'Prod', sku: 'SKU1' },
                quantity: 2,
                unitPrice: 10,
              },
            ],
            amount: { total: 20, discountTotal: 0, taxTotal: 0, delivery: 0 },
            deliveryZone: { zone: 'Zone' },
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-02'),
          },
          {
            id: 2,
            status: OrderStatus.PENDING,
            user: undefined,
            items: [],
            amount: undefined,
            deliveryZone: undefined,
          },
        ]),
      };
      orderRepository.createQueryBuilder.mockReturnValue(qb);

      const buffer = await service.exportOrdersToExcel('s1', createTestUser(), {
        status: OrderStatus.PAID,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        search: 'john',
        limit: 100,
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(qb.andWhere).toHaveBeenCalledWith(
        'order_table.status = :status',
        expect.any(Object),
      );
    });

    it('should apply default limit when none is provided', async () => {
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue({ id: 's1' });

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      orderRepository.createQueryBuilder.mockReturnValue(qb);

      const buffer = await service.exportOrdersToExcel(
        's1',
        createTestUser(),
        {},
      );

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(qb.take).toHaveBeenCalledWith(20000);
    });
  });

  describe('findStoreCustomers', () => {
    it('should return customers and total count', async () => {
      customerService.findByStore.mockResolvedValue([
        createTestCustomer({ id: 1 }),
        createTestCustomer({ id: 2 }),
      ]);

      const result = await service.findStoreCustomers('s1', createTestUser(), {
        page: 1,
        limit: 10,
      });

      expect(result.total).toBe(2);
      expect(result.customers).toHaveLength(2);
    });
  });

  describe('exportCustomersToExcel', () => {
    it('should export customers to an excel buffer', async () => {
      customerService.findByStore.mockResolvedValue([
        createTestCustomer({ id: 1, name: 'Ana' }),
        createTestCustomer({
          id: 2,
          name: undefined as any,
          phone: undefined as any,
          city: undefined as any,
          address: undefined as any,
        }),
      ]);

      const buffer = await service.exportCustomersToExcel(
        's1',
        createTestUser(),
        {},
      );

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });
  });

  describe('restoreProductStock', () => {
    it('should restore stock for order items using batch load', async () => {
      const product = createTestProduct({ id: 1, stock: 5 });
      productRepository.find.mockResolvedValue([product]);
      productRepository.save.mockResolvedValue([{ ...product, stock: 7 }]);

      await (service as any).restoreProductStock({
        items: [{ product: { id: 1 }, quantity: 2 }],
      });

      expect(productRepository.find).toHaveBeenCalledWith({
        where: { id: expect.anything() },
      });
      expect(productRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ stock: 7 }),
        ]),
      );
    });

    it('should restore stock when item product is a number', async () => {
      const product = createTestProduct({ id: 2, stock: 4 });
      productRepository.find.mockResolvedValue([product]);
      productRepository.save.mockResolvedValue([{ ...product, stock: 7 }]);

      await (service as any).restoreProductStock({
        items: [{ product: 2, quantity: 3 }],
      });

      expect(productRepository.find).toHaveBeenCalledWith({
        where: { id: expect.anything() },
      });
      expect(productRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ stock: 7 }),
        ]),
      );
    });

    it('should batch load multiple products and restore stock in single save', async () => {
      const product1 = createTestProduct({ id: 1, stock: 10 });
      const product2 = createTestProduct({ id: 2, stock: 5 });
      productRepository.find.mockResolvedValue([product1, product2]);
      productRepository.save.mockResolvedValue([
        { ...product1, stock: 12 },
        { ...product2, stock: 8 },
      ]);

      await (service as any).restoreProductStock({
        items: [
          { product: { id: 1 }, quantity: 2 },
          { product: { id: 2 }, quantity: 3 },
        ],
      });

      expect(productRepository.find).toHaveBeenCalledWith({
        where: { id: expect.anything() },
      });
      expect(productRepository.save).toHaveBeenCalledTimes(1);
      const saveCall = productRepository.save.mock.calls[0][0];
      expect(saveCall).toHaveLength(2);
      expect(saveCall).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 1, stock: 12 }),
          expect.objectContaining({ id: 2, stock: 8 }),
        ]),
      );
    });

    it('should handle empty order items gracefully', async () => {
      await (service as any).restoreProductStock({ items: [] });

      expect(productRepository.find).not.toHaveBeenCalled();
      expect(productRepository.save).not.toHaveBeenCalled();
    });

    it('should skip products with null stock', async () => {
      const product = createTestProduct({ id: 1, stock: null });
      productRepository.find.mockResolvedValue([product]);

      await (service as any).restoreProductStock({
        items: [{ product: { id: 1 }, quantity: 2 }],
      });

      expect(productRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('removeOrder', () => {
    it('should throw ForbiddenException when user cannot access store', async () => {
      const { canAccessStore } = require('../utils/permissions');
      canAccessStore.mockReturnValueOnce(false);

      orderRepository.findOne.mockResolvedValue({ id: 1, store: {} });

      await expect(service.removeOrder(1, createTestUser())).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should delete order even if stock restoration fails', async () => {
      const order = createTestOrder();
      orderRepository.findOne.mockResolvedValue(order);
      jest
        .spyOn(service as any, 'restoreProductStock')
        .mockRejectedValueOnce(new Error('restore fail'));

      await service.removeOrder(1, createTestUser());

      expect(orderItemRepository.delete).toHaveBeenCalledWith({
        order: { id: 1 },
      });
      expect(orderRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});
