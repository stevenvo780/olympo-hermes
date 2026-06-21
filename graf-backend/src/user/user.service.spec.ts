import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { Subscription, PlanType } from './entities/subscription.entity';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentSource } from 'src/wompi/entities/payment-source.entity';
import * as axios from 'axios';
import { createTestUser, MockRepository } from '../test/test-utils';
import { QueryRunner } from 'typeorm';

jest.mock('axios');

const mockAuth = {
  updateUser: jest.fn(),
};

jest.mock('firebase-admin', () => ({
  __esModule: true,
  default: {
    auth: () => mockAuth,
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(),
    },
    apps: [],
  },
}));

jest.mock('../utils/firebase-admin.config', () => ({
  __esModule: true,
  default: {
    auth: () => mockAuth,
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(),
    },
    apps: [],
  },
}));

describe('UserService', () => {
  let service: UserService;
  let userRepository: MockRepository<User>;
  let subscriptionRepository: MockRepository<Subscription>;
  let queryRunner: Partial<QueryRunner>;

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        update: jest.fn(),
        save: jest.fn(),
      } as any,
    };

    const mockUserRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
      manager: {
        connection: {
          createQueryRunner: jest.fn().mockReturnValue(queryRunner),
        },
      },
    };

    const mockSubscriptionRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
    subscriptionRepository = module.get(getRepositoryToken(Subscription));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user with a FREE subscription', async () => {
      const userDto = { email: 'test@example.com', name: 'Test' };
      const createdUser = createTestUser({ ...userDto, id: '1' });

      userRepository.save.mockResolvedValueOnce(createdUser);
      userRepository.save.mockResolvedValueOnce({
        ...createdUser,
        subscription: { planType: PlanType.FREE },
      });

      const result = await service.create(userDto);

      expect(userRepository.save).toHaveBeenCalledTimes(2);
      expect(result.subscription.planType).toBe(PlanType.FREE);
    });
  });

  describe('confirmSubscription', () => {
    it('should upgrade subscription and user role', async () => {
      const user = { id: '1', role: UserRole.CUSTOMER } as User;
      const paymentSource = { id: 1 } as unknown as PaymentSource;

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockImplementation((u) => Promise.resolve(u));

      await service.confirmSubscription(PlanType.PRO, '1', paymentSource);

      expect(user.role).toBe(UserRole.BUSINESS_OWNER);
      expect(user.subscription.planType).toBe(PlanType.PRO);
      expect(user.subscription.lastPaymentSource).toBe(paymentSource);
    });

    it('should update existing subscription details', async () => {
      const subscription = new Subscription();
      const user = {
        id: '1',
        role: UserRole.BUSINESS_OWNER,
        subscription,
      } as User;
      const paymentSource = { id: 2 } as unknown as PaymentSource;

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockImplementation((u) => Promise.resolve(u));

      await service.confirmSubscription(PlanType.PRO, '1', paymentSource);

      expect(user.subscription.planType).toBe(PlanType.PRO);
      expect(user.subscription.lastPaymentSource).toBe(paymentSource);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(
        service.confirmSubscription(PlanType.PRO, '1', {} as PaymentSource),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateEmail', () => {
    const userId = 'test-user-id';
    const newEmail = 'newemail@example.com';
    const existingUser = {
      id: userId,
      email: 'old@example.com',
      name: 'Test User',
    };

    it('should successfully update email', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ ...existingUser, email: newEmail });

      const result = await service.updateEmail(userId, newEmail);

      expect(mockAuth.updateUser).toHaveBeenCalledWith(userId, {
        email: newEmail,
      });
      expect(queryRunner.manager.update).toHaveBeenCalledWith(User, userId, {
        email: newEmail,
      });
      expect(result.email).toBe(newEmail);
    });

    it('should throw ConflictException if email taken', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 'other',
        email: newEmail,
      });
      await expect(service.updateEmail(userId, newEmail)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should rollback on Firebase error', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);
      userRepository.findOne.mockResolvedValueOnce(existingUser);

      mockAuth.updateUser.mockRejectedValue(new Error('Firebase fail'));

      await expect(service.updateEmail(userId, newEmail)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should include fallback error message when non-Error thrown', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);
      userRepository.findOne.mockResolvedValueOnce(existingUser);

      mockAuth.updateUser.mockRejectedValue({ code: 'oops' });

      await expect(service.updateEmail(userId, newEmail)).rejects.toThrow(
        'Unknown error',
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(service.updateEmail(userId, newEmail)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException for Firebase auth errors', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingUser);

      mockAuth.updateUser.mockRejectedValue({
        code: 'auth/invalid-email',
        message: 'Invalid email',
      });

      await expect(service.updateEmail(userId, newEmail)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all users if no dto provided', async () => {
      const users = [{ id: '1' }];
      userRepository.find.mockResolvedValue(users);
      const result = await service.findAll();
      expect(result).toEqual({ users, total: 1 });
    });

    it('should filter users', async () => {
      const users = [{ id: '1' }];
      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([users, 1]),
      };

      userRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

      const result = await service.findAll({
        search: 'test',
        minPoints: 10,
        maxPoints: 100,
        limit: 5,
        offset: 0,
      });

      expect(queryBuilderMock.where).toHaveBeenCalled();
      expect(queryBuilderMock.andWhere).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ users, total: 1 });
    });

    it('should use default pagination when limit/offset missing', async () => {
      const users = [{ id: '1' }];
      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([users, 1]),
      };

      userRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

      const result = await service.findAll({ search: 'x' });

      expect(queryBuilderMock.skip).toHaveBeenCalledWith(0);
      expect(queryBuilderMock.take).toHaveBeenCalledWith(10);
      expect(result).toEqual({ users, total: 1 });
    });
  });

  describe('getUserDetails', () => {
    it('should return user details', async () => {
      const user = { id: '1', subscription: { planType: 'PRO' } };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.getUserDetails('1');
      expect(result).toEqual(user);
    });

    it('should create subscription for BUSINESS_OWNER without subscription', async () => {
      const user = {
        id: '1',
        role: UserRole.BUSINESS_OWNER,
        subscription: null,
      } as unknown as User;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      await service.getUserDetails('1');

      expect(user.subscription).toBeDefined();
      expect(user.subscription.planType).toBe(PlanType.FREE);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });
  });

  describe('getIntegrationStatus', () => {
    it('should return integration status', async () => {
      const user = {
        id: '1',
        sigoApiUrl: 'url',
        hasSigoCredentials: jest.fn().mockReturnValue(true),
      };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.getIntegrationStatus('1');

      expect(result.hasSigoCredentials).toBe(true);
      expect(result.sigoApiUrl).toBe('url');
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.getIntegrationStatus('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getIntegrationCredentials', () => {
    it('should return undefined when user has no credentials', async () => {
      const user = {
        id: '1',
        hasSigoCredentials: jest.fn().mockReturnValue(false),
      };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.getIntegrationCredentials('1');

      expect(result).toEqual({ sigo: undefined });
    });

    it('should return credentials when present', async () => {
      const user = {
        id: '1',
        hasSigoCredentials: jest.fn().mockReturnValue(true),
        getSigoCredentials: jest.fn().mockReturnValue({ apiKey: 'k' }),
      };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.getIntegrationCredentials('1');

      expect(result.sigo).toEqual({ apiKey: 'k' });
    });
  });

  describe('findUserForCredentialsSync', () => {
    it('should return null when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findUserForCredentialsSync('x@test.com');

      expect(result).toBeNull();
    });

    it('should include credentials when available', async () => {
      const user = {
        id: '1',
        hasSigoCredentials: jest.fn().mockReturnValue(true),
        getSigoCredentials: jest.fn().mockReturnValue({ apiKey: 'k' }),
      };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findUserForCredentialsSync('x@test.com');

      expect(result).toEqual({
        hermesUserId: '1',
        sigo: { apiKey: 'k' },
      });
    });

    it('should omit credentials when not available', async () => {
      const user = {
        id: '2',
        hasSigoCredentials: jest.fn().mockReturnValue(false),
      };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findUserForCredentialsSync('x@test.com');

      expect(result).toEqual({
        hermesUserId: '2',
        sigo: undefined,
      });
    });
  });

  describe('generateApiKey', () => {
    it('should generate and save api key', async () => {
      const user = { id: '1', apiKey: null } as User;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      const result = await service.generateApiKey('1');

      expect(result.apiKey).toBeDefined();
      expect(user.apiKey).toBeDefined();
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.generateApiKey('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancelUserSubscription', () => {
    it('should revert subscription to FREE', async () => {
      const subscription = { planType: PlanType.PRO } as Subscription;
      const user = { id: '1', subscription } as User;

      subscriptionRepository.findOne.mockResolvedValue(subscription);
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.cancelUserSubscription('1');

      expect(subscription.planType).toBe(PlanType.FREE);
      expect(subscription.endDate).toBeDefined();
      expect(subscriptionRepository.save).toHaveBeenCalledWith(subscription);
      expect(result).toBe(subscription);
    });

    it('should throw NotFoundException if user missing', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.cancelUserSubscription('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      userRepository.update.mockResolvedValue({});
      userRepository.findOne.mockResolvedValue({ id: '1', name: 'New Name' });
      const result = await service.update('1', { name: 'New Name' });
      expect(result.name).toBe('New Name');
    });

    it('should throw ConflictException on email update', async () => {
      await expect(
        service.update('1', { email: 'new@test.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('regenerateApiKey', () => {
    it('should call generateApiKey', async () => {
      const user = { id: '1', apiKey: null } as User;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      const result = await service.regenerateApiKey('1');
      expect(result.apiKey).toBeDefined();
    });
  });

  describe('getUserSafeData', () => {
    it('should return safe data', async () => {
      const user = new User();
      user.id = '1';
      user.email = 'test@test.com';
      user.toSafeJSON = jest.fn().mockReturnValue({ id: '1' });

      userRepository.findOne.mockResolvedValue(user);
      const result = await service.getUserSafeData('1');
      expect(result).toEqual({ id: '1' });
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const result = await service.getUserSafeData('1');
      expect(result).toBeNull();
    });
  });

  describe('updateIntegrations', () => {
    it('should update sigo credentials and sync with hub central', async () => {
      const user = new User();
      user.id = '1';
      user.email = 'test@test.com';
      user.hasSigoCredentials = jest.fn().mockReturnValue(true);
      user.getSigoCredentials = jest
        .fn()
        .mockReturnValue({ email: 'sigo@test.com' });

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      const dto = { sigo: { apiKey: 'key', email: 'sigo@test.com' } };

      process.env.HUB_CENTRAL_SECRET = 'secret';

      await service.updateIntegrations('1', dto);

      expect(user.sigoEmail).toBe('sigo@test.com');
      expect(axios.default.put).toHaveBeenCalled();
    });

    it('should set sigo password and apiUrl when provided', async () => {
      const user = new User();
      user.id = '1';
      user.email = 'test@test.com';
      user.hasSigoCredentials = jest.fn().mockReturnValue(false);
      user.getSigoCredentials = jest.fn();

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      await service.updateIntegrations('1', {
        sigo: {
          password: 'secret',
          apiUrl: 'https://api.siigo.com',
        },
      });

      expect(user.sigoPassword).toBe('secret');
      expect(user.sigoApiUrl).toBe('https://api.siigo.com');
    });

    it('should throw NotFoundException when user missing', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.updateIntegrations('1', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should skip sync when HUB_CENTRAL_SECRET is missing', async () => {
      const user = new User();
      user.id = '1';
      user.email = 'test@test.com';
      user.hasSigoCredentials = jest.fn().mockReturnValue(true);
      user.getSigoCredentials = jest
        .fn()
        .mockReturnValue({ email: 'sigo@test.com' });

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      const previousSecret = process.env.HUB_CENTRAL_SECRET;
      delete process.env.HUB_CENTRAL_SECRET;

      await service.updateIntegrations('1', {});

      expect(axios.default.put).not.toHaveBeenCalled();

      process.env.HUB_CENTRAL_SECRET = previousSecret;
    });

    it('should handle sync error gracefully', async () => {
      const user = new User();
      user.id = '1';
      user.hasSigoCredentials = jest.fn().mockReturnValue(true);
      user.getSigoCredentials = jest
        .fn()
        .mockReturnValue({ email: 'sigo@test.com' });
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      (axios.default.put as jest.Mock).mockRejectedValue(
        new Error('Sync failed'),
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.updateIntegrations('1', {});

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to sync credentials'),
        expect.any(String),
        expect.any(String),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      userRepository.update.mockResolvedValue({} as any);

      const result = await service.updateRole('1', UserRole.BUSINESS_OWNER);

      expect(result).toBeDefined();
      expect(userRepository.update).toHaveBeenCalledWith('1', {
        role: UserRole.BUSINESS_OWNER,
      });
    });
  });

  describe('getIntegrationCredentials', () => {
    it('should return credentials', async () => {
      const user = {
        id: '1',
        hasSigoCredentials: jest.fn().mockReturnValue(true),
        getSigoCredentials: jest.fn().mockReturnValue({ apiKey: 'key' }),
      };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.getIntegrationCredentials('1');
      expect(result.sigo).toEqual({ apiKey: 'key' });
    });

    it('should throw NotFoundException', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.getIntegrationCredentials('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findUserForCredentialsSync', () => {
    it('should return user info if found', async () => {
      const user = {
        id: '1',
        hasSigoCredentials: jest.fn().mockReturnValue(true),
        getSigoCredentials: jest.fn().mockReturnValue({ apiKey: 'key' }),
      };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findUserForCredentialsSync('test@test.com');
      expect(result).toEqual({ hermesUserId: '1', sigo: { apiKey: 'key' } });
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const result = await service.findUserForCredentialsSync('test@test.com');
      expect(result).toBeNull();
    });
  });
});
