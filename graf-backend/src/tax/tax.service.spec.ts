import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { TaxService } from './tax.service';
import { Tax } from './entities/tax.entity';
import { Store } from '../store/entities/store.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';

jest.mock('../utils/permissions', () => ({
  checkStoreAccess: jest.fn(),
  StoreAccessType: {
    OWNER: 'OWNER',
    EMPLOYEE: 'EMPLOYEE',
  },
}));

describe('TaxService', () => {
  let service: TaxService;

  const mockTaxRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockStoreRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxService,
        {
          provide: getRepositoryToken(Tax),
          useValue: mockTaxRepository,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepository,
        },
      ],
    }).compile();

    service = module.get<TaxService>(TaxService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a tax successfully', async () => {
      const createTaxDto: CreateTaxDto = {
        name: 'VAT',
        rate: 19,
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

      const expectedTax = {
        id: 1,
        ...createTaxDto,
        store,
      } as unknown as Tax;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockTaxRepository.findOne.mockResolvedValue(null);
      mockTaxRepository.create.mockReturnValue(expectedTax);
      mockTaxRepository.save.mockResolvedValue(expectedTax);

      const result = await service.create(createTaxDto, storeId, user);

      expect(result).toEqual(expectedTax);
      expect(mockTaxRepository.findOne).toHaveBeenCalledWith({
        where: { name: createTaxDto.name, store: { id: storeId } },
      });
      expect(mockTaxRepository.create).toHaveBeenCalledWith({
        ...createTaxDto,
        store,
      });
      expect(mockTaxRepository.save).toHaveBeenCalledWith(expectedTax);
    });

    it('should throw ConflictException if tax name already exists', async () => {
      const createTaxDto: CreateTaxDto = {
        name: 'VAT',
        rate: 19,
      };
      const storeId = 'store1';
      const user = {
        id: '1',
        role: UserRole.BUSINESS_OWNER,
      } as unknown as User;

      const store = { id: storeId } as unknown as Store;
      const existingTax = { id: 1, name: 'VAT' } as unknown as Tax;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockTaxRepository.findOne.mockResolvedValue(existingTax);

      await expect(service.create(createTaxDto, storeId, user)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findByStore', () => {
    it('should return taxes for a store', async () => {
      const storeId = 'store1';
      const store = {
        id: storeId,
        name: 'Test Store',
      } as unknown as Store;

      const taxes = [
        { id: 1, name: 'VAT', rate: 19 },
        { id: 2, name: 'Service Tax', rate: 10 },
      ] as unknown as Tax[];

      mockStoreRepository.findOne.mockResolvedValue(store);
      mockTaxRepository.find.mockResolvedValue(taxes);

      const result = await service.findByStore(storeId);

      expect(result).toEqual(taxes);
      expect(mockStoreRepository.findOne).toHaveBeenCalledWith({
        where: { id: storeId },
        relations: ['owner'],
      });
      expect(mockTaxRepository.find).toHaveBeenCalledWith({
        where: { store: { id: storeId } },
      });
    });

    it('should throw NotFoundException if store not found', async () => {
      const storeId = 'store1';

      mockStoreRepository.findOne.mockResolvedValue(null);

      await expect(service.findByStore(storeId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTaxById', () => {
    it('should return a tax by id', async () => {
      const taxId = 1;
      const storeId = 'store1';

      const store = {
        id: storeId,
        name: 'Test Store',
      } as unknown as Store;

      const tax = {
        id: taxId,
        name: 'VAT',
        rate: 19,
        store,
      } as unknown as Tax;

      mockStoreRepository.findOne.mockResolvedValue(store);
      mockTaxRepository.findOne.mockResolvedValue(tax);

      const result = await service.getTaxById(taxId, storeId);

      expect(result).toEqual(tax);
      expect(mockTaxRepository.findOne).toHaveBeenCalledWith({
        where: { id: taxId },
        relations: ['store'],
      });
    });

    it('should throw NotFoundException if store not found', async () => {
      const taxId = 1;
      const storeId = 'store1';

      mockStoreRepository.findOne.mockResolvedValue(null);

      await expect(service.getTaxById(taxId, storeId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if tax not found', async () => {
      const taxId = 1;
      const storeId = 'store1';

      const store = { id: storeId } as unknown as Store;

      mockStoreRepository.findOne.mockResolvedValue(store);
      mockTaxRepository.findOne.mockResolvedValue(null);

      await expect(service.getTaxById(taxId, storeId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if tax does not belong to store', async () => {
      const taxId = 1;
      const storeId = 'store1';

      const store = { id: storeId } as unknown as Store;
      const tax = {
        id: taxId,
        store: { id: 'other-store' },
      } as unknown as Tax;

      mockStoreRepository.findOne.mockResolvedValue(store);
      mockTaxRepository.findOne.mockResolvedValue(tax);

      await expect(service.getTaxById(taxId, storeId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update a tax successfully', async () => {
      const taxId = 1;
      const storeId = 'store1';
      const updateTaxDto: UpdateTaxDto = {
        name: 'Updated VAT',
        rate: 21,
      };
      const user = {
        id: '1',
        role: UserRole.SUPER_ADMIN,
      } as unknown as User;

      const store = { id: storeId } as unknown as Store;
      const existingTax = {
        id: taxId,
        name: 'VAT',
        rate: 19,
        store,
      } as unknown as Tax;

      const updatedTax = {
        ...existingTax,
        ...updateTaxDto,
      } as unknown as Tax;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockTaxRepository.findOne
        .mockResolvedValueOnce(existingTax)
        .mockResolvedValueOnce(null);

      mockTaxRepository.save.mockResolvedValue(updatedTax);

      const result = await service.update(taxId, updateTaxDto, storeId, user);

      expect(result).toEqual(updatedTax);
      expect(mockTaxRepository.save).toHaveBeenCalledWith({
        ...existingTax,
        ...updateTaxDto,
      });
    });

    it('should throw NotFoundException if tax not found', async () => {
      const taxId = 1;
      const storeId = 'store1';
      const updateTaxDto: UpdateTaxDto = { name: 'Updated VAT' };
      const user = {
        id: '1',
        role: UserRole.BUSINESS_OWNER,
      } as unknown as User;

      const store = { id: storeId } as unknown as Store;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockTaxRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(taxId, updateTaxDto, storeId, user),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new name already exists', async () => {
      const taxId = 1;
      const storeId = 'store1';
      const updateTaxDto: UpdateTaxDto = { name: 'Existing Tax' };
      const user = { id: '1', role: UserRole.SUPER_ADMIN } as unknown as User;

      const store = { id: storeId } as unknown as Store;
      const existingTax = {
        id: taxId,
        name: 'VAT',
        store,
      } as unknown as Tax;

      const conflictingTax = {
        id: 2,
        name: 'Existing Tax',
      } as unknown as Tax;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockTaxRepository.findOne
        .mockResolvedValueOnce(existingTax)
        .mockResolvedValueOnce(conflictingTax);

      await expect(
        service.update(taxId, updateTaxDto, storeId, user),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException when tax belongs to another store', async () => {
      const taxId = 1;
      const storeId = 'store1';
      const updateTaxDto: UpdateTaxDto = { name: 'Updated VAT' };
      const user = { id: '1', role: UserRole.SUPER_ADMIN } as unknown as User;

      const store = { id: storeId } as unknown as Store;
      const existingTax = {
        id: taxId,
        name: 'VAT',
        store: { id: 'other-store' },
      } as unknown as Tax;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockTaxRepository.findOne.mockResolvedValue(existingTax);

      await expect(
        service.update(taxId, updateTaxDto, storeId, user),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a tax successfully', async () => {
      const taxId = 1;
      const storeId = 'store1';
      const user = {
        id: '1',
        role: UserRole.SUPER_ADMIN,
      } as unknown as User;

      const store = { id: storeId } as unknown as Store;
      const tax = {
        id: taxId,
        name: 'VAT',
        store,
      } as unknown as Tax;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockTaxRepository.findOne.mockResolvedValue(tax);
      mockTaxRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(taxId, storeId, user);

      expect(mockTaxRepository.delete).toHaveBeenCalledWith(taxId);
    });

    it('should throw ForbiddenException if tax does not belong to store', async () => {
      const taxId = 1;
      const storeId = 'store1';
      const user = { id: '1', role: UserRole.SUPER_ADMIN } as unknown as User;

      const store = { id: storeId } as unknown as Store;
      const tax = {
        id: taxId,
        store: { id: 'other-store' },
      } as unknown as Tax;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockTaxRepository.findOne.mockResolvedValue(tax);

      await expect(service.remove(taxId, storeId, user)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if tax not found', async () => {
      const taxId = 1;
      const storeId = 'store1';
      const user = {
        id: '1',
        role: UserRole.BUSINESS_OWNER,
      } as unknown as User;

      const store = { id: storeId } as unknown as Store;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockTaxRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(taxId, storeId, user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if delete affected 0 rows', async () => {
      const taxId = 1;
      const storeId = 'store1';
      const user = { id: '1', role: UserRole.SUPER_ADMIN } as unknown as User;

      const store = { id: storeId } as unknown as Store;
      const tax = {
        id: taxId,
        store,
      } as unknown as Tax;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockTaxRepository.findOne.mockResolvedValue(tax);
      mockTaxRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(taxId, storeId, user)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
