import {
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { EncryptionService } from '../utils/encryption.service';
import { User } from '../user/entities/user.entity';

describe('ApiKeyAuthGuard', () => {
  let guard: ApiKeyAuthGuard;
  let userRepositoryMock: any;

  beforeEach(() => {
    userRepositoryMock = {
      find: jest.fn(),
    };
    jest
      .spyOn(EncryptionService.prototype, 'decrypt')
      .mockImplementation((key) => {
        if (key === 'encrypted-valid-key') return 'valid-api-key';
        return 'invalid';
      });

    guard = new ApiKeyAuthGuard(userRepositoryMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedException if header is missing', async () => {
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw ForbiddenException if api key is invalid (no matching user)', async () => {
    const context = createMockContext({ 'x-api-key': 'invalid-key' });
    userRepositoryMock.find.mockResolvedValue([]);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should return true and attach user if api key is valid', async () => {
    const context = createMockContext({ 'x-api-key': 'valid-api-key' });
    const user = new User();
    user.apiKey = 'encrypted-valid-key';
    user.id = 'user-1';

    userRepositoryMock.find.mockResolvedValue([user]);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('user-1');
  });

  it('should continue when decrypt throws for a user key', async () => {
    const context = createMockContext({ 'x-api-key': 'valid-api-key' });
    const badUser = new User();
    badUser.apiKey = 'throw-key';
    const goodUser = new User();
    goodUser.apiKey = 'encrypted-valid-key';
    goodUser.id = 'user-2';

    (EncryptionService.prototype.decrypt as jest.Mock).mockImplementation(
      (key) => {
        if (key === 'throw-key') {
          throw new Error('decrypt error');
        }
        if (key === 'encrypted-valid-key') return 'valid-api-key';
        return 'invalid';
      },
    );

    userRepositoryMock.find.mockResolvedValue([badUser, goodUser]);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user.id).toBe('user-2');
  });

  function createMockContext(headers: any): ExecutionContext {
    const request = {
      headers,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  }
});
