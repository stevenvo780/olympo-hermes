import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { StoreService } from './store.service';
import { Store } from './entities/store.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { UpdateStoreDto } from './dto/update-store.dto';

jest.mock('../utils/permissions', () => ({
  isStoreOwner: jest.fn(),
  checkStoreAccess: jest.fn(),
  StoreAccessType: {
    OWNER: 'OWNER',
    EMPLOYEE: 'EMPLOYEE',
  },
}));

describe('StoreService', () => {
  let service: StoreService;

  const mockStoreRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: {
      getRepository: jest.fn(),
    },
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreService,
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<StoreService>(StoreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createStoreFromPayment', () => {
    it('should create a new store from payment', async () => {
      const storeId = 'test-store-123';
      const owner = {
        id: 1,
        email: 'owner@example.com',
        role: UserRole.BUSINESS_OWNER,
      } as unknown as User;

      const expectedStore = {
        id: storeId,
        name: storeId,
        description: 'Aqui tu descripcion de la tienda',
        phonePrefix: '+57',
        phoneNumber: '0000000000',
        owner,
      };

      mockStoreRepository.create.mockReturnValue(expectedStore);
      mockStoreRepository.save.mockResolvedValue(expectedStore);

      const result = await service.createStoreFromPayment(storeId, owner);

      expect(result).toEqual(expectedStore);
      expect(mockStoreRepository.create).toHaveBeenCalledWith({
        id: storeId,
        name: storeId,
        description: 'Aqui tu descripcion de la tienda',
        phonePrefix: '+57',
        phoneNumber: '0000000000',
        owner,
      });
      expect(mockStoreRepository.save).toHaveBeenCalledWith(expectedStore);
    });
  });

  describe('findAll', () => {
    it('should return all stores with relations', async () => {
      const expectedStores = [
        { id: '1', name: 'Store 1' },
        { id: '2', name: 'Store 2' },
      ] as unknown as Store[];

      mockStoreRepository.find.mockResolvedValue(expectedStores);

      const result = await service.findAll();

      expect(result).toEqual(expectedStores);
      expect(mockStoreRepository.find).toHaveBeenCalledWith({
        relations: ['configuration', 'owner', 'owner.subscription'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a store by id', async () => {
      const storeId = '1';
      const expectedStore = { id: '1', name: 'Test Store' } as unknown as Store;

      mockStoreRepository.findOne.mockResolvedValue(expectedStore);

      const result = await service.findOne(storeId);

      expect(result).toEqual(expectedStore);
      expect(mockStoreRepository.findOne).toHaveBeenCalledWith({
        where: { id: storeId },
        relations: [
          'configuration',
          'owner',
          'owner.subscription',
          'deliveryZones',
          'employees',
        ],
      });
    });

    it('should return null if store not found', async () => {
      const storeId = '1';

      mockStoreRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(storeId);

      expect(result).toBeNull();
    });
  });

  describe('findStoresForUser', () => {
    it('should return stores for a user', async () => {
      const userId = '1';
      const expectedStores = [
        { id: '1', name: 'Store 1' },
        { id: '2', name: 'Store 2' },
      ] as unknown as Store[];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(expectedStores),
      };

      mockStoreRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findStoresForUser(userId);

      expect(result).toEqual(expectedStores);
      expect(mockStoreRepository.createQueryBuilder).toHaveBeenCalledWith(
        'store',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'store.configuration',
        'configuration',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'store.owner',
        'owner',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'owner.subscription',
        'subscription',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'store.employees',
        'employee',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'store.ownerId = :userId',
        { userId },
      );
      expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith(
        'employee.id = :userId',
        { userId },
      );
    });
  });

  describe('update', () => {
    it('should update a store successfully', async () => {
      const storeId = '1';
      const updateStoreDto: UpdateStoreDto = {
        name: 'Updated Store Name',
        description: 'Updated description',
      };
      const user = {
        id: 1,
        role: UserRole.SUPER_ADMIN,
      } as unknown as User;

      const mockStore = {
        id: storeId,
        name: 'Old Store Name',
        description: 'Old description',
      } as unknown as Store;

      const updatedStore = { ...mockStore, ...updateStoreDto };

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(mockStore);

      mockStoreRepository.save.mockResolvedValue(updatedStore);

      const result = await service.update(storeId, updateStoreDto, user);

      expect(result).toEqual(updatedStore);
      expect(mockStoreRepository.save).toHaveBeenCalledWith({
        ...mockStore,
        ...updateStoreDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a store successfully', async () => {
      const storeId = '1';
      const user = {
        id: 1,
        role: UserRole.SUPER_ADMIN,
      } as unknown as User;

      const mockStore = {
        id: storeId,
        name: 'Store to delete',
        owner: { id: 1 },
      } as unknown as Store;

      const mockRelatedRepository = {
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      mockStoreRepository.findOne.mockResolvedValue(mockStore);
      mockStoreRepository.manager.getRepository.mockReturnValue(
        mockRelatedRepository,
      );
      mockStoreRepository.remove.mockResolvedValue(mockStore);

      const { isStoreOwner } = require('../utils/permissions');
      isStoreOwner.mockReturnValue(true);

      await service.remove(storeId, user);

      expect(mockStoreRepository.findOne).toHaveBeenCalledWith({
        where: { id: storeId },
        relations: [
          'owner',
          'employees',
          'products',
          'taxes',
          'orders',
          'discounts',
          'categories',
          'configuration',
        ],
      });
      expect(mockStoreRepository.remove).toHaveBeenCalledWith(mockStore);
    });

    it('should throw NotFoundException if store not found', async () => {
      const storeId = '1';
      const user = { id: 1, role: UserRole.BUSINESS_OWNER } as unknown as User;

      mockStoreRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(storeId, user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not store owner', async () => {
      const storeId = '1';
      const user = {
        id: 2,
        role: UserRole.BUSINESS_OWNER,
      } as unknown as User;

      const mockStore = {
        id: storeId,
        name: 'Store to delete',
        owner: { id: 1 },
      } as unknown as Store;

      mockStoreRepository.findOne.mockResolvedValue(mockStore);

      const { isStoreOwner } = require('../utils/permissions');
      isStoreOwner.mockReturnValue(false);

      await expect(service.remove(storeId, user)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addTeamMember', () => {
    it('should add a team member to the store', async () => {
      const storeId = '1';
      const email = 'teamMember@example.com';
      const user = {
        id: 1,
        role: UserRole.SUPER_ADMIN,
      } as unknown as User;

      const mockStore = {
        id: storeId,
        name: 'Test Store',
        employees: [],
      } as unknown as Store;

      const teamMember = {
        id: '2',
        email: 'teamMember@example.com',
        name: 'Team Member',
      } as unknown as User;

      const expectedStore = {
        ...mockStore,
        employees: [teamMember],
      };

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(mockStore);

      mockUserRepository.findOne.mockResolvedValue(teamMember);
      mockStoreRepository.save.mockResolvedValue(expectedStore);

      const result = await service.addTeamMember(storeId, email, user);

      expect(result).toEqual(expectedStore);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockStoreRepository.save).toHaveBeenCalledWith(expectedStore);
    });

    it('should return store when team member already exists', async () => {
      const storeId = '1';
      const email = 'teamMember@example.com';
      const user = { id: 1, role: UserRole.SUPER_ADMIN } as unknown as User;

      const teamMember = { id: '2', email } as unknown as User;
      const mockStore = {
        id: storeId,
        name: 'Test Store',
        employees: [teamMember],
      } as unknown as Store;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(mockStore);
      mockUserRepository.findOne.mockResolvedValue(teamMember);

      const result = await service.addTeamMember(storeId, email, user);

      expect(result).toBe(mockStore);
      expect(mockStoreRepository.save).not.toHaveBeenCalled();
    });

    it('should initialize employees array when missing', async () => {
      const storeId = '1';
      const email = 'teamMember@example.com';
      const user = { id: 1, role: UserRole.SUPER_ADMIN } as unknown as User;

      const teamMember = { id: '2', email } as unknown as User;
      const mockStore = {
        id: storeId,
        name: 'Test Store',
      } as unknown as Store;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(mockStore);
      mockUserRepository.findOne.mockResolvedValue(teamMember);
      mockStoreRepository.save.mockResolvedValue({
        ...mockStore,
        employees: [teamMember],
      });

      const result = await service.addTeamMember(storeId, email, user);

      expect(result.employees).toHaveLength(1);
      expect(result.employees?.[0]).toEqual(teamMember);
    });

    it('should throw NotFoundException if user not found', async () => {
      const storeId = '1';
      const email = 'notfound@example.com';
      const user = { id: 1, role: UserRole.BUSINESS_OWNER } as unknown as User;

      const mockStore = {
        id: storeId,
        name: 'Test Store',
        employees: [],
      } as unknown as Store;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(mockStore);

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.addTeamMember(storeId, email, user)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeTeamMember', () => {
    it('should remove a team member from the store', async () => {
      const storeId = '1';
      const teamMemberId = '2';
      const user = {
        id: 1,
        role: UserRole.SUPER_ADMIN,
      } as unknown as User;

      const teamMember = {
        id: '2',
        email: 'member@example.com',
      } as unknown as User;
      const mockStore = {
        id: storeId,
        name: 'Test Store',
        employees: [teamMember],
      } as unknown as Store;

      const expectedStore = {
        ...mockStore,
        employees: [],
      };

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(mockStore);

      mockStoreRepository.save.mockResolvedValue(expectedStore);

      const result = await service.removeTeamMember(
        storeId,
        teamMemberId,
        user,
      );

      expect(result).toEqual(expectedStore);
      expect(mockStoreRepository.save).toHaveBeenCalledWith(expectedStore);
    });

    it('should return store when there are no employees', async () => {
      const storeId = '1';
      const teamMemberId = '2';
      const user = {
        id: 1,
        role: UserRole.SUPER_ADMIN,
      } as unknown as User;

      const mockStore = {
        id: storeId,
        name: 'Test Store',
      } as unknown as Store;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(mockStore);

      const result = await service.removeTeamMember(
        storeId,
        teamMemberId,
        user,
      );

      expect(result).toBe(mockStore);
      expect(mockStoreRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getTeamMembers', () => {
    it('should return team members of a store', async () => {
      const storeId = '1';
      const user = {
        id: 1,
        role: UserRole.SUPER_ADMIN,
      } as unknown as User;

      const teamMembers = [
        { id: '2', email: 'member1@example.com' },
        { id: '3', email: 'member2@example.com' },
      ] as unknown as User[];

      const mockStore = {
        id: storeId,
        name: 'Test Store',
        employees: teamMembers,
      } as unknown as Store;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(mockStore);

      const result = await service.getTeamMembers(storeId, user);

      expect(result).toEqual(teamMembers);
    });

    it('should return empty array when store has no employees', async () => {
      const storeId = '1';
      const user = {
        id: 1,
        role: UserRole.SUPER_ADMIN,
      } as unknown as User;

      const mockStore = {
        id: storeId,
        name: 'Test Store',
        employees: undefined,
      } as unknown as Store;

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(mockStore);

      const result = await service.getTeamMembers(storeId, user);

      expect(result).toEqual([]);
    });
  });
});
