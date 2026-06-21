import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import {
  Order,
  OrderStatus,
  DiscountType,
  PaymentMethod,
} from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Store } from '../store/entities/store.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { Product } from '../product/entities/product.entity';
import { DeliveryZone } from '../delivery-zone/entities/delivery-zone.entity';
import { Tax } from '../tax/entities/tax.entity';
import { ProductCoreService } from '../product/modules/core/product-core.service';
import { PluginService } from '../plugins/plugin.service';
import { ConfigService as AppConfigService } from '../config/config.service';
import { CustomerService } from '../customer/customer.service';
import { PrizmaHubService } from '../prizma/prizma-hub.service';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  createMockRepository,
  createTestUser,
  createTestProduct,
  createTestOrder,
} from '../test/test-utils';

describe('OrderService - Business Logic', () => {
  let service: OrderService;
  let orderRepository: any;
  let orderItemRepository: any;
  let productRepository: any;
  let deliveryZoneRepository: any;
  let taxRepository: any;
  let pluginService: any;

  beforeEach(async () => {
    const mockOrderRepository = createMockRepository();
    const mockOrderItemRepository = createMockRepository();
    mockOrderItemRepository.query = jest.fn().mockResolvedValue([]);

    const mockProductRepository = createMockRepository();
    const mockStoreRepository = createMockRepository();
    const mockUserRepository = createMockRepository();
    const mockDeliveryZoneRepository = createMockRepository();
    const mockTaxRepository = createMockRepository();

    const mockProductCoreService = {
      calculatePrices: jest.fn().mockImplementation((product) => ({
        basePrice: product.basePrice,
        totalPrice: product.basePrice,
        taxPrice: 0,
        discountPrice: 0,
      })),
    };

    const mockPluginService = {
      emit: jest.fn(),
    };

    const mockCustomerService = {
      updateCustomerOrderStats: jest.fn(),
    };

    const mockPrizmaHub = {
      orderPaid: jest.fn().mockResolvedValue(true),
      orderPendingApproval: jest.fn().mockResolvedValue(true),
      orderApproved: jest.fn().mockResolvedValue(true),
      customerCreated: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
        { provide: getRepositoryToken(Store), useValue: mockStoreRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(DeliveryZone),
          useValue: mockDeliveryZoneRepository,
        },
        { provide: getRepositoryToken(Tax), useValue: mockTaxRepository },
        { provide: ProductCoreService, useValue: mockProductCoreService },
        { provide: PluginService, useValue: mockPluginService },
        { provide: AppConfigService, useValue: { findByStoreId: jest.fn() } },
        { provide: CustomerService, useValue: mockCustomerService },
        { provide: PrizmaHubService, useValue: mockPrizmaHub },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get(getRepositoryToken(Order));
    orderItemRepository = module.get(getRepositoryToken(OrderItem));
    productRepository = module.get(getRepositoryToken(Product));
    deliveryZoneRepository = module.get(getRepositoryToken(DeliveryZone));
    taxRepository = module.get(getRepositoryToken(Tax));
    pluginService = module.get(PluginService);
  });

  describe('updateOrder - Stock Management', () => {
    it('should restore stock when order is CANCELED', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const product = createTestProduct({ id: 101, stock: 10 });
      const orderItem = { id: 1, product, quantity: 2 };
      const order = createTestOrder({
        id: 1,
        status: OrderStatus.PENDING,
        store: { owner: user } as any,
      });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValue([orderItem]);
      productRepository.findOne.mockResolvedValue(product);
      productRepository.save.mockResolvedValue(product);

      const dto: UpdateOrderDto = { status: OrderStatus.CANCELED };
      await service.updateOrder(1, dto, user);

      expect(product.stock).toBe(12);
      expect(productRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 101, stock: 12 }),
      );
      expect(pluginService.emit).toHaveBeenCalledWith(
        'order.canceled',
        expect.anything(),
        expect.anything(),
      );
    });

    it('should NOT restore stock if already CANCELED', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({
        id: 1,
        status: OrderStatus.CANCELED,
        store: { owner: user } as any,
      });

      orderRepository.findOne.mockResolvedValue(order);
      const dto: UpdateOrderDto = { status: OrderStatus.CANCELED };
      await service.updateOrder(1, dto, user);

      expect(productRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateOrder - Access Control', () => {
    it('should throw ForbiddenException when user cannot access store', async () => {
      const user = createTestUser({ id: 'u1', role: UserRole.CUSTOMER });
      const order = createTestOrder({
        id: 1,
        store: { owner: { id: 'owner-2' } } as any,
      });

      orderRepository.findOne.mockResolvedValue(order);

      await expect(service.updateOrder(1, {}, user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateOrder - Not Found', () => {
    it('should throw NotFoundException when order does not exist', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.updateOrder(1, {}, user)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateOrder - Item Modifications', () => {
    it('should update stock when item quantity increases', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const product = createTestProduct({ id: 101, stock: 10, basePrice: 100 });
      const existingItem = {
        id: 1,
        product,
        quantity: 2,
        unitPrice: 100,
        finalPrice: 100,
      };
      const order = createTestOrder({
        id: 1,
        status: OrderStatus.PENDING,
        store: { owner: user } as any,
        items: [existingItem] as any,
      });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValueOnce([existingItem]);
      orderItemRepository.query.mockResolvedValueOnce([
        { ...existingItem, quantity: 5 },
      ]);

      productRepository.findOne.mockResolvedValue(product);
      productRepository.save.mockResolvedValue(product);

      const dto: any = {
        items: [{ id: 1, quantity: 5, product }],
      };

      await service.updateOrder(1, dto, user);

      expect(product.stock).toBe(7);
      expect(productRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 101, stock: 7 }),
      );
      expect(orderItemRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE order_item'),
        [5, 1],
      );
    });

    it('should throw error if insufficient stock on increase', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const product = createTestProduct({ id: 101, stock: 1, basePrice: 100 });
      const existingItem = { id: 1, product, quantity: 1 };
      const order = createTestOrder({
        id: 1,
        store: { owner: user } as any,
      });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValue([existingItem]);
      productRepository.findOne.mockResolvedValue(product);

      const dto: any = {
        items: [{ id: 1, quantity: 6, product }],
      };

      await expect(service.updateOrder(1, dto, user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should restore stock when item quantity decreases', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const product = createTestProduct({ id: 101, stock: 10, basePrice: 100 });
      const existingItem = { id: 1, product, quantity: 5 };
      const order = createTestOrder({ id: 1, store: { owner: user } as any });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValueOnce([existingItem]);
      orderItemRepository.query.mockResolvedValueOnce([
        { ...existingItem, quantity: 2 },
      ]);

      productRepository.findOne.mockResolvedValue(product);

      const dto: any = {
        items: [{ id: 1, quantity: 2, product }],
      };

      await service.updateOrder(1, dto, user);

      expect(product.stock).toBe(13);
      expect(productRepository.save).toHaveBeenCalled();
    });

    it('should restore stock when item is removed', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const product = createTestProduct({ id: 101, stock: 10 });
      const existingItem = { id: 1, product, quantity: 2 };
      const order = createTestOrder({ id: 1, store: { owner: user } as any });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValueOnce([existingItem]);
      orderItemRepository.query.mockResolvedValueOnce([]);

      productRepository.findOne.mockResolvedValue(product);

      const dto: UpdateOrderDto = { items: [] };

      await service.updateOrder(1, dto, user);

      expect(product.stock).toBe(12);
      expect(orderItemRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM order_item'),
        [1],
      );
    });

    it('should handle missing prices or quantities when recalculating totals', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({
        id: 1,
        store: { owner: user } as any,
        amount: { total: 0, taxTotal: 0, discountTotal: 0, delivery: 0 },
      });

      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);
      jest.spyOn(service, 'findOne').mockResolvedValue(order as any);

      orderItemRepository.query
        .mockResolvedValueOnce([{ id: 1, product: { id: 1 }, quantity: 1 }])
        .mockResolvedValueOnce([
          { finalPrice: 0, unitPrice: 50, quantity: 2 },
          { finalPrice: null, unitPrice: null, quantity: undefined },
        ]);

      const dto: UpdateOrderDto = {
        items: [{ id: 1, quantity: 1 }],
      };

      await expect(service.updateOrder(1, dto, user)).resolves.toBeDefined();
    });
  });

  describe('updateOrder - Item Additions', () => {
    it('should add new items and recalculate totals (percentage discount)', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const product = createTestProduct({ id: 101, stock: 5, basePrice: 100 });
      const order = createTestOrder({
        id: 1,
        store: { owner: user } as any,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        taxes: [{ rate: 5 } as any],
        amount: { total: 0, taxTotal: 0, discountTotal: 0, delivery: 10 },
      });

      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);
      jest.spyOn(service, 'findOne').mockResolvedValue(order as any);

      productRepository.findOne.mockResolvedValue(product);
      productRepository.save.mockResolvedValue(product);

      orderItemRepository.query
        .mockResolvedValueOnce([]) // existing items
        .mockResolvedValueOnce(undefined) // insert
        .mockResolvedValueOnce([
          { finalPrice: 100, unitPrice: 100, quantity: 2 },
        ]); // updated items

      const dto: any = {
        items: [{ id: -1, productId: 101, quantity: 2 }],
      };

      const result = await service.updateOrder(1, dto, user);

      expect(orderItemRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO order_item'),
        expect.any(Array),
      );
      expect(result.amount.total).toBeGreaterThan(0);
    });

    it('should add new items and apply fixed discount', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const product = createTestProduct({ id: 102, stock: 5, basePrice: 50 });
      const order = createTestOrder({
        id: 1,
        store: { owner: user } as any,
        discountType: DiscountType.FIXED,
        discountValue: 5,
        taxes: [{ rate: 5 } as any],
        amount: { total: 0, taxTotal: 0, discountTotal: 0, delivery: 0 },
      });

      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);
      jest.spyOn(service, 'findOne').mockResolvedValue(order as any);

      productRepository.findOne.mockResolvedValue(product);
      productRepository.save.mockResolvedValue(product);

      orderItemRepository.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([
          { finalPrice: 50, unitPrice: 50, quantity: 1 },
        ]);

      const dto: any = {
        items: [{ id: -1, productId: 102, quantity: 1 }],
      };

      const result = await service.updateOrder(1, dto, user);

      expect(result.amount.discountTotal).toBeGreaterThanOrEqual(0);
    });

    it('should wrap missing product error when new item product is missing', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({ id: 1, store: { owner: user } as any });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValueOnce([]);
      productRepository.findOne.mockResolvedValue(null);

      const dto: any = {
        items: [{ id: -1, productId: 999, quantity: 1 }],
      };

      await expect(service.updateOrder(1, dto, user)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw BadRequestException when new item has insufficient stock', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const product = createTestProduct({ id: 103, stock: 1, basePrice: 50 });
      const order = createTestOrder({ id: 1, store: { owner: user } as any });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValueOnce([]);
      productRepository.findOne.mockResolvedValue(product);

      const dto: any = {
        items: [{ id: -1, productId: 103, quantity: 5 }],
      };

      await expect(service.updateOrder(1, dto, user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException on unexpected item update errors', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({ id: 1, store: { owner: user } as any });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockRejectedValueOnce(new Error('db fail'));

      const dto: any = {
        items: [{ id: 1, quantity: 2 }],
      };

      await expect(service.updateOrder(1, dto, user)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateOrder - Field Updates', () => {
    it('should update payment fields and recalculate totals for fixed discount', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({
        id: 1,
        store: { owner: user } as any,
        taxes: [{ rate: 10 } as any],
        amount: { total: 0, taxTotal: 0, discountTotal: 0, delivery: 0 },
      });

      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);
      jest.spyOn(service, 'findOne').mockResolvedValue(order as any);

      orderItemRepository.query.mockResolvedValue([
        { unitPrice: 100, finalPrice: 90, quantity: 1 },
      ]);

      const dto: UpdateOrderDto = {
        notes: 'note',
        paymentMethod: PaymentMethod.CASH,
        creditDays: 30,
        discountType: DiscountType.FIXED,
        discountValue: 15,
        documents: ['doc.pdf'],
      };

      const result = await service.updateOrder(1, dto, user);

      expect(result.notes).toBe('note');
      expect(result.paymentMethod).toBe(PaymentMethod.CASH);
      expect(result.creditDays).toBe(30);
      expect(result.documents).toEqual(['doc.pdf']);
    });
  });

  describe('updateOrder - Discount Recalculation Errors', () => {
    it('should throw InternalServerErrorException when no items exist', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({ id: 1, store: { owner: user } as any });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValue([]);

      const dto: UpdateOrderDto = {
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
      };

      await expect(service.updateOrder(1, dto, user)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException for incomplete items', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({ id: 1, store: { owner: user } as any });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValue([
        { unitPrice: 0, finalPrice: 100, quantity: 1 },
      ]);

      const dto: UpdateOrderDto = {
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
      };

      await expect(service.updateOrder(1, dto, user)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException for invalid discount value', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({ id: 1, store: { owner: user } as any });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValue([
        { unitPrice: 100, finalPrice: 90, quantity: 1 },
      ]);

      const dto: UpdateOrderDto = {
        discountType: DiscountType.PERCENTAGE,
        discountValue: -1,
      };

      await expect(service.updateOrder(1, dto, user)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException for discount > 100%', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({ id: 1, store: { owner: user } as any });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValue([
        { unitPrice: 100, finalPrice: 90, quantity: 1 },
      ]);

      const dto: UpdateOrderDto = {
        discountType: DiscountType.PERCENTAGE,
        discountValue: 150,
      };

      await expect(service.updateOrder(1, dto, user)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateOrder - Delivery/Tax Recalculation', () => {
    it('should throw InternalServerErrorException when no items exist', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({ id: 1, store: { owner: user } as any });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValue([]);

      const dto: UpdateOrderDto = { deliveryZoneId: 1 };

      await expect(service.updateOrder(1, dto, user)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException when product is missing', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({ id: 1, store: { owner: user } as any });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValue([
        { product: { id: 1 }, quantity: 1 },
      ]);
      productRepository.find.mockResolvedValue([]);

      const dto: UpdateOrderDto = { deliveryZoneId: 1 };

      await expect(service.updateOrder(1, dto, user)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException when delivery zone is missing', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({ id: 1, store: { owner: user } as any });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValue([
        { product: { id: 1 }, quantity: 1 },
      ]);
      productRepository.find.mockResolvedValue([createTestProduct({ id: 1 })]);
      deliveryZoneRepository.findOne.mockResolvedValue(null);

      const dto: UpdateOrderDto = { deliveryZoneId: 1 };

      await expect(service.updateOrder(1, dto, user)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should use default error message when recalculation fails without message', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({ id: 1, store: { owner: user } as any });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValue([
        { product: { id: 1 }, quantity: 1 },
      ]);
      productRepository.find.mockRejectedValue({});

      const dto: UpdateOrderDto = { deliveryZoneId: 1 };

      await expect(service.updateOrder(1, dto, user)).rejects.toThrow(
        'Error al recalcular totales',
      );
    });

    it('should throw InternalServerErrorException for invalid discount value', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({
        id: 1,
        store: { owner: user } as any,
        discountType: DiscountType.PERCENTAGE,
        discountValue: -5,
      });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValue([
        { product: { id: 1 }, quantity: 1 },
      ]);
      productRepository.find.mockResolvedValue([createTestProduct({ id: 1 })]);
      deliveryZoneRepository.findOne.mockResolvedValue({
        id: 1,
        price: 10,
      });

      const dto: UpdateOrderDto = { deliveryZoneId: 1 };

      await expect(service.updateOrder(1, dto, user)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException for discount > 100%', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({
        id: 1,
        store: { owner: user } as any,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 150,
      });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValue([
        { product: { id: 1 }, quantity: 1 },
      ]);
      productRepository.find.mockResolvedValue([createTestProduct({ id: 1 })]);
      deliveryZoneRepository.findOne.mockResolvedValue({
        id: 1,
        price: 10,
      });

      const dto: UpdateOrderDto = { deliveryZoneId: 1 };

      await expect(service.updateOrder(1, dto, user)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should clear delivery zone and taxes when set to null/empty', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({
        id: 1,
        store: { owner: user } as any,
        deliveryZone: { id: 9 } as any,
        taxes: [{ id: 1, rate: 10 } as any],
        amount: { total: 0, taxTotal: 0, discountTotal: 0, delivery: 5 },
      });

      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);
      jest.spyOn(service, 'findOne').mockResolvedValue(order as any);

      orderItemRepository.query.mockResolvedValue([
        { product: { id: 1 }, quantity: 1 },
      ]);
      productRepository.find.mockResolvedValue([createTestProduct({ id: 1 })]);

      const dto: UpdateOrderDto = {
        deliveryZoneId: null,
        taxIds: [],
      };

      const result = await service.updateOrder(1, dto, user);

      expect(result.deliveryZone).toBeNull();
      expect(result.taxes).toEqual([]);
      expect(result.amount.delivery).toBe(0);
    });

    it('should apply free shipping and fixed discount', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({
        id: 1,
        store: { owner: user } as any,
        discountType: DiscountType.FIXED,
        discountValue: 5,
        amount: { total: 0, taxTotal: 0, discountTotal: 0, delivery: 0 },
      });

      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);
      jest.spyOn(service, 'findOne').mockResolvedValue(order as any);

      orderItemRepository.query.mockResolvedValue([
        { product: { id: 1 }, quantity: 1 },
      ]);
      productRepository.find.mockResolvedValue([
        createTestProduct({ id: 1, basePrice: 100 }),
      ]);
      deliveryZoneRepository.findOne.mockResolvedValue({
        id: 1,
        price: 20,
        freeShippingThreshold: 50,
      });

      const dto: UpdateOrderDto = { deliveryZoneId: 1 };

      const result = await service.updateOrder(1, dto, user);

      expect(result.amount.delivery).toBe(0);
    });

    it('should recalculate totals with delivery zone price and taxes', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({
        id: 1,
        store: { owner: user } as any,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        amount: { total: 0, taxTotal: 0, discountTotal: 0, delivery: 0 },
      });

      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);
      jest.spyOn(service, 'findOne').mockResolvedValue(order as any);

      orderItemRepository.query.mockResolvedValue([
        { product: { id: 1 }, quantity: 2 },
        { product: 2, quantity: 1 },
      ]);
      productRepository.find.mockResolvedValue([
        createTestProduct({ id: 1, basePrice: 100 }),
        createTestProduct({ id: 2, basePrice: 50 }),
      ]);
      deliveryZoneRepository.findOne.mockResolvedValue({
        id: 1,
        price: '15',
        freeShippingThreshold: 1000,
      });
      taxRepository.find.mockResolvedValue([{ id: 1, rate: 10 }]);

      const dto: UpdateOrderDto = {
        deliveryZoneId: 1,
        taxIds: [1],
      };

      const result = await service.updateOrder(1, dto, user);

      expect(result.amount.delivery).toBe(15);
      expect(result.taxes).toHaveLength(1);
    });

    it('should throw InternalServerErrorException when taxes are missing', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({ id: 1, store: { owner: user } as any });

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValue([
        { product: { id: 1 }, quantity: 1 },
      ]);
      productRepository.find.mockResolvedValue([createTestProduct({ id: 1 })]);
      taxRepository.find.mockResolvedValue([]);

      const dto: UpdateOrderDto = { taxIds: [1] };

      await expect(service.updateOrder(1, dto, user)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateOrder - Events and Errors', () => {
    it('should emit order.paid when status changes to PAID', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({
        id: 1,
        status: OrderStatus.PENDING,
        store: { owner: user } as any,
      });

      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);
      jest.spyOn(service, 'findOne').mockResolvedValue({
        ...order,
        status: OrderStatus.PAID,
      } as any);

      await service.updateOrder(1, { status: OrderStatus.PAID }, user);

      expect(pluginService.emit).toHaveBeenCalledWith(
        'order.paid',
        expect.anything(),
        expect.anything(),
      );
    });

    it('should swallow plugin emit errors', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({
        id: 1,
        status: OrderStatus.PENDING,
        store: { owner: user } as any,
      });

      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue(order);
      jest.spyOn(service, 'findOne').mockResolvedValue(order as any);
      pluginService.emit.mockImplementationOnce(() => {
        throw new Error('emit fail');
      });

      await service.updateOrder(1, { status: OrderStatus.PAID }, user);
    });

    it('should wrap unknown errors', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      orderRepository.findOne.mockRejectedValue(new Error('boom'));

      await expect(service.updateOrder(1, {}, user)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should use default message for errors without message', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      orderRepository.findOne.mockRejectedValue({});

      await expect(service.updateOrder(1, {}, user)).rejects.toThrow(
        'Error al actualizar la orden',
      );
    });
  });

  describe('updateOrder - Totals Recalculation', () => {
    it('should recalculate order totals including taxes and discounts', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      const order = createTestOrder({
        id: 1,
        store: { owner: user } as any,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        taxes: [{ id: 1, rate: 19 } as any],
        amount: { total: 0, taxTotal: 0, discountTotal: 0, delivery: 0 },
      });

      const updatedItems = [
        { product: { id: 101 }, quantity: 2, unitPrice: 100, finalPrice: 100 },
      ];

      orderRepository.findOne.mockResolvedValue(order);
      orderItemRepository.query.mockResolvedValue(updatedItems);

      const dto: UpdateOrderDto = { discountType: DiscountType.PERCENTAGE };

      const result = await service.updateOrder(1, dto, user);

      expect(result.amount.discountTotal).toBe(20);
      expect(result.amount.taxTotal).toBeCloseTo(34.2);
      expect(result.amount.total).toBeCloseTo(214.2);
    });
  });

  describe('validateOrder', () => {
    it('should calculate totals with discount, taxes, and delivery', async () => {
      const product = createTestProduct({ id: 1, basePrice: 100, stock: 10 });
      productRepository.find.mockResolvedValue([product]);

      deliveryZoneRepository.findOne.mockResolvedValue({
        id: 1,
        price: 50,
        freeShippingThreshold: 300,
      });
      taxRepository.find.mockResolvedValue([{ id: 1, rate: 10 }]);

      const dto: any = {
        items: [{ productId: 1, quantity: 2 }],
        discountType: 'percentage',
        discountValue: 10,
        deliveryZoneId: 1,
        taxIds: [1],
      };

      const result = await service.validateOrder(dto);

      expect(result.subTotal).toBe(200);
      expect(result.discountTotal).toBe(20);
      expect(result.taxTotal).toBe(18);
      expect(result.delivery).toBe(50);
      expect(result.total).toBe(248);
    });

    it('should accept items with product object', async () => {
      const product = createTestProduct({ id: 1, basePrice: 100, stock: 10 });
      productRepository.find.mockResolvedValue([product]);

      const dto: any = {
        items: [{ product: { id: 1 }, quantity: 1 }],
      };

      const result = await service.validateOrder(dto);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe(1);
    });

    it('should default quantity to 1 when missing', async () => {
      const product = createTestProduct({ id: 1, basePrice: 100, stock: 10 });
      productRepository.find.mockResolvedValue([product]);

      const dto: any = {
        items: [{ productId: 1 }],
      };

      const result = await service.validateOrder(dto);

      expect(result.items[0].quantity).toBe(1);
    });

    it('should throw BadRequestException for invalid item structure', async () => {
      const dto: any = { items: [{ quantity: 1 }] };

      await expect(service.validateOrder(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when product does not exist', async () => {
      productRepository.find.mockResolvedValue([]);

      const dto: any = { items: [{ productId: 999, quantity: 1 }] };

      await expect(service.validateOrder(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when product is missing after stock check', async () => {
      jest
        .spyOn(service as any, 'verifyAndUpdateProductStock')
        .mockResolvedValue([]);
      productRepository.find.mockResolvedValue([]);

      const dto: any = { items: [{ productId: 123, quantity: 1 }] };

      await expect(service.validateOrder(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should apply fixed discount', async () => {
      const product = createTestProduct({ id: 1, basePrice: 100, stock: 10 });
      productRepository.find.mockResolvedValue([product]);

      const dto: any = {
        items: [{ productId: 1, quantity: 1 }],
        discountType: 'fixed',
        discountValue: 15,
      };

      const result = await service.validateOrder(dto);

      expect(result.discountTotal).toBe(15);
    });

    it('should parse tax rate from string', async () => {
      const product = createTestProduct({ id: 1, basePrice: 100, stock: 10 });
      productRepository.find.mockResolvedValue([product]);
      taxRepository.find.mockResolvedValue([{ id: 1, rate: '10' }]);

      const dto: any = {
        items: [{ productId: 1, quantity: 1 }],
        taxIds: [1],
      };

      const result = await service.validateOrder(dto);

      expect(result.taxTotal).toBe(10);
    });

    it('should throw NotFoundException when delivery zone is missing', async () => {
      const product = createTestProduct({ id: 1, basePrice: 100, stock: 10 });
      productRepository.find.mockResolvedValue([product]);
      deliveryZoneRepository.findOne.mockResolvedValue(null);

      const dto: any = {
        items: [{ productId: 1, quantity: 1 }],
        deliveryZoneId: 10,
      };

      await expect(service.validateOrder(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should parse delivery price from string', async () => {
      const product = createTestProduct({ id: 1, basePrice: 100, stock: 10 });
      productRepository.find.mockResolvedValue([product]);
      deliveryZoneRepository.findOne.mockResolvedValue({ id: 1, price: '15' });

      const dto: any = {
        items: [{ productId: 1, quantity: 1 }],
        deliveryZoneId: 1,
      };

      const result = await service.validateOrder(dto);

      expect(result.delivery).toBe(15);
    });

    it('should throw NotFoundException when taxes are missing', async () => {
      const product = createTestProduct({ id: 1, basePrice: 100, stock: 10 });
      productRepository.find.mockResolvedValue([product]);
      taxRepository.find.mockResolvedValue([]);

      const dto: any = {
        items: [{ productId: 1, quantity: 1 }],
        taxIds: [1],
      };

      await expect(service.validateOrder(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should apply free shipping when threshold is met', async () => {
      const product = createTestProduct({ id: 1, basePrice: 200, stock: 10 });
      productRepository.find.mockResolvedValue([product]);
      deliveryZoneRepository.findOne.mockResolvedValue({
        id: 1,
        price: 30,
        freeShippingThreshold: 100,
      });

      const dto: any = {
        items: [{ productId: 1, quantity: 1 }],
        deliveryZoneId: 1,
      };

      const result = await service.validateOrder(dto);

      expect(result.delivery).toBe(0);
    });
  });
});
