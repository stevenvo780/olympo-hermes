import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';
import { createMockRepository, createTestUser } from '../test/test-utils';
import { RegisterUserDto } from './dto/register.dto';

const mockAuth = {
  verifyIdToken: jest.fn(),
  createUser: jest.fn(),
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

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;

  beforeEach(async () => {
    const mockUserRepository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterUserDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should successfully register a new user', async () => {
      const mockFirebaseUser = {
        uid: 'firebase-uid',
        email: 'test@example.com',
      };

      const expectedUser = createTestUser({
        id: 'firebase-uid',
        email: 'test@example.com',
        name: 'Test User',
      });

      mockAuth.createUser.mockResolvedValue(mockFirebaseUser);
      userRepository.save.mockResolvedValue(expectedUser);

      const result = await service.register(registerDto);

      expect(mockAuth.createUser).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        displayName: registerDto.name,
      });

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockFirebaseUser.email,
          id: mockFirebaseUser.uid,
          name: registerDto.name,
        }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: 'firebase-uid',
          email: 'test@example.com',
          name: 'Test User',
        }),
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      const firebaseError = {
        code: 'auth/email-already-exists',
        message: 'Email already exists',
      };

      mockAuth.createUser.mockRejectedValue(firebaseError);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Email already exists',
      );

      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should throw Error for other Firebase errors', async () => {
      const firebaseError = {
        code: 'auth/weak-password',
        message: 'Password is too weak',
      };

      mockAuth.createUser.mockRejectedValue(firebaseError);

      await expect(service.register(registerDto)).rejects.toThrow(
        'Password is too weak',
      );

      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should throw Unknown Error if firebase error has no message', async () => {
      mockAuth.createUser.mockRejectedValue({ code: 'unknown' });
      await expect(service.register(registerDto)).rejects.toThrow(
        'Unknown error during registration',
      );
    });

    it('should handle missing user data from Firebase', async () => {
      const mockFirebaseUser = {
        uid: 'firebase-uid',
        email: null,
      };

      mockAuth.createUser.mockResolvedValue(mockFirebaseUser);

      await service.register(registerDto);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: null,
          id: mockFirebaseUser.uid,
          name: registerDto.name,
        }),
      );
    });

    it('should handle database save errors', async () => {
      const mockFirebaseUser = {
        uid: 'firebase-uid',
        email: 'test@example.com',
      };

      const dbError = new Error('Database connection failed');

      mockAuth.createUser.mockResolvedValue(mockFirebaseUser);
      userRepository.save.mockRejectedValue(dbError);

      await expect(service.register(registerDto)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('error handling', () => {
    it('should handle undefined Firebase response', async () => {
      const registerDto: RegisterUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockAuth.createUser.mockResolvedValue(undefined);

      await expect(service.register(registerDto)).rejects.toThrow();
    });
  });
});
