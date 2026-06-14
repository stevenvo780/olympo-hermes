import { Test, TestingModule } from '@nestjs/testing';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { ConfigService } from '../config/config.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequestWithUser } from '../auth/types';
import { UserRole } from '../user/entities/user.entity';
import { UpdateStoreDto } from './dto/update-store.dto';

describe('StoreController', () => {
  let controller: StoreController;
  let storeService: StoreService;
  let configService: ConfigService;

  const mockStoreService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findStoresForUser: jest.fn(),
    addTeamMember: jest.fn(),
    removeTeamMember: jest.fn(),
    getTeamMembers: jest.fn(),
  };

  const mockConfigService = {
    getStoreByDomain: jest.fn(),
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
      controllers: [StoreController],
      providers: [
        {
          provide: StoreService,
          useValue: mockStoreService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<StoreController>(StoreController);
    storeService = module.get<StoreService>(StoreService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all stores', async () => {
      const expectedStores = [
        { id: '1', name: 'Store 1' },
        { id: '2', name: 'Store 2' },
      ];

      mockStoreService.findAll.mockResolvedValue(expectedStores);

      const result = await controller.findAll();

      expect(result).toEqual(expectedStores);
      expect(storeService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a store by id', async () => {
      const storeId = '1';
      const expectedStore = { id: '1', name: 'Test Store' };

      mockStoreService.findOne.mockResolvedValue(expectedStore);

      const result = await controller.findOne(storeId);

      expect(result).toEqual(expectedStore);
      expect(storeService.findOne).toHaveBeenCalledWith(storeId);
    });
  });

  describe('update', () => {
    it('should update a store', async () => {
      const storeId = '1';
      const updateStoreDto: UpdateStoreDto = {
        name: 'Updated Store Name',
        description: 'Updated description',
      };
      const expectedStore = { id: storeId, ...updateStoreDto };

      mockStoreService.update.mockResolvedValue(expectedStore);

      const result = await controller.update(
        storeId,
        updateStoreDto,
        mockRequest,
      );

      expect(result).toEqual(expectedStore);
      expect(storeService.update).toHaveBeenCalledWith(
        storeId,
        updateStoreDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should delete a store', async () => {
      const storeId = '1';

      mockStoreService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(storeId, mockRequest);

      expect(result).toBeUndefined();
      expect(storeService.remove).toHaveBeenCalledWith(storeId, mockUser);
    });
  });

  describe('getMyStores', () => {
    it('should return stores for current user', async () => {
      const expectedStores = [
        { id: '1', name: 'My Store 1' },
        { id: '2', name: 'My Store 2' },
      ];

      mockStoreService.findStoresForUser.mockResolvedValue(expectedStores);

      const result = await controller.getMyStores(mockRequest);

      expect(result).toEqual(expectedStores);
      expect(storeService.findStoresForUser).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getStoreByDomain', () => {
    it('should return a store by domain', async () => {
      const domain = 'example.com';
      const expectedStore = { id: '1', name: 'Store with domain' };

      mockConfigService.getStoreByDomain.mockResolvedValue(expectedStore);

      const result = await controller.getStoreByDomain(domain);

      expect(result).toEqual(expectedStore);
      expect(configService.getStoreByDomain).toHaveBeenCalledWith(domain);
    });
  });

  describe('addTeamMember', () => {
    it('should add a team member to the store', async () => {
      const storeId = '1';
      const email = 'teammember@example.com';
      const data = { email };
      const expectedStore = { id: storeId, name: 'Store with new member' };

      mockStoreService.addTeamMember.mockResolvedValue(expectedStore);

      const result = await controller.addTeamMember(storeId, mockRequest, data);

      expect(result).toEqual(expectedStore);
      expect(storeService.addTeamMember).toHaveBeenCalledWith(
        storeId,
        email,
        mockUser,
      );
    });
  });

  describe('removeTeamMember', () => {
    it('should remove a team member from the store', async () => {
      const storeId = '1';
      const teamMemberId = '2';
      const expectedStore = { id: storeId, name: 'Store after member removal' };

      mockStoreService.removeTeamMember.mockResolvedValue(expectedStore);

      const result = await controller.removeTeamMember(
        storeId,
        teamMemberId,
        mockRequest,
      );

      expect(result).toEqual(expectedStore);
      expect(storeService.removeTeamMember).toHaveBeenCalledWith(
        storeId,
        teamMemberId,
        mockUser,
      );
    });
  });

  describe('getTeamMembers', () => {
    it('should return team members for a store', async () => {
      const storeId = '1';
      const expectedMembers = [
        { id: '2', email: 'member1@example.com' },
        { id: '3', email: 'member2@example.com' },
      ];

      mockStoreService.getTeamMembers.mockResolvedValue(expectedMembers);

      const result = await controller.getTeamMembers(storeId, mockRequest);

      expect(result).toEqual(expectedMembers);
      expect(storeService.getTeamMembers).toHaveBeenCalledWith(
        storeId,
        mockUser,
      );
    });
  });
});
