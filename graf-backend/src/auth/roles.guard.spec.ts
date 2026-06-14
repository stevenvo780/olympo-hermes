import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../user/entities/user.entity';
import { createTestUser } from '../test/test-utils';
import { RequestWithUser } from './types';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: Partial<RequestWithUser>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);

    mockRequest = {
      user: undefined,
    };

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no roles are required', async () => {
      const user = createTestUser({ role: UserRole.CUSTOMER });
      mockRequest.user = user;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should allow access when user has required role', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      mockRequest.user = user;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.BUSINESS_OWNER,
      ]);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', async () => {
      const user = createTestUser({ role: UserRole.BUSINESS_OWNER });
      mockRequest.user = user;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.SUPER_ADMIN,
        UserRole.BUSINESS_OWNER,
      ]);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow super admin access to all roles', async () => {
      const superAdminUser = createTestUser({ role: UserRole.SUPER_ADMIN });
      mockRequest.user = superAdminUser;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.BUSINESS_OWNER,
      ]);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', async () => {
      const user = createTestUser({ role: UserRole.CUSTOMER });
      mockRequest.user = user;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.BUSINESS_OWNER,
      ]);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'Insufficient permissions',
      );
    });

    it('should deny access when user is not authenticated', async () => {
      mockRequest.user = undefined;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.BUSINESS_OWNER,
      ]);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'Insufficient permissions',
      );
    });

    it('should deny access when user has no role defined', async () => {
      const userWithoutRole = createTestUser();
      delete (userWithoutRole as unknown as { role: UserRole }).role;
      mockRequest.user = userWithoutRole;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.BUSINESS_OWNER,
      ]);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'Insufficient permissions',
      );
    });

    it('should handle empty roles array', async () => {
      const user = createTestUser({ role: UserRole.CUSTOMER });
      mockRequest.user = user;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([]);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle single role requirement', async () => {
      const user = createTestUser({ role: UserRole.CUSTOMER });
      mockRequest.user = user;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.CUSTOMER,
      ]);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should correctly check multiple roles requirement', async () => {
      const user = createTestUser({ role: UserRole.CUSTOMER });
      mockRequest.user = user;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.BUSINESS_OWNER,
        UserRole.SUPER_ADMIN,
      ]);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('role hierarchy', () => {
    it('should respect role hierarchy - super admin can access business owner endpoints', async () => {
      const superAdminUser = createTestUser({ role: UserRole.SUPER_ADMIN });
      mockRequest.user = superAdminUser;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.BUSINESS_OWNER,
      ]);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should respect role hierarchy - super admin can access customer endpoints', async () => {
      const superAdminUser = createTestUser({ role: UserRole.SUPER_ADMIN });
      mockRequest.user = superAdminUser;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.CUSTOMER,
      ]);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should not allow business owner to access super admin endpoints', async () => {
      const businessOwnerUser = createTestUser({
        role: UserRole.BUSINESS_OWNER,
      });
      mockRequest.user = businessOwnerUser;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.SUPER_ADMIN,
      ]);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should not allow customer to access business owner endpoints', async () => {
      const customerUser = createTestUser({ role: UserRole.CUSTOMER });
      mockRequest.user = customerUser;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.BUSINESS_OWNER,
      ]);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('reflector integration', () => {
    it('should call reflector with correct parameters', async () => {
      const user = createTestUser({ role: UserRole.CUSTOMER });
      mockRequest.user = user;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.CUSTOMER,
      ]);

      await guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledTimes(1);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should handle reflector returning null', async () => {
      const user = createTestUser({ role: UserRole.CUSTOMER });
      mockRequest.user = user;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(null);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle malformed user object', async () => {
      mockRequest.user = {} as any;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.CUSTOMER,
      ]);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle user with invalid role value', async () => {
      const userWithInvalidRole = createTestUser();
      (userWithInvalidRole as unknown as { role: string }).role =
        'INVALID_ROLE';
      mockRequest.user = userWithInvalidRole;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.CUSTOMER,
      ]);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle case-sensitive role comparison', async () => {
      const user = createTestUser({ role: UserRole.CUSTOMER });
      mockRequest.user = user;

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.CUSTOMER,
      ]);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });
});
