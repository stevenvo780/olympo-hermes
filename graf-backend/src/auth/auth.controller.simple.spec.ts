import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { User, UserRole } from '../user/entities/user.entity';

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

jest.mock('@/utils/firebase-admin.config', () => ({
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

const createMockRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('AuthController (Simple)', () => {
  let controller: AuthController;
  let userRepository: any;

  beforeEach(async () => {
    const mockUserRepository = createMockRepository();

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
    it('should throw UnauthorizedException when no token provided', async () => {
      const requestWithoutToken = { headers: {} };
      const userData = { email: 'test@example.com', name: 'Test User' };

      await expect(
        controller.register(requestWithoutToken, userData),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should register new user with valid token', async () => {
      const mockRequest = {
        headers: { authorization: 'Bearer valid-token' },
      };
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.CUSTOMER,
      };

      mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'firebase-uid',
        email: 'test@example.com',
      });

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue({
        id: 'firebase-uid',
        ...userData,
      });
      userRepository.save.mockResolvedValue({
        id: 'firebase-uid',
        ...userData,
      });

      const result = await controller.register(mockRequest, userData);

      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('firebase-uid');
    });
  });
});
