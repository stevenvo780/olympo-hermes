import { Test, TestingModule } from '@nestjs/testing';
import { ProductCoreService } from './product-core.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../../entities/product.entity';
import { ProductCategoryOrder } from '../../entities/product-category-order.entity';
import { Store } from '@/store/entities/store.entity';
import { Tax } from '@/tax/entities/tax.entity';
import { Discount, DiscountType } from '@/discount/entities/discount.entity';
import { Category } from '@/category/entities/category.entity';
import { Order } from '@/order/entities/order.entity';
import {
  createMockRepository,
  createTestProduct,
  createTestStore,
  createTestUser,
} from '../../../test/test-utils';
import {
  ForbiddenException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

jest.mock('@/utils/permissions', () => ({
  checkStoreAccess: jest.fn(),
}));

describe('ProductCoreService', () => {
  let service: ProductCoreService;
  let productRepository: any;
  let storeRepository: any;
  let categoryRepository: any;
  let taxRepository: any;
  let discountRepository: any;
  let pcoRepository: any;

  beforeEach(async () => {
    const mockProductRepository = createMockRepository();
    const mockStoreRepository = createMockRepository();
    const mockTaxRepository = createMockRepository();
    const mockDiscountRepository = createMockRepository();
    const mockCategoryRepository = createMockRepository();
    const mockOrderRepository = createMockRepository();
    const mockPCOOrderRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCoreService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        { provide: getRepositoryToken(Store), useValue: mockStoreRepository },
        { provide: getRepositoryToken(Tax), useValue: mockTaxRepository },
        {
          provide: getRepositoryToken(Discount),
          useValue: mockDiscountRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
        {
          provide: getRepositoryToken(ProductCategoryOrder),
          useValue: mockPCOOrderRepository,
        },
      ],
    }).compile();

    service = module.get<ProductCoreService>(ProductCoreService);
    productRepository = module.get(getRepositoryToken(Product));
    storeRepository = module.get(getRepositoryToken(Store));
    categoryRepository = module.get(getRepositoryToken(Category));
    taxRepository = module.get(getRepositoryToken(Tax));
    discountRepository = module.get(getRepositoryToken(Discount));
    pcoRepository = module.get(getRepositoryToken(ProductCategoryOrder));
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const store = createTestStore();
      const user = createTestUser();
      const dto = {
        sku: 'SKU1',
        title: 'New Product',
        basePrice: 100,
        categoryIds: [1],
        taxIds: [1],
        discountIds: [1],
        parentId: 2,
      } as any;

      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      productRepository.findOne.mockResolvedValue(null); // No SKU conflict for create

      // Mock finding parent
      productRepository.findOne
        .mockResolvedValueOnce(null) // SKU check
        .mockResolvedValueOnce({ id: 2 }); // Parent check

      categoryRepository.findBy.mockResolvedValue([{ id: 1 }]);
      taxRepository.findBy.mockResolvedValue([{ id: 1 }]);
      discountRepository.findBy.mockResolvedValue([{ id: 1 }]);

      productRepository.save.mockImplementation((p) =>
        Promise.resolve({ id: 1, ...p }),
      );

      // Mock PCO
      pcoRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: 0 }),
      });
      pcoRepository.create.mockReturnValue({});
      pcoRepository.save.mockResolvedValue({});

      const result = await service.create(dto, 's1', user);

      expect(result.id).toBe(1);
      expect(productRepository.save).toHaveBeenCalled();
    });

    it('should create product without parent', async () => {
      const store = createTestStore();
      const user = createTestUser();
      const dto = {
        sku: 'SKU2',
        title: 'No Parent',
        basePrice: 50,
      } as any;

      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);
      productRepository.findOne.mockResolvedValue(null);
      productRepository.save.mockImplementation((p) =>
        Promise.resolve({ id: 2, ...p }),
      );

      const result = await service.create(dto, 's1', user);

      expect(result.parent).toBeUndefined();
      expect(result.id).toBe(2);
    });

    it('should throw ConflictException if SKU exists', async () => {
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue({});
      productRepository.findOne.mockResolvedValue({ id: 99 });

      await expect(
        service.create({ sku: 'SKU1' } as any, 's1', {} as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if parent not found', async () => {
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue({});
      productRepository.findOne
        .mockResolvedValueOnce(null) // SKU ok
        .mockResolvedValueOnce(null); // Parent missing

      await expect(
        service.create({ sku: 'S', parentId: 99 } as any, 's1', {} as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      storeRepository.findOne.mockResolvedValue({ id: 's1' });

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([
            [createTestProduct({ id: 1, basePrice: 100 })],
            1,
          ]),
      };
      productRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      // Mock loadChildrenByLevels
      const childrenQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      productRepository.createQueryBuilder
        .mockReturnValueOnce(queryBuilder)
        .mockReturnValueOnce(childrenQueryBuilder);

      pcoRepository.find.mockResolvedValue([]); // Mock orders for category

      const result = await service.findAll('s1', {
        limit: 10,
        offset: 0,
        minPrice: 10,
        maxPrice: 200,
        title: 'Test',
        category: 1,
        discount: true,
        text: 'search',
      });

      expect(result.total).toBe(1);
      expect(result.products[0].id).toBe(1);
    });

    it('should apply exist filter when requested', async () => {
      storeRepository.findOne.mockResolvedValue({ id: 's1' });

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      const childrenQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      productRepository.createQueryBuilder
        .mockReturnValueOnce(queryBuilder)
        .mockReturnValueOnce(childrenQueryBuilder);

      await service.findAll('s1', { exist: true });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(product.stock IS NULL OR product.stock > 0)',
      );
    });

    it('should throw NotFoundException if store not found', async () => {
      storeRepository.findOne.mockResolvedValue(null);
      await expect(service.findAll('s1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('internal helpers', () => {
    it('loadChildrenByLevels attaches children by parent', async () => {
      const parent = createTestProduct({ id: 1 });
      const child = createTestProduct({ id: 2, parent: parent as any });

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValueOnce([child])
          .mockResolvedValueOnce([]),
      };
      productRepository.createQueryBuilder.mockReturnValue(qb);

      await (service as any).loadChildrenByLevels([parent]);

      expect(parent.children).toEqual([child]);
    });

    it('loadChildrenByLevels stops when parentIds are empty', async () => {
      const root = createTestProduct({ id: undefined as any });
      await (service as any).loadChildrenByLevels([root], 2);
      expect(productRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('loadChildrenByLevels assigns empty children when no match', async () => {
      const parent = createTestProduct({ id: 1 });
      const unrelatedChild = createTestProduct({
        id: 2,
        parent: { id: 999 } as any,
      });

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValueOnce([unrelatedChild]),
      };
      productRepository.createQueryBuilder.mockReturnValue(qb);

      await (service as any).loadChildrenByLevels([parent], 1);

      expect(parent.children).toEqual([]);
    });

    it('attachOrderInCategory maps orderInCategory values', async () => {
      const product = createTestProduct({ id: 1 });
      pcoRepository.find.mockResolvedValue([
        { product: { id: 1 }, orderInCategory: 3 },
      ]);

      await (service as any).attachOrderInCategory([product], 5);

      expect((product as any).orderInCategory).toBe(3);
    });

    it('attachOrderInCategory returns early for empty products', async () => {
      await (service as any).attachOrderInCategory([], 5);
      expect(pcoRepository.find).not.toHaveBeenCalled();
    });

    it('attachOrderInCategory ignores invalid category id', async () => {
      const product = createTestProduct({ id: 1 });
      await (service as any).attachOrderInCategory([product], 'bad');
      expect(pcoRepository.find).not.toHaveBeenCalled();
    });

    it('attachDisplayPrice uses child prices', () => {
      const node = {
        netPrice: 10,
        children: [{ netPrice: 5 }, { netPrice: 8 }],
      };

      const result = (service as any).attachDisplayPrice(node);

      expect(result.displayPrice).toBe(5);
      expect(result.children[0].displayPrice).toBe(5);
    });

    it('attachDisplayPrice falls back when children lack displayPrice', () => {
      const node = {
        netPrice: 10,
        children: [{}, {}],
      };

      const result = (service as any).attachDisplayPrice(node);

      // Children without netPrice get displayPrice = 0, so min is 0
      expect(result.displayPrice).toBe(0);
    });

    it('attachDisplayPrice falls back to netPrice when child prices are non-numeric', () => {
      const child = {
        set displayPrice(_value: unknown) {},
        get displayPrice() {
          return 'nope';
        },
      };
      const node = {
        netPrice: 12,
        children: [child],
      };

      const result = (service as any).attachDisplayPrice(node);

      expect(result.displayPrice).toBe(12);
    });

    it('attachDisplayPrice falls back to 0 when netPrice is falsy', () => {
      const child = {
        set displayPrice(_value: unknown) {},
        get displayPrice() {
          return 'nope';
        },
      };
      const node = {
        netPrice: 0,
        children: [child],
      };

      const result = (service as any).attachDisplayPrice(node);

      expect(result.displayPrice).toBe(0);
    });

    it('attachDisplayPrice handles leaf nodes', () => {
      const node = { netPrice: 7 };
      const result = (service as any).attachDisplayPrice(node);
      expect(result.displayPrice).toBe(7);
    });

    it('calculateDisplayInfo uses first image', () => {
      const product = createTestProduct({
        images: ['img-1', 'img-2'],
        stock: 1,
      } as any);

      const info = service.calculateDisplayInfo(product as any);

      expect(info.firstImageUrl).toBe('img-1');
    });

    it('calculateDisplayInfo falls back when no images and basePrice is falsy', () => {
      const product = createTestProduct({
        images: [],
        basePrice: 0,
        stock: 0,
      } as any);

      const info = service.calculateDisplayInfo(product as any);

      expect(info.firstImageUrl).toBeNull();
      expect(info.displayPrice).toBe(0);
    });

    it('enrichProductRec recurses children', () => {
      const child = createTestProduct({ id: 2 });
      const parent = createTestProduct({ id: 1, children: [child] as any });

      const enriched = (service as any).enrichProductRec(parent);

      expect(enriched.children[0].id).toBe(2);
    });

    it('syncProductCategoryOrders removes and adds category orders', async () => {
      const product = createTestProduct({ id: 1, store: { id: 's1' } as any });
      productRepository.findOne.mockResolvedValue(product);
      pcoRepository.find.mockResolvedValue([
        { category: { id: 1 } },
        { category: { id: 2 } },
      ]);
      pcoRepository.remove.mockResolvedValue(undefined);
      categoryRepository.findOne.mockResolvedValue({ id: 3 });
      pcoRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: 0 }),
      });
      pcoRepository.create.mockReturnValue({});
      pcoRepository.save.mockResolvedValue({});

      await (service as any).syncProductCategoryOrders(1, [2, 3], 's1');

      expect(pcoRepository.remove).toHaveBeenCalled();
      expect(pcoRepository.save).toHaveBeenCalled();
    });
  });

  describe('calculatePrices', () => {
    it('should calculate prices with discount AND tax', () => {
      const product = createTestProduct({
        basePrice: 100,
        discounts: [{ type: DiscountType.PERCENTAGE, value: 10 } as any],
        taxes: [{ rate: 19 } as any],
      });
      const prices = service.calculatePrices(product);

      expect(prices.discountPrice).toBe(10);
      expect(prices.netPrice).toBe(90);
      expect(prices.taxPrice).toBeCloseTo(17.1);
      expect(prices.totalPrice).toBeCloseTo(107.1);
    });

    it('should calculate prices with fixed discount', () => {
      const product = createTestProduct({
        basePrice: 100,
        discounts: [{ type: DiscountType.FIXED, value: 20 } as any],
        taxes: [],
      });
      const prices = service.calculatePrices(product);

      expect(prices.discountPrice).toBe(20);
      expect(prices.netPrice).toBe(80);
    });
  });

  describe('findOne', () => {
    it('should return enriched product', async () => {
      const store = { id: 's1' };
      const product = createTestProduct({ id: 1, store: store as any });

      storeRepository.findOne.mockResolvedValue(store);
      productRepository.findOne.mockResolvedValue(product);

      // Mock recursion for children
      productRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findOne(1, 's1');
      expect(result.id).toBe(1);
      expect(result.totalPrice).toBeDefined();
    });

    it('should throw NotFound if store is missing', async () => {
      storeRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1, 's1')).rejects.toThrow(NotFoundException);
    });

    it('should throw Forbidden if store mismatch', async () => {
      storeRepository.findOne.mockResolvedValue({ id: 's1' });
      productRepository.findOne.mockResolvedValue({
        id: 1,
        store: { id: 'other' },
      });

      await expect(service.findOne(1, 's1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFound if product missing', async () => {
      storeRepository.findOne.mockResolvedValue({ id: 's1' });
      productRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(1, 's1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update product', async () => {
      const store = { id: 's1' };
      const product = { id: 1, store, sku: 'SKU1' };
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      productRepository.findOne.mockResolvedValue(product);
      productRepository.save.mockResolvedValue({
        ...product,
        title: 'Updated',
      });

      const result = await service.update(
        1,
        { title: 'Updated' } as any,
        's1',
        {} as any,
      );
      expect(result.title).toBe('Updated');
    });

    it('should throw NotFoundException if product is missing', async () => {
      const store = { id: 's1' };
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      productRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(1, { title: 'Updated' } as any, 's1', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when store mismatch', async () => {
      const store = { id: 's1' };
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      productRepository.findOne.mockResolvedValue({
        id: 1,
        store: { id: 'other' },
      });

      await expect(
        service.update(1, { title: 'Updated' } as any, 's1', {} as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException on SKU update to existing SKU', async () => {
      const store = { id: 's1' };
      const product = { id: 1, store, sku: 'SKU1' };
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      productRepository.findOne
        .mockResolvedValueOnce(product) // findById
        .mockResolvedValueOnce({ id: 2, sku: 'SKU2' }); // findBySku existing

      await expect(
        service.update(1, { sku: 'SKU2' } as any, 's1', {} as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequest if parent is self', async () => {
      const store = { id: 's1' };
      const product = { id: 1, store };
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);
      productRepository.findOne.mockResolvedValue(product);

      await expect(
        service.update(1, { parentId: 1 } as any, 's1', {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set new parent when parent exists', async () => {
      const store = { id: 's1' };
      const product = { id: 1, store };
      const parent = { id: 2 };
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      productRepository.findOne
        .mockResolvedValueOnce(product)
        .mockResolvedValueOnce(parent)
        .mockResolvedValueOnce({ ...product, parent });
      productRepository.save.mockResolvedValue(product);

      const result = await service.update(
        1,
        { parentId: 2 } as any,
        's1',
        {} as any,
      );

      expect(result.parent).toEqual(parent);
    });

    it('should set parent to null when parentId is null', async () => {
      const store = { id: 's1' };
      const product = { id: 1, store, parent: { id: 2 } };
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);
      productRepository.findOne.mockResolvedValue(product);
      productRepository.save.mockResolvedValue(product);

      const result = await service.update(
        1,
        { parentId: null, title: 'Updated' } as any,
        's1',
        {} as any,
      );

      expect(result.parent).toBeNull();
    });

    it('should throw NotFoundException when parent does not exist', async () => {
      const store = { id: 's1' };
      const product = { id: 1, store };
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      productRepository.findOne
        .mockResolvedValueOnce(product)
        .mockResolvedValueOnce(null);

      await expect(
        service.update(1, { parentId: 2 } as any, 's1', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update relations', async () => {
      const store = { id: 's1' };
      const product = { id: 1, store };
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);
      productRepository.findOne.mockResolvedValue(product);

      taxRepository.findBy.mockResolvedValue([]);
      discountRepository.findBy.mockResolvedValue([]);
      categoryRepository.findBy.mockResolvedValue([]);

      // syncProductCategoryOrders mock - internal calls
      // We just ensure save is called
      pcoRepository.find.mockResolvedValue([]);
      productRepository.save.mockResolvedValue(product);

      await service.update(
        1,
        { taxIds: [], discountIds: [], categoryIds: [] } as any,
        's1',
        {} as any,
      );
      expect(productRepository.save).toHaveBeenCalled();
    });

    it('should update relations when arrays have values', async () => {
      const store = { id: 's1' };
      const product = { id: 1, store };
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);
      productRepository.findOne
        .mockResolvedValueOnce(product)
        .mockResolvedValueOnce(null);

      taxRepository.findBy.mockResolvedValue([{ id: 1 }]);
      discountRepository.findBy.mockResolvedValue([{ id: 2 }]);
      categoryRepository.findBy.mockResolvedValue([{ id: 3 }]);

      const syncSpy = jest
        .spyOn(service as any, 'syncProductCategoryOrders')
        .mockResolvedValue(undefined);

      productRepository.save.mockResolvedValue(product);
      productRepository.findOne.mockResolvedValueOnce(null);

      const result = await service.update(
        1,
        { taxIds: [1], discountIds: [2], categoryIds: [3] } as any,
        's1',
        {} as any,
      );

      expect(result).toEqual(product);
      syncSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should delete product if no orders', async () => {
      const store = { id: 's1' };
      const product = createTestProduct({ id: 1, store: store as any });
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      productRepository.findOne.mockResolvedValue(product);
      productRepository.find.mockResolvedValue([]); // No children

      const orderRepo = (service as any).orderRepository;
      orderRepo.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });

      productRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1, 's1', {} as any);
      expect(productRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should disable product if it has orders', async () => {
      const store = { id: 's1' };
      const product = createTestProduct({
        id: 1,
        store: store as any,
        enabled: true,
      });
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      productRepository.findOne.mockResolvedValue(product);
      productRepository.find.mockResolvedValue([]);

      const orderRepo = (service as any).orderRepository;
      orderRepo.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1), // Has orders
      });

      productRepository.save.mockImplementation((p) => Promise.resolve(p));

      const result = (await service.remove(1, 's1', {} as any)) as Product;
      expect(result.enabled).toBe(false);
      expect(productRepository.delete).not.toHaveBeenCalled();
    });

    it('should disable children if they have orders', async () => {
      const store = { id: 's1' };
      const product = createTestProduct({ id: 1, store: store as any });
      const child = createTestProduct({ id: 2, store: store as any });

      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      productRepository.findOne.mockResolvedValue(product);
      productRepository.find.mockResolvedValue([child]);

      const orderRepo = (service as any).orderRepository;
      // First call for parent (no orders), second for child (yes orders)
      orderRepo.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(1),
      });

      await service.remove(1, 's1', {} as any);
      expect(productRepository.save).toHaveBeenCalledTimes(2); // child disabled, parent disabled
    });

    it('should throw NotFoundException if product missing', async () => {
      const store = { id: 's1' };
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      productRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(1, 's1', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if store mismatch', async () => {
      const store = { id: 's1' };
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      productRepository.findOne.mockResolvedValue({
        id: 1,
        store: { id: 'other' },
      });

      await expect(service.remove(1, 's1', {} as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when deleting children fails', async () => {
      const store = { id: 's1' };
      const product = createTestProduct({ id: 1, store: store as any });
      const child = createTestProduct({ id: 2, store: store as any });
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      productRepository.findOne.mockResolvedValue(product);
      productRepository.find.mockResolvedValue([child]);

      const orderRepo = (service as any).orderRepository;
      orderRepo.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });

      productRepository.delete.mockRejectedValueOnce(new Error('delete fail'));

      await expect(service.remove(1, 's1', {} as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException with unknown error on delete', async () => {
      const store = { id: 's1' };
      const product = createTestProduct({ id: 1, store: store as any });
      const child = createTestProduct({ id: 2, store: store as any });
      const { checkStoreAccess } = require('@/utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      productRepository.findOne.mockResolvedValue(product);
      productRepository.find.mockResolvedValue([child]);

      const orderRepo = (service as any).orderRepository;
      orderRepo.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });

      productRepository.delete.mockRejectedValueOnce('fail');

      await expect(service.remove(1, 's1', {} as any)).rejects.toThrow(
        'Unknown error',
      );
    });
  });

  describe('searchGlobal', () => {
    it('should return paginated results', async () => {
      productRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      });

      const result = await service.searchGlobal({
        query: 'test',
        limit: 10,
        offset: 0,
      });
      expect(result.total).toBe(0);
    });

    it('should map products with calculated fields', async () => {
      const product = createTestProduct({ id: 10, basePrice: 120 });
      productRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[product], 1]),
      });

      const result = await service.searchGlobal({
        query: 'test',
        limit: 10,
        offset: 0,
      });

      expect(result.products).toHaveLength(1);
      expect(result.products[0]).toHaveProperty('netPrice');
      expect(result.products[0]).toHaveProperty('displayPrice');
    });
  });

  describe('findMostPopularByStore', () => {
    it('should return popular products', async () => {
      storeRepository.findOne.mockResolvedValue({ id: 's1' });
      productRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      await service.findMostPopularByStore(1);
      expect(storeRepository.findOne).toHaveBeenCalled();
    });

    it('should map popular products with calculated fields', async () => {
      const product = createTestProduct({ id: 11, basePrice: 80 });
      storeRepository.findOne.mockResolvedValue({ id: 's1' });
      productRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([product]),
      });

      const result = await service.findMostPopularByStore(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('netPrice');
      expect(result[0]).toHaveProperty('displayPrice');
    });

    it('should throw NotFoundException if store missing', async () => {
      storeRepository.findOne.mockResolvedValue(null);

      await expect(service.findMostPopularByStore(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getMinMaxPrices', () => {
    it('should return min/max', async () => {
      storeRepository.findOne.mockResolvedValue({ id: 's1' });
      productRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest
          .fn()
          .mockResolvedValue({ minPrice: '10', maxPrice: '100' }),
      });

      const result = await service.getMinMaxPrices('s1');
      expect(result.minPrice).toBe(10);
      expect(result.maxPrice).toBe(100);
    });

    it('should fallback to 0 when values are invalid', async () => {
      storeRepository.findOne.mockResolvedValue({ id: 's1' });
      productRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest
          .fn()
          .mockResolvedValue({ minPrice: null, maxPrice: '' }),
      });

      const result = await service.getMinMaxPrices('s1');
      expect(result.minPrice).toBe(0);
      expect(result.maxPrice).toBe(0);
    });

    it('should throw NotFoundException if store missing', async () => {
      storeRepository.findOne.mockResolvedValue(null);

      await expect(service.getMinMaxPrices('s1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllProducts', () => {
    it('should return all products', async () => {
      storeRepository.findOne.mockResolvedValue({ id: 's1' });
      productRepository.find.mockResolvedValue([]);
      await service.getAllProducts('s1');
      expect(productRepository.find).toHaveBeenCalled();
    });

    it('should throw NotFoundException if store missing', async () => {
      storeRepository.findOne.mockResolvedValue(null);

      await expect(service.getAllProducts('s1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
