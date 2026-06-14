import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { Profile } from './entities/profile.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestWithUser } from '../auth/types';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('ProfileController', () => {
  let controller: ProfileController;
  let service: ProfileService;

  const mockProfileService = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    findProfileByUser: jest.fn(),
    findProfilesByStoreOrders: jest.fn(),
  };

  const mockProfile: Profile = {
    id: 1,
    shippingAddress: {
      address: '123 Main St',
      city: 'New York',
      department: 'NY',
      country: 'USA',
    },
    additionalPhone: '+1234567890',
    user: {} as any,
  };

  const mockRequest: RequestWithUser = {
    user: { id: 'user123', role: 'CUSTOMER' },
  } as unknown as RequestWithUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProfileController>(ProfileController);
    service = module.get<ProfileService>(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a profile successfully', async () => {
      const userId = '123';
      const createDto: CreateProfileDto = {
        shippingAddress: {
          address: '123 Main St',
          city: 'New York',
          department: 'NY',
          country: 'USA',
        },
        additionalPhone: '+1234567890',
      };

      mockProfileService.create.mockResolvedValue(mockProfile);

      const result = await controller.create(userId, createDto);

      expect(result).toEqual(mockProfile);
      expect(service.create).toHaveBeenCalledWith(123, createDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a profile by id', async () => {
      const profileId = '1';

      mockProfileService.findOne.mockResolvedValue(mockProfile);

      const result = await controller.findOne(profileId);

      expect(result).toEqual(mockProfile);
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a profile successfully', async () => {
      const profileId = '1';
      const updateDto: UpdateProfileDto = {
        additionalPhone: '+0987654321',
        shippingAddress: {
          address: 'Updated Address',
          city: 'Updated City',
          department: 'Updated Dept',
          country: 'Updated Country',
        },
      };
      const updatedProfile = { ...mockProfile, ...updateDto };

      mockProfileService.update.mockResolvedValue(updatedProfile);

      const result = await controller.update(profileId, updateDto);

      expect(result).toEqual(updatedProfile);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('listByStoreOrders', () => {
    it('should return profiles by store orders', async () => {
      const storeId = '1';
      const profiles = [mockProfile];

      mockProfileService.findProfilesByStoreOrders.mockResolvedValue(profiles);

      const result = await controller.listByStoreOrders(storeId);

      expect(result).toEqual(profiles);
      expect(service.findProfilesByStoreOrders).toHaveBeenCalledWith(1);
      expect(service.findProfilesByStoreOrders).toHaveBeenCalledTimes(1);
    });
  });

  describe('upsert', () => {
    it('should upsert a profile successfully', async () => {
      const createDto: CreateProfileDto = {
        shippingAddress: {
          address: '123 Main St',
          city: 'New York',
          department: 'NY',
          country: 'USA',
        },
        additionalPhone: '+1234567890',
      };

      mockProfileService.upsert.mockResolvedValue(mockProfile);

      const result = await controller.upsert(createDto, mockRequest);

      expect(result).toEqual(mockProfile);
      expect(service.upsert).toHaveBeenCalledWith('user123', createDto);
      expect(service.upsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMyProfile', () => {
    it('should return the current user profile', async () => {
      mockProfileService.findProfileByUser.mockResolvedValue(mockProfile);

      const result = await controller.getMyProfile(mockRequest);

      expect(result).toEqual(mockProfile);
      expect(service.findProfileByUser).toHaveBeenCalledWith('user123');
      expect(service.findProfileByUser).toHaveBeenCalledTimes(1);
    });
  });
});
