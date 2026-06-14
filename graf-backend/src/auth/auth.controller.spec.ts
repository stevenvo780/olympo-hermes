import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../user/entities/user.entity';
import { createMockRepository, createTestUser } from '../test/test-utils';

const mockAuth = {
  verifyIdToken: jest.fn(),
  createUser: jest.fn(),
};

const mockAdmin = {
  auth: () => mockAuth,
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  apps: [],
};

jest.mock('firebase-admin', () => ({
  __esModule: true,
  default: mockAdmin,
}));

jest.mock('@/utils/firebase-admin.config', () => ({
  __esModule: true,
  default: mockAdmin,
}));

import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let userRepository: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockUserRepository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
      };

      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const expectedUser = createTestUser({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.CUSTOMER,
      });

      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'test-user-id',
        email: 'test@example.com',
      });

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(expectedUser);
      userRepository.save.mockResolvedValue(expectedUser);

      const result = await controller.register(mockRequest, userData);

      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
      });
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.CUSTOMER,
        }),
      );
      expect(userRepository.save).toHaveBeenCalledWith(expectedUser);
      expect(result).toEqual(expectedUser);
    });

    it('should throw UnauthorizedException when no token provided', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
      };

      const mockRequest = {
        headers: {},
      };

      await expect(controller.register(mockRequest, userData)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.register(mockRequest, userData)).rejects.toThrow(
        'No token provided',
      );
    });

    it('should return existing user if already registered', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
      };

      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const existingUser = createTestUser({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Existing User',
        role: UserRole.CUSTOMER,
      });

      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'test-user-id',
        email: 'test@example.com',
      });

      userRepository.findOne.mockResolvedValue(existingUser);

      const result = await controller.register(mockRequest, userData);

      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
      });
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual(existingUser);
    });

    it('should throw error when Firebase token is invalid', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
      };

      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      };

      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(controller.register(mockRequest, userData)).rejects.toThrow(
        'Invalid token',
      );
    });

    it('should use default role when none provided', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
      };

      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const expectedUser = createTestUser({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.CUSTOMER,
      });

      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'test-user-id',
        email: 'test@example.com',
      });

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(expectedUser);
      userRepository.save.mockResolvedValue(expectedUser);

      await controller.register(mockRequest, userData);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.CUSTOMER,
        }),
      );
    });
  });

  describe('testUser', () => {
    it('should return user info and test data successfully', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const testData = { test: 'data' };

      const existingUser = createTestUser({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.CUSTOMER,
      });

      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'test-user-id',
        email: 'test@example.com',
      });

      userRepository.findOne.mockResolvedValue(existingUser);

      const result = await controller.testUser(mockRequest, testData);

      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
      });
      expect(result).toEqual(
        expect.objectContaining({
          userInDb: existingUser,
          testData: testData,
          decodedToken: expect.objectContaining({
            uid: 'test-user-id',
            email: 'test@example.com',
          }),
        }),
      );
    });

    it('should throw UnauthorizedException when no token provided', async () => {
      const mockRequest = {
        headers: {},
      };

      const testData = { test: 'data' };

      await expect(controller.testUser(mockRequest, testData)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.testUser(mockRequest, testData)).rejects.toThrow(
        'No token provided',
      );
    });

    it('should rethrow errors from Firebase in testUser', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      };

      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(
        controller.testUser(mockRequest, { test: 'data' }),
      ).rejects.toThrow('Invalid token');
    });
  });
});
