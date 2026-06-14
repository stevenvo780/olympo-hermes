import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExecutionContext } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { User } from '../user/entities/user.entity';
import { createMockRepository, createTestUser } from '../test/test-utils';
import { EncryptionService } from '../utils/encryption.service';

const mockAuth = {
  verifyIdToken: jest.fn(),
  createUser: jest.fn(),
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

describe('FirebaseAuthGuard', () => {
  let guard: FirebaseAuthGuard;
  let userRepository: any;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(async () => {
    const mockUserRepository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseAuthGuard,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    guard = module.get<FirebaseAuthGuard>(FirebaseAuthGuard);
    userRepository = module.get(getRepositoryToken(User));

    mockRequest = {
      headers: {},
      user: undefined,
      token: undefined,
      apiKey: undefined,
    };

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('API Key Authentication', () => {
    it('should authenticate successfully with valid API key', async () => {
      const user = createTestUser({ apiKey: 'valid-api-key' });
      mockRequest.headers['x-api-key'] = 'valid-api-key';

      userRepository.find.mockResolvedValue([user]);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(userRepository.find).toHaveBeenCalled();
      expect(mockRequest.user).toBe(user);
      expect(mockRequest.apiKey).toBe('valid-api-key');
    });

    it('should throw ForbiddenException with invalid API key', async () => {
      mockRequest.headers['x-api-key'] = 'invalid-api-key';
      userRepository.find.mockResolvedValue([]);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'API key inválida',
      );
    });

    it('should skip users when decrypt fails and still match a valid key', async () => {
      mockRequest.headers['x-api-key'] = 'valid-api-key';
      const badUser = createTestUser({ apiKey: 'bad-key' });
      const goodUser = createTestUser({ apiKey: 'valid-api-key' });

      const decryptMock = jest.spyOn(EncryptionService.prototype, 'decrypt');
      decryptMock.mockImplementation((key) => {
        if (key === 'bad-key') {
          throw new Error('decrypt failed');
        }
        return key;
      });

      userRepository.find.mockResolvedValue([badUser, goodUser]);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toBe(goodUser);
      decryptMock.mockRestore();
    });
  });

  describe('Bearer Token Authentication', () => {
    it('should authenticate successfully with valid Firebase token', async () => {
      const user = createTestUser({ id: 'firebase-uid' });
      mockRequest.headers.authorization = 'Bearer valid-firebase-token';

      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'firebase-uid',
        email: 'test@example.com',
      });
      userRepository.findOne.mockResolvedValue(user);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith(
        'valid-firebase-token',
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'firebase-uid' },
      });
      expect(mockRequest.user).toBe(user);
      expect(mockRequest.token).toBe('valid-firebase-token');
    });

    it('should throw UnauthorizedException when no token provided', async () => {
      mockRequest.headers = {};

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'No token provided',
      );
    });

    it('should throw UnauthorizedException when authorization header format is invalid', async () => {
      mockRequest.headers.authorization = 'InvalidFormat token';

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'No token provided',
      );
    });

    it('should throw UnauthorizedException when user not found in database', async () => {
      mockRequest.headers.authorization = 'Bearer valid-firebase-token';

      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'non-existent-user',
        email: 'test@example.com',
      });
      userRepository.findOne.mockResolvedValue(null);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'User not found in database. Please register first.',
      );
    });

    it('should throw UnauthorizedException when Firebase token is invalid', async () => {
      mockRequest.headers.authorization = 'Bearer invalid-token';

      mockAuth.verifyIdToken.mockRejectedValue({
        code: 'auth/invalid-id-token',
        message: 'Invalid token',
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'Invalid token',
      );
    });

    it.each([
      ['auth/argument-error', 'Token argument error'],
      ['auth/user-not-found', 'User not found'],
      ['auth/requires-recent-login', 'Recent login required'],
      ['auth/invalid-credential', 'Invalid credential'],
    ])(
      'should throw UnauthorizedException for Firebase code %s',
      async (code, message) => {
        mockRequest.headers.authorization = 'Bearer valid-token';

        mockAuth.verifyIdToken.mockRejectedValue({
          code,
          message: 'firebase error',
        });

        await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
          message,
        );
      },
    );

    it('should throw UnauthorizedException when Firebase token is expired', async () => {
      mockRequest.headers.authorization = 'Bearer expired-token';

      mockAuth.verifyIdToken.mockRejectedValue({
        code: 'auth/id-token-expired',
        message: 'Token expired',
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'Token has expired',
      );
    });

    it('should throw ForbiddenException when user account is disabled', async () => {
      mockRequest.headers.authorization = 'Bearer valid-token';

      mockAuth.verifyIdToken.mockRejectedValue({
        code: 'auth/user-disabled',
        message: 'User disabled',
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'User account is disabled',
      );
    });

    it('should throw InternalServerErrorException for unhandled Firebase errors', async () => {
      mockRequest.headers.authorization = 'Bearer valid-token';

      mockAuth.verifyIdToken.mockRejectedValue({
        code: 'auth/unknown-error',
        message: 'Unknown Firebase error',
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'Unexpected authentication error',
      );
    });

    it('should throw UnauthorizedException for non-Firebase errors', async () => {
      mockRequest.headers.authorization = 'Bearer valid-token';

      mockAuth.verifyIdToken.mockRejectedValue(new Error('Network error'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'Invalid token',
      );
    });

    it('should handle empty token after Bearer', async () => {
      mockRequest.headers.authorization = 'Bearer ';

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow();
    });

    it('should handle missing uid in decoded token', async () => {
      mockRequest.headers.authorization = 'Bearer valid-token';

      mockAuth.verifyIdToken.mockResolvedValue({
        email: 'test@example.com',
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'Invalid token: No user ID found',
      );
    });
  });

  describe('Priority Handling', () => {
    it('should prioritize API key over Bearer token when both are present', async () => {
      const user = createTestUser({ apiKey: 'valid-api-key' });
      mockRequest.headers['x-api-key'] = 'valid-api-key';
      mockRequest.headers.authorization = 'Bearer valid-firebase-token';

      userRepository.find.mockResolvedValue([user]);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(userRepository.find).toHaveBeenCalled();
      expect(mockAuth.verifyIdToken).not.toHaveBeenCalled();
      expect(mockRequest.user).toBe(user);
      expect(mockRequest.apiKey).toBe('valid-api-key');
    });
  });

  describe('Edge Cases', () => {
    it('should handle database errors during API key lookup', async () => {
      mockRequest.headers['x-api-key'] = 'valid-api-key';
      userRepository.find.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle database errors during user lookup', async () => {
      mockRequest.headers.authorization = 'Bearer valid-firebase-token';

      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'firebase-uid',
        email: 'test@example.com',
      });
      userRepository.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle case-sensitive authorization header', async () => {
      mockRequest.headers.Authorization = 'Bearer valid-firebase-token';

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'No token provided',
      );
    });
  });
});
