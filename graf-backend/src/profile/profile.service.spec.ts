import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SelectQueryBuilder } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Profile } from './entities/profile.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Order } from '../order/entities/order.entity';

describe('ProfileService', () => {
  let service: ProfileService;

  const mockProfileRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepository = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(Profile),
          useValue: mockProfileRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a profile successfully', async () => {
      const userId = 1;
      const createProfileDto: CreateProfileDto = {
        additionalPhone: '+1234567890',
      };

      const user = {
        id: '1',
        role: UserRole.CUSTOMER,
      } as unknown as User;

      const expectedProfile = {
        id: 1,
        ...createProfileDto,
        user,
      } as unknown as Profile;

      mockUserRepository.findOneBy.mockResolvedValue(user);
      mockProfileRepository.create.mockReturnValue(expectedProfile);
      mockProfileRepository.save.mockResolvedValue(expectedProfile);

      const result = await service.create(userId, createProfileDto);

      expect(result).toEqual(expectedProfile);
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: '1' });
      expect(mockProfileRepository.create).toHaveBeenCalledWith({
        ...createProfileDto,
        user,
      });
      expect(mockProfileRepository.save).toHaveBeenCalledWith(expectedProfile);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 1;
      const createProfileDto: CreateProfileDto = {
        additionalPhone: '+1234567890',
      };

      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create(userId, createProfileDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a profile by id', async () => {
      const profileId = 1;
      const profile = {
        id: profileId,
        additionalPhone: '+1234567890',
        user: { id: '1' },
      } as unknown as Profile;

      mockProfileRepository.findOne.mockResolvedValue(profile);

      const result = await service.findOne(profileId);

      expect(result).toEqual(profile);
      expect(mockProfileRepository.findOne).toHaveBeenCalledWith({
        where: { id: profileId },
        relations: ['user'],
      });
    });

    it('should throw NotFoundException if profile not found', async () => {
      const profileId = 1;

      mockProfileRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(profileId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a profile successfully', async () => {
      const profileId = 1;
      const updateProfileDto: UpdateProfileDto = {
        additionalPhone: '+9876543210',
      };

      const existingProfile = {
        id: profileId,
        additionalPhone: '+1234567890',
      } as unknown as Profile;

      const updatedProfile = {
        ...existingProfile,
        ...updateProfileDto,
      } as unknown as Profile;

      mockProfileRepository.findOne.mockResolvedValue(existingProfile);
      mockProfileRepository.save.mockResolvedValue(updatedProfile);

      const result = await service.update(profileId, updateProfileDto);

      expect(result).toEqual(updatedProfile);
      expect(mockProfileRepository.save).toHaveBeenCalledWith({
        ...existingProfile,
        ...updateProfileDto,
      });
    });

    it('should throw NotFoundException if profile not found', async () => {
      const profileId = 1;
      const updateProfileDto: UpdateProfileDto = {
        additionalPhone: '+9876543210',
      };

      mockProfileRepository.findOne.mockResolvedValue(null);

      await expect(service.update(profileId, updateProfileDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('upsert', () => {
    it('should update existing profile', async () => {
      const userId = '1';
      const createProfileDto: CreateProfileDto = {
        additionalPhone: '+9876543210',
      };

      const user = {
        id: userId,
        role: UserRole.CUSTOMER,
      } as unknown as User;

      const existingProfile = {
        id: 1,
        additionalPhone: '+1234567890',
        user,
      } as unknown as Profile;

      const updatedProfile = {
        ...existingProfile,
        ...createProfileDto,
      } as unknown as Profile;

      mockUserRepository.findOneBy.mockResolvedValue(user);
      mockProfileRepository.findOne.mockResolvedValue(existingProfile);
      mockProfileRepository.save.mockResolvedValue(updatedProfile);

      const result = await service.upsert(userId, createProfileDto);

      expect(result).toEqual(updatedProfile);
      expect(mockProfileRepository.save).toHaveBeenCalledWith({
        ...existingProfile,
        ...createProfileDto,
      });
    });

    it('should create new profile if none exists', async () => {
      const userId = '1';
      const createProfileDto: CreateProfileDto = {
        additionalPhone: '+1234567890',
      };

      const user = {
        id: userId,
        role: UserRole.CUSTOMER,
      } as unknown as User;

      const newProfile = {
        id: 1,
        ...createProfileDto,
        user,
      } as unknown as Profile;

      mockUserRepository.findOneBy.mockResolvedValue(user);
      mockProfileRepository.findOne.mockResolvedValue(null);
      mockProfileRepository.create.mockReturnValue(newProfile);
      mockProfileRepository.save.mockResolvedValue(newProfile);

      const result = await service.upsert(userId, createProfileDto);

      expect(result).toEqual(newProfile);
      expect(mockProfileRepository.create).toHaveBeenCalledWith({
        ...createProfileDto,
        user,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = '1';
      const createProfileDto: CreateProfileDto = {
        additionalPhone: '+1234567890',
      };

      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(service.upsert(userId, createProfileDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findProfileByUser', () => {
    it('should return existing profile for user', async () => {
      const userId = '1';
      const profile = {
        id: 1,
        additionalPhone: '+1234567890',
        user: { id: userId },
      } as unknown as Profile;

      mockProfileRepository.findOne.mockResolvedValue(profile);

      const result = await service.findProfileByUser(userId);

      expect(result).toEqual(profile);
      expect(mockProfileRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: ['user'],
      });
    });

    it('should create new profile if none exists for user', async () => {
      const userId = '1';
      const newProfile = {
        id: 1,
        user: { id: userId },
      } as unknown as Profile;

      mockProfileRepository.findOne.mockResolvedValue(null);
      mockProfileRepository.create.mockReturnValue(newProfile);
      mockProfileRepository.save.mockResolvedValue(newProfile);

      const result = await service.findProfileByUser(userId);

      expect(result).toEqual(newProfile);
      expect(mockProfileRepository.create).toHaveBeenCalledWith({
        user: { id: userId },
      });
    });
  });

  describe('findProfilesByStoreOrders', () => {
    it('should return profiles for users with orders in store', async () => {
      const storeId = 1;
      const profiles = [
        { id: 1, additionalPhone: '+1111111111', user: { id: '1' } },
        { id: 2, additionalPhone: '+2222222222', user: { id: '2' } },
      ] as unknown as Profile[];

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(profiles),
      } as unknown as SelectQueryBuilder<Profile>;

      mockProfileRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findProfilesByStoreOrders(storeId);

      expect(result).toEqual(profiles);
      expect(mockProfileRepository.createQueryBuilder).toHaveBeenCalledWith(
        'profile',
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'profile.user',
        'user',
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        Order,
        'order',
        'order.userId = user.id AND order.storeId = :storeId',
        { storeId },
      );
    });
  });
});
