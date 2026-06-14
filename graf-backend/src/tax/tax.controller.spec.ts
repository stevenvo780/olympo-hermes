import { Test, TestingModule } from '@nestjs/testing';
import { TaxController } from './tax.controller';
import { TaxService } from './tax.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequestWithUser } from '../auth/types';
import { UserRole } from '../user/entities/user.entity';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';

describe('TaxController', () => {
  let controller: TaxController;
  let taxService: TaxService;

  const mockTaxService = {
    findByStore: jest.fn(),
    getTaxById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: UserRole.BUSINESS_OWNER,
  };

  const mockRequest: RequestWithUser = {
    user: mockUser,
  } as RequestWithUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxController],
      providers: [
        {
          provide: TaxService,
          useValue: mockTaxService,
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TaxController>(TaxController);
    taxService = module.get<TaxService>(TaxService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findMyTaxes', () => {
    it('should return taxes for the store', async () => {
      const storeId = 'store1';
      const expectedTaxes = [
        { id: 1, name: 'VAT', rate: 19 },
        { id: 2, name: 'Service Tax', rate: 10 },
      ];

      mockTaxService.findByStore.mockResolvedValue(expectedTaxes);

      const result = await controller.findMyTaxes(mockRequest, storeId);

      expect(result).toEqual(expectedTaxes);
      expect(taxService.findByStore).toHaveBeenCalledWith(storeId);
    });
  });

  describe('findOne', () => {
    it('should return a tax by id', async () => {
      const taxId = '1';
      const storeId = 'store1';
      const expectedTax = {
        id: 1,
        name: 'VAT',
        rate: 19,
      };

      mockTaxService.getTaxById.mockResolvedValue(expectedTax);

      const result = await controller.findOne(mockRequest, taxId, storeId);

      expect(result).toEqual(expectedTax);
      expect(taxService.getTaxById).toHaveBeenCalledWith(1, storeId);
    });
  });

  describe('create', () => {
    it('should create a tax', async () => {
      const storeId = 'store1';
      const createTaxDto: CreateTaxDto = {
        name: 'VAT',
        rate: 19,
      };

      const expectedTax = {
        id: 1,
        ...createTaxDto,
      };

      mockTaxService.create.mockResolvedValue(expectedTax);

      const result = await controller.create(
        mockRequest,
        storeId,
        createTaxDto,
      );

      expect(result).toEqual(expectedTax);
      expect(taxService.create).toHaveBeenCalledWith(
        createTaxDto,
        storeId,
        mockUser,
      );
    });
  });

  describe('update', () => {
    it('should update a tax', async () => {
      const taxId = '1';
      const storeId = 'store1';
      const updateTaxDto: UpdateTaxDto = {
        name: 'Updated VAT',
        rate: 21,
      };

      const expectedTax = {
        id: 1,
        ...updateTaxDto,
      };

      mockTaxService.update.mockResolvedValue(expectedTax);

      const result = await controller.update(
        mockRequest,
        taxId,
        storeId,
        updateTaxDto,
      );

      expect(result).toEqual(expectedTax);
      expect(taxService.update).toHaveBeenCalledWith(
        1,
        updateTaxDto,
        storeId,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should remove a tax', async () => {
      const taxId = '1';
      const storeId = 'store1';

      mockTaxService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockRequest, taxId, storeId);

      expect(result).toBeUndefined();
      expect(taxService.remove).toHaveBeenCalledWith(1, storeId, mockUser);
    });
  });
});
