import { Test, TestingModule } from '@nestjs/testing';
import { OptionalFirebaseAuthGuard } from './optional-firebase-auth.guard';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { createMockRepository } from '../test/test-utils';
import {
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

const mockAuth = {
  verifyIdToken: jest.fn(),
};

jest.mock('../utils/firebase-admin.config', () => ({
  __esModule: true,
  default: {
    auth: () => mockAuth,
  },
}));

describe('OptionalFirebaseAuthGuard', () => {
  let guard: OptionalFirebaseAuthGuard;
  let userRepository: any;

  beforeEach(async () => {
    const mockUserRepository = createMockRepository();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OptionalFirebaseAuthGuard,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    guard = module.get<OptionalFirebaseAuthGuard>(OptionalFirebaseAuthGuard);
    userRepository = module.get(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  it('should return true if no auth header present', async () => {
    const context = createMockContext(null);
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should return true if token is valid and user exists', async () => {
    const context = createMockContext('Bearer valid-token');
    const decodedToken = { uid: 'user-1' };
    const user = { id: 'user-1' };

    mockAuth.verifyIdToken.mockResolvedValue(decodedToken);
    userRepository.findOne.mockResolvedValue(user);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toEqual(user);
    expect(req.token).toEqual(decodedToken);
  });

  it('should return true if token is valid but user does not exist', async () => {
    const context = createMockContext('Bearer valid-token');
    const decodedToken = { uid: 'user-1' };

    mockAuth.verifyIdToken.mockResolvedValue(decodedToken);
    userRepository.findOne.mockResolvedValue(null);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toBeUndefined();
    expect(req.token).toBeUndefined();
  });

  it('should throw UnauthorizedException if token is expired', async () => {
    const context = createMockContext('Bearer expired-token');
    mockAuth.verifyIdToken.mockRejectedValue({ code: 'auth/id-token-expired' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it.each([
    ['auth/invalid-id-token', UnauthorizedException],
    ['auth/argument-error', UnauthorizedException],
    ['auth/requires-recent-login', UnauthorizedException],
    ['auth/invalid-credential', UnauthorizedException],
  ])('throws UnauthorizedException for %s', async (code, expectedError) => {
    const context = createMockContext('Bearer invalid-token');
    mockAuth.verifyIdToken.mockRejectedValue({ code });

    await expect(guard.canActivate(context)).rejects.toThrow(expectedError);
  });

  it('throws ForbiddenException for disabled users', async () => {
    const context = createMockContext('Bearer disabled-token');
    mockAuth.verifyIdToken.mockRejectedValue({ code: 'auth/user-disabled' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('returns true if firebase reports user not found', async () => {
    const context = createMockContext('Bearer missing-user');
    mockAuth.verifyIdToken.mockRejectedValue({ code: 'auth/user-not-found' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('throws InternalServerErrorException for unknown errors', async () => {
    const context = createMockContext('Bearer unknown-error');
    mockAuth.verifyIdToken.mockRejectedValue({
      code: 'auth/unknown',
      message: 'boom',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('throws InternalServerErrorException when error has no code', async () => {
    const context = createMockContext('Bearer unknown-error');
    mockAuth.verifyIdToken.mockRejectedValue(new Error('unexpected'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  function createMockContext(authHeader: string | null): any {
    const request = {
      headers: authHeader ? { authorization: authHeader } : {},
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };
  }
});
