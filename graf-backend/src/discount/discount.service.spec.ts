import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DiscountService } from './discount.service';
import { Discount, DiscountType } from './entities/discount.entity';
import { Store } from '../store/entities/store.entity';
import { Product } from '../product/entities/product.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

jest.mock('../utils/permissions', () => ({
  checkStoreAccess: jest.fn(),
  StoreAccessType: {
    OWNER: 'OWNER',
    EMPLOYEE: 'EMPLOYEE',
  },
}));

describe('DiscountService', () => {
  let service: DiscountService;

  const mockDiscountRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockProductRepository = {
    findOneBy: jest.fn(),
  };

  const mockStoreRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountService,
        {
          provide: getRepositoryToken(Discount),
          useValue: mockDiscountRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepository,
        },
      ],
    }).compile();

    service = module.get<DiscountService>(DiscountService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a discount successfully', async () => {
      const createDiscountDto: CreateDiscountDto = {
        discountType: DiscountType.PERCENTAGE,
        name: '10% Off',
        discountValue: 10,
        productId: 1,
      };
      const storeId = 'store1';
      const user = {
        id: '1',
        role: UserRole.SUPER_ADMIN,
      } as unknown as User;

      const store = {
        id: storeId,
        name: 'Test Store',
      } as unknown as Store;

      const product = {
        id: 1,
        name: 'Test Product',
      } as unknown as Product;

      const expectedDiscount = {
        id: 1,
        discountType: createDiscountDto.discountType,
        name: createDiscountDto.name,
        discountValue: createDiscountDto.discountValue,
        product,
        store,
      } as unknown as Discount;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockProductRepository.findOneBy.mockResolvedValue(product);
      mockDiscountRepository.findOne.mockResolvedValue(null);
      mockDiscountRepository.create.mockReturnValue(expectedDiscount);
      mockDiscountRepository.save.mockResolvedValue(expectedDiscount);

      const result = await service.create(createDiscountDto, storeId, user);

      expect(result).toEqual(expectedDiscount);
      expect(mockProductRepository.findOneBy).toHaveBeenCalledWith({
        id: createDiscountDto.productId,
      });
      expect(mockDiscountRepository.findOne).toHaveBeenCalledWith({
        where: { name: createDiscountDto.name, store: { id: storeId } },
      });
      expect(mockDiscountRepository.create).toHaveBeenCalledWith({
        discountType: createDiscountDto.discountType,
        name: createDiscountDto.name,
        discountValue: createDiscountDto.discountValue,
        product,
        store,
      });
      expect(mockDiscountRepository.save).toHaveBeenCalledWith(
        expectedDiscount,
      );
    });

    it('should create a discount without product', async () => {
      const createDiscountDto: CreateDiscountDto = {
        discountType: DiscountType.FIXED,
        name: '5 Dollar Off',
        discountValue: 5,
      };
      const storeId = 'store1';
      const user = {
        id: '1',
        role: UserRole.BUSINESS_OWNER,
      } as unknown as User;

      const store = { id: storeId } as unknown as Store;
      const expectedDiscount = {
        id: 1,
        ...createDiscountDto,
        product: null,
        store,
      } as unknown as Discount;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockDiscountRepository.findOne.mockResolvedValue(null);
      mockDiscountRepository.create.mockReturnValue(expectedDiscount);
      mockDiscountRepository.save.mockResolvedValue(expectedDiscount);

      const result = await service.create(createDiscountDto, storeId, user);

      expect(result).toEqual(expectedDiscount);
      expect(mockProductRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if discount name already exists', async () => {
      const createDiscountDto: CreateDiscountDto = {
        discountType: DiscountType.PERCENTAGE,
        name: '10% Off',
        discountValue: 10,
      };
      const storeId = 'store1';
      const user = {
        id: '1',
        role: UserRole.BUSINESS_OWNER,
      } as unknown as User;

      const store = { id: storeId } as unknown as Store;
      const existingDiscount = {
        id: 1,
        name: '10% Off',
      } as unknown as Discount;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockDiscountRepository.findOne.mockResolvedValue(existingDiscount);

      await expect(
        service.create(createDiscountDto, storeId, user),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getDiscountById', () => {
    it('should return a discount by id', async () => {
      const discountId = 1;
      const storeId = 'store1';

      const store = {
        id: storeId,
        name: 'Test Store',
      } as unknown as Store;

      const discount = {
        id: discountId,
        name: '10% Off',
        store,
      } as unknown as Discount;

      mockStoreRepository.findOne.mockResolvedValue(store);
      mockDiscountRepository.findOne.mockResolvedValue(discount);

      const result = await service.getDiscountById(discountId, storeId);

      expect(result).toEqual(discount);
      expect(mockStoreRepository.findOne).toHaveBeenCalledWith({
        where: { id: storeId },
        relations: ['owner'],
      });
      expect(mockDiscountRepository.findOne).toHaveBeenCalledWith({
        where: { id: discountId },
        relations: ['product', 'store'],
      });
    });

    it('should throw NotFoundException if store not found', async () => {
      const discountId = 1;
      const storeId = 'store1';

      mockStoreRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getDiscountById(discountId, storeId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if discount not found', async () => {
      const discountId = 1;
      const storeId = 'store1';

      const store = { id: storeId } as unknown as Store;

      mockStoreRepository.findOne.mockResolvedValue(store);
      mockDiscountRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getDiscountById(discountId, storeId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if discount does not belong to store', async () => {
      const discountId = 1;
      const storeId = 'store1';

      const store = { id: storeId } as unknown as Store;
      const discount = {
        id: discountId,
        store: { id: 'other-store' },
      } as unknown as Discount;

      mockStoreRepository.findOne.mockResolvedValue(store);
      mockDiscountRepository.findOne.mockResolvedValue(discount);

      await expect(
        service.getDiscountById(discountId, storeId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findByStore', () => {
    it('should return discounts for a store', async () => {
      const storeId = 'store1';
      const discounts = [
        { id: 1, name: '10% Off', discountValue: 10 },
        { id: 2, name: '5 Dollar Off', discountValue: 5 },
      ] as unknown as Discount[];

      mockDiscountRepository.find.mockResolvedValue(discounts);

      const result = await service.findByStore(storeId);

      expect(result).toEqual(discounts);
      expect(mockDiscountRepository.find).toHaveBeenCalledWith({
        where: { store: { id: storeId } },
        relations: ['product', 'store'],
      });
    });
  });

  describe('update', () => {
    it('should update a discount successfully', async () => {
      const discountId = 1;
      const storeId = 'store1';
      const updateDiscountDto: UpdateDiscountDto = {
        name: 'Updated 15% Off',
        discountValue: 15,
      };
      const user = {
        id: '1',
        role: UserRole.SUPER_ADMIN,
      } as unknown as User;

      const store = { id: storeId } as unknown as Store;
      const existingDiscount = {
        id: discountId,
        name: '10% Off',
        discountValue: 10,
        store,
      } as unknown as Discount;

      const updatedDiscount = {
        ...existingDiscount,
        ...updateDiscountDto,
      } as unknown as Discount;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockDiscountRepository.findOne
        .mockResolvedValueOnce(existingDiscount)
        .mockResolvedValueOnce(null);

      mockDiscountRepository.save.mockResolvedValue(updatedDiscount);

      const result = await service.update(
        discountId,
        updateDiscountDto,
        storeId,
        user,
      );

      expect(result).toEqual(updatedDiscount);
      expect(mockDiscountRepository.save).toHaveBeenCalledWith({
        ...existingDiscount,
        ...updateDiscountDto,
      });
    });

    it('should throw NotFoundException if discount not found', async () => {
      const discountId = 1;
      const storeId = 'store1';
      const updateDiscountDto: UpdateDiscountDto = { name: 'Updated Discount' };
      const user = {
        id: '1',
        role: UserRole.BUSINESS_OWNER,
      } as unknown as User;

      const store = { id: storeId } as unknown as Store;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockDiscountRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(discountId, updateDiscountDto, storeId, user),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if discount belongs to another store', async () => {
      const discountId = 1;
      const storeId = 'store1';
      const updateDiscountDto: UpdateDiscountDto = { name: 'Updated Discount' };
      const user = {
        id: '1',
        role: UserRole.BUSINESS_OWNER,
      } as unknown as User;

      const store = { id: storeId } as unknown as Store;
      const otherStore = { id: 'store2' } as unknown as Store;
      const existingDiscount = {
        id: discountId,
        name: 'Other',
        store: otherStore,
      } as Discount;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockDiscountRepository.findOne.mockResolvedValue(existingDiscount);

      await expect(
        service.update(discountId, updateDiscountDto, storeId, user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if new name already exists', async () => {
      const discountId = 1;
      const storeId = 'store1';
      const updateDiscountDto: UpdateDiscountDto = {
        name: 'Existing Discount',
      };
      const user = { id: '1', role: UserRole.SUPER_ADMIN } as unknown as User;

      const store = { id: storeId } as unknown as Store;
      const existingDiscount = {
        id: discountId,
        name: '10% Off',
        store,
      } as unknown as Discount;

      const conflictingDiscount = {
        id: 2,
        name: 'Existing Discount',
      } as unknown as Discount;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockDiscountRepository.findOne
        .mockResolvedValueOnce(existingDiscount)
        .mockResolvedValueOnce(conflictingDiscount);

      await expect(
        service.update(discountId, updateDiscountDto, storeId, user),
      ).rejects.toThrow(ConflictException);
    });

    it('should update product relation when productId is provided', async () => {
      const discountId = 1;
      const storeId = 'store1';
      const user = { id: '1', role: UserRole.SUPER_ADMIN } as unknown as User;
      const store = { id: storeId } as unknown as Store;
      const existingDiscount = { id: discountId, store } as Discount;
      const product = { id: 99 } as Product;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockDiscountRepository.findOne.mockResolvedValue(existingDiscount);
      mockProductRepository.findOneBy.mockResolvedValue(product);
      mockDiscountRepository.save.mockResolvedValue({
        ...existingDiscount,
        product,
      });

      const result = await service.update(
        discountId,
        { productId: 99 },
        storeId,
        user,
      );

      expect(result.product).toBe(product);
    });

    it('should update store when storeId is provided', async () => {
      const discountId = 1;
      const storeId = 'store1';
      const user = { id: '1', role: UserRole.SUPER_ADMIN } as unknown as User;
      const store = { id: storeId } as unknown as Store;
      const newStore = { id: 'store2' } as Store;
      const existingDiscount = { id: discountId, store } as Discount;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockDiscountRepository.findOne.mockResolvedValue(existingDiscount);
      mockStoreRepository.findOne.mockResolvedValue(newStore);
      mockDiscountRepository.save.mockResolvedValue({
        ...existingDiscount,
        store: newStore,
      });

      const result = await service.update(
        discountId,
        { storeId: 'store2' } as any,
        storeId,
        user,
      );

      expect(result.store).toBe(newStore);
    });

    it('should throw NotFoundException when new store is missing', async () => {
      const discountId = 1;
      const storeId = 'store1';
      const user = { id: '1', role: UserRole.SUPER_ADMIN } as unknown as User;
      const store = { id: storeId } as unknown as Store;
      const existingDiscount = { id: discountId, store } as Discount;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockDiscountRepository.findOne.mockResolvedValue(existingDiscount);
      mockStoreRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(
          discountId,
          { storeId: 'missing' } as any,
          storeId,
          user,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a discount successfully', async () => {
      const discountId = 1;
      const storeId = 'store1';
      const user = {
        id: '1',
        role: UserRole.SUPER_ADMIN,
      } as unknown as User;

      const store = { id: storeId } as unknown as Store;
      const discount = {
        id: discountId,
        name: '10% Off',
        store,
      } as unknown as Discount;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockDiscountRepository.findOne.mockResolvedValue(discount);
      mockDiscountRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(discountId, storeId, user);

      expect(mockDiscountRepository.delete).toHaveBeenCalledWith(discountId);
    });

    it('should throw NotFoundException if discount not found', async () => {
      const discountId = 1;
      const storeId = 'store1';
      const user = {
        id: '1',
        role: UserRole.BUSINESS_OWNER,
      } as unknown as User;

      const store = { id: storeId } as unknown as Store;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockDiscountRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(discountId, storeId, user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if delete affected 0 rows', async () => {
      const discountId = 1;
      const storeId = 'store1';
      const user = { id: '1', role: UserRole.SUPER_ADMIN } as unknown as User;

      const store = { id: storeId } as unknown as Store;
      const discount = {
        id: discountId,
        store,
      } as unknown as Discount;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockDiscountRepository.findOne.mockResolvedValue(discount);
      mockDiscountRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(discountId, storeId, user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if discount belongs to another store', async () => {
      const discountId = 1;
      const storeId = 'store1';
      const user = { id: '1', role: UserRole.SUPER_ADMIN } as unknown as User;

      const store = { id: storeId } as unknown as Store;
      const otherStore = { id: 'other' } as unknown as Store;
      const discount = { id: discountId, store: otherStore } as Discount;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockDiscountRepository.findOne.mockResolvedValue(discount);

      await expect(service.remove(discountId, storeId, user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
