import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeliveryZoneService } from './delivery-zone.service';
import { DeliveryZone } from './entities/delivery-zone.entity';
import { Store } from '../store/entities/store.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { CreateDeliveryZoneDto } from './dto/create-delivery-zone.dto';
import { UpdateDeliveryZoneDto } from './dto/update-delivery-zone.dto';

jest.mock('../utils/permissions', () => ({
  checkStoreAccess: jest.fn(),
  canAccessStore: jest.fn(),
  StoreAccessType: {
    OWNER: 'OWNER',
    EMPLOYEE: 'EMPLOYEE',
  },
}));

describe('DeliveryZoneService', () => {
  let service: DeliveryZoneService;

  const mockDeliveryZoneRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockStoreRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryZoneService,
        {
          provide: getRepositoryToken(DeliveryZone),
          useValue: mockDeliveryZoneRepository,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepository,
        },
      ],
    }).compile();

    service = module.get<DeliveryZoneService>(DeliveryZoneService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a delivery zone successfully', async () => {
      const storeId = 'store1';
      const user = {
        id: '1',
        role: UserRole.SUPER_ADMIN,
      } as unknown as User;

      const createDeliveryZoneDto: CreateDeliveryZoneDto = {
        zone: 'Centro',
        price: 5.5,
        estimatedTime: '30-45 min',
      };

      const store = {
        id: storeId,
        name: 'Test Store',
      } as unknown as Store;

      const expectedDeliveryZone = {
        id: 1,
        zone: createDeliveryZoneDto.zone,
        price: createDeliveryZoneDto.price,
        estimatedTime: createDeliveryZoneDto.estimatedTime,
        store,
      } as unknown as DeliveryZone;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      mockDeliveryZoneRepository.save.mockResolvedValue(expectedDeliveryZone);

      const result = await service.create(storeId, user, createDeliveryZoneDto);

      expect(result).toEqual(expectedDeliveryZone);
      expect(checkStoreAccess).toHaveBeenCalledWith(
        mockStoreRepository,
        storeId,
        user,
      );
      expect(mockDeliveryZoneRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          zone: createDeliveryZoneDto.zone,
          price: createDeliveryZoneDto.price,
          estimatedTime: createDeliveryZoneDto.estimatedTime,
          store,
        }),
      );
    });
  });

  describe('findAllByStore', () => {
    it('should return delivery zones for a store', async () => {
      const storeId = 'store1';
      const store = {
        id: storeId,
        name: 'Test Store',
      } as unknown as Store;

      const deliveryZones = [
        {
          id: 1,
          zone: 'Centro',
          price: 5.5,
          estimatedTime: '30-45 min',
          store,
        },
        {
          id: 2,
          zone: 'Norte',
          price: 7.0,
          estimatedTime: '45-60 min',
          store,
        },
      ] as unknown as DeliveryZone[];

      mockStoreRepository.findOne.mockResolvedValue(store);
      mockDeliveryZoneRepository.find.mockResolvedValue(deliveryZones);

      const result = await service.findAllByStore(storeId);

      expect(result).toEqual(deliveryZones);
      expect(mockStoreRepository.findOne).toHaveBeenCalledWith({
        where: { id: storeId },
      });
      expect(mockDeliveryZoneRepository.find).toHaveBeenCalledWith({
        where: { store: { id: storeId } },
      });
    });

    it('should throw NotFoundException if store not found', async () => {
      const storeId = 'store1';

      mockStoreRepository.findOne.mockResolvedValue(null);

      await expect(service.findAllByStore(storeId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a delivery zone by id', async () => {
      const deliveryZoneId = 1;
      const deliveryZone = {
        id: deliveryZoneId,
        zone: 'Centro',
        price: 5.5,
        estimatedTime: '30-45 min',
        store: { id: 'store1' },
      } as unknown as DeliveryZone;

      mockDeliveryZoneRepository.findOne.mockResolvedValue(deliveryZone);

      const result = await service.findOne(deliveryZoneId);

      expect(result).toEqual(deliveryZone);
      expect(mockDeliveryZoneRepository.findOne).toHaveBeenCalledWith({
        where: { id: deliveryZoneId },
        relations: ['store'],
      });
    });

    it('should throw NotFoundException if delivery zone not found', async () => {
      const deliveryZoneId = 1;

      mockDeliveryZoneRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(deliveryZoneId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a delivery zone successfully', async () => {
      const deliveryZoneId = 1;
      const user = {
        id: '1',
        role: UserRole.SUPER_ADMIN,
      } as unknown as User;

      const updateDeliveryZoneDto: UpdateDeliveryZoneDto = {
        zone: 'Centro Actualizado',
        price: 6.0,
        estimatedTime: '25-40 min',
      };

      const store = {
        id: 'store1',
        name: 'Test Store',
      } as unknown as Store;

      const existingDeliveryZone = {
        id: deliveryZoneId,
        zone: 'Centro',
        price: 5.5,
        estimatedTime: '30-45 min',
        store,
      } as unknown as DeliveryZone;

      const updatedDeliveryZone = {
        ...existingDeliveryZone,
        ...updateDeliveryZoneDto,
      } as unknown as DeliveryZone;

      const { canAccessStore } = require('../utils/permissions');
      canAccessStore.mockReturnValue(true);

      mockDeliveryZoneRepository.findOne.mockResolvedValue(
        existingDeliveryZone,
      );
      mockDeliveryZoneRepository.save.mockResolvedValue(updatedDeliveryZone);

      const result = await service.update(
        deliveryZoneId,
        user,
        updateDeliveryZoneDto,
      );

      expect(result).toEqual(updatedDeliveryZone);
      expect(canAccessStore).toHaveBeenCalledWith(store, user);
      expect(mockDeliveryZoneRepository.save).toHaveBeenCalledWith({
        ...existingDeliveryZone,
        ...updateDeliveryZoneDto,
      });
    });

    it('should throw NotFoundException if delivery zone not found', async () => {
      const deliveryZoneId = 1;
      const user = {
        id: '1',
        role: UserRole.BUSINESS_OWNER,
      } as unknown as User;
      const updateDeliveryZoneDto: UpdateDeliveryZoneDto = {
        zone: 'Updated Zone',
      };

      mockDeliveryZoneRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(deliveryZoneId, user, updateDeliveryZoneDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user cannot access store', async () => {
      const deliveryZoneId = 1;
      const user = {
        id: '1',
        role: UserRole.BUSINESS_OWNER,
      } as unknown as User;
      const updateDeliveryZoneDto: UpdateDeliveryZoneDto = {
        zone: 'Updated Zone',
      };

      const store = { id: 'store1' } as unknown as Store;
      const deliveryZone = {
        id: deliveryZoneId,
        store,
      } as unknown as DeliveryZone;

      const { canAccessStore } = require('../utils/permissions');
      canAccessStore.mockReturnValue(false);

      mockDeliveryZoneRepository.findOne.mockResolvedValue(deliveryZone);

      await expect(
        service.update(deliveryZoneId, user, updateDeliveryZoneDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a delivery zone successfully', async () => {
      const deliveryZoneId = 1;
      const user = {
        id: '1',
        role: UserRole.SUPER_ADMIN,
      } as unknown as User;

      const store = {
        id: 'store1',
        name: 'Test Store',
      } as unknown as Store;

      const deliveryZone = {
        id: deliveryZoneId,
        zone: 'Centro',
        store,
      } as unknown as DeliveryZone;

      const { canAccessStore } = require('../utils/permissions');
      canAccessStore.mockReturnValue(true);

      mockDeliveryZoneRepository.findOne.mockResolvedValue(deliveryZone);
      mockDeliveryZoneRepository.remove.mockResolvedValue(deliveryZone);

      await service.remove(deliveryZoneId, user);

      expect(canAccessStore).toHaveBeenCalledWith(store, user);
      expect(mockDeliveryZoneRepository.remove).toHaveBeenCalledWith(
        deliveryZone,
      );
    });

    it('should throw NotFoundException if delivery zone not found', async () => {
      const deliveryZoneId = 1;
      const user = {
        id: '1',
        role: UserRole.BUSINESS_OWNER,
      } as unknown as User;

      mockDeliveryZoneRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(deliveryZoneId, user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user cannot access store', async () => {
      const deliveryZoneId = 1;
      const user = {
        id: '1',
        role: UserRole.BUSINESS_OWNER,
      } as unknown as User;

      const store = { id: 'store1' } as unknown as Store;
      const deliveryZone = {
        id: deliveryZoneId,
        store,
      } as unknown as DeliveryZone;

      const { canAccessStore } = require('../utils/permissions');
      canAccessStore.mockReturnValue(false);

      mockDeliveryZoneRepository.findOne.mockResolvedValue(deliveryZone);

      await expect(service.remove(deliveryZoneId, user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
