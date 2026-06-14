import { Test, TestingModule } from '@nestjs/testing';
import { DiscountController } from './discount.controller';
import { DiscountService } from './discount.service';
import { Discount, DiscountType } from './entities/discount.entity';
import { UserRole } from '../user/entities/user.entity';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { RequestWithUser } from '../auth/types';

describe('DiscountController', () => {
  let controller: DiscountController;
  let service: DiscountService;

  const mockDiscountService = {
    findByStore: jest.fn(),
    create: jest.fn(),
    getDiscountById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscountController],
      providers: [
        {
          provide: DiscountService,
          useValue: mockDiscountService,
        },
      ],
    })
      .overrideGuard(require('../auth/firebase-auth.guard').FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(require('../auth/roles.guard').RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<DiscountController>(DiscountController);
    service = module.get<DiscountService>(DiscountService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return discounts for a store', async () => {
      const storeId = 'store1';
      const req = {
        user: { id: '1', role: UserRole.BUSINESS_OWNER },
      } as RequestWithUser;

      const discounts = [
        {
          id: 1,
          name: '10% Off',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
        },
        {
          id: 2,
          name: '5 Dollar Off',
          discountType: DiscountType.FIXED,
          discountValue: 5,
        },
      ] as Discount[];

      mockDiscountService.findByStore.mockResolvedValue(discounts);

      const result = await controller.findAll(req, storeId);

      expect(result).toEqual(discounts);
      expect(service.findByStore).toHaveBeenCalledWith(storeId);
    });
  });

  describe('create', () => {
    it('should create a discount', async () => {
      const storeId = 'store1';
      const createDiscountDto: CreateDiscountDto = {
        discountType: DiscountType.PERCENTAGE,
        name: '10% Off',
        discountValue: 10,
        productId: 1,
      };
      const req = {
        user: { id: '1', role: UserRole.SUPER_ADMIN },
      } as RequestWithUser;

      const createdDiscount = {
        id: 1,
        ...createDiscountDto,
        product: { id: 1, name: 'Test Product' },
        store: { id: storeId },
      } as unknown as Discount;

      mockDiscountService.create.mockResolvedValue(createdDiscount);

      const result = await controller.create(req, storeId, createDiscountDto);

      expect(result).toEqual(createdDiscount);
      expect(service.create).toHaveBeenCalledWith(
        createDiscountDto,
        storeId,
        req.user,
      );
    });
  });

  describe('findOne', () => {
    it('should return a discount by id', async () => {
      const discountId = 1;
      const storeId = 'store1';
      const req = {
        user: { id: '1', role: UserRole.BUSINESS_OWNER },
      } as RequestWithUser;

      const discount = {
        id: discountId,
        name: '10% Off',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        store: { id: storeId },
      } as unknown as Discount;

      mockDiscountService.getDiscountById.mockResolvedValue(discount);

      const result = await controller.findOne(req, discountId, storeId);

      expect(result).toEqual(discount);
      expect(service.getDiscountById).toHaveBeenCalledWith(discountId, storeId);
    });
  });

  describe('update', () => {
    it('should update a discount', async () => {
      const discountId = 1;
      const storeId = 'store1';
      const updateDiscountDto: UpdateDiscountDto = {
        name: 'Updated 15% Off',
        discountValue: 15,
      };
      const req = {
        user: { id: '1', role: UserRole.SUPER_ADMIN },
      } as RequestWithUser;

      const updatedDiscount = {
        id: discountId,
        name: 'Updated 15% Off',
        discountValue: 15,
        discountType: DiscountType.PERCENTAGE,
        store: { id: storeId },
      } as unknown as Discount;

      mockDiscountService.update.mockResolvedValue(updatedDiscount);

      const result = await controller.update(
        req,
        discountId,
        storeId,
        updateDiscountDto,
      );

      expect(result).toEqual(updatedDiscount);
      expect(service.update).toHaveBeenCalledWith(
        discountId,
        updateDiscountDto,
        storeId,
        req.user,
      );
    });
  });

  describe('remove', () => {
    it('should remove a discount', async () => {
      const discountId = 1;
      const storeId = 'store1';
      const req = {
        user: { id: '1', role: UserRole.SUPER_ADMIN },
      } as RequestWithUser;

      mockDiscountService.remove.mockResolvedValue(undefined);

      await controller.remove(req, discountId, storeId);

      expect(service.remove).toHaveBeenCalledWith(
        discountId,
        storeId,
        req.user,
      );
    });
  });
});
