import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { OptionalFirebaseAuthGuard } from '../auth/optional-firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequestWithUser } from '../auth/types';
import { UserRole } from './entities/user.entity';
import { FindUsersDto } from './dto/find-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdateResult } from 'typeorm';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  const mockUserService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    getUserSafeData: jest.fn(),
    update: jest.fn(),
    updateEmail: jest.fn(),
    updateRole: jest.fn(),
    generateApiKey: jest.fn(),
    regenerateApiKey: jest.fn(),
    updateIntegrations: jest.fn(),
    getIntegrationStatus: jest.fn(),
    findUserForCredentialsSync: jest.fn(),
  };

  const mockRequest: RequestWithUser = {
    user: { id: 'user1', role: UserRole.CUSTOMER },
  } as unknown as RequestWithUser;

  const mockRequestWithoutUser: RequestWithUser = {
    user: null,
  } as unknown as RequestWithUser;

  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    role: UserRole.CUSTOMER,
    profile: {},
  };

  const mockUserList = {
    users: [mockUser],
    total: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OptionalFirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return list of users with filters', async () => {
      const findUsersDto: FindUsersDto = {
        search: 'test',
        limit: 10,
        offset: 0,
      };

      mockUserService.findAll.mockResolvedValue(mockUserList);

      const result = await controller.findAll(findUsersDto);

      expect(result).toEqual(mockUserList);
      expect(userService.findAll).toHaveBeenCalledWith(findUsersDto);
      expect(userService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty list when no users match filters', async () => {
      const findUsersDto: FindUsersDto = {
        search: 'nonexistent',
        limit: 10,
        offset: 0,
      };

      const emptyResult = { users: [], total: 0 };
      mockUserService.findAll.mockResolvedValue(emptyResult);

      const result = await controller.findAll(findUsersDto);

      expect(result).toEqual(emptyResult);
      expect(userService.findAll).toHaveBeenCalledWith(findUsersDto);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = 'user1';

      mockUserService.findOne.mockResolvedValue(mockUser as any);

      const result = await controller.findOne(userId);

      expect(result).toEqual(mockUser);
      expect(userService.findOne).toHaveBeenCalledWith(userId);
      expect(userService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when user not found', async () => {
      const userId = 'nonexistent';
      const error = new Error('User not found');

      mockUserService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(userId)).rejects.toThrow(
        'User not found',
      );
      expect(userService.findOne).toHaveBeenCalledWith(userId);
    });
  });

  describe('getMe', () => {
    it('should return authenticated user data', async () => {
      const safeUserData = {
        id: 'user1',
        email: 'test@example.com',
        profile: {},
      };

      mockUserService.getUserSafeData.mockResolvedValue(safeUserData);

      const result = await controller.getMe(mockRequest);

      expect(result).toEqual(safeUserData);
      expect(userService.getUserSafeData).toHaveBeenCalledWith('user1');
      expect(userService.getUserSafeData).toHaveBeenCalledTimes(1);
    });

    it('should return empty object when no user is authenticated', async () => {
      const result = await controller.getMe(mockRequestWithoutUser);

      expect(result).toEqual({});
      expect(userService.getUserSafeData).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const updatedUser = { ...mockUser, name: 'Updated Name' };
      mockUserService.update.mockResolvedValue(updatedUser as any);

      const result = await controller.updateProfile(mockRequest, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(userService.update).toHaveBeenCalledWith('user1', updateUserDto);
      expect(userService.update).toHaveBeenCalledTimes(1);
    });

    it('should handle update errors', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };
      const error = new Error('Update failed');

      mockUserService.update.mockRejectedValue(error);

      await expect(
        controller.updateProfile(mockRequest, updateUserDto),
      ).rejects.toThrow('Update failed');
      expect(userService.update).toHaveBeenCalledWith('user1', updateUserDto);
    });
  });

  describe('updateEmail', () => {
    it('should update email successfully', async () => {
      const updateEmailDto: UpdateEmailDto = {
        email: 'newemail@example.com',
      };

      const updatedUser = { ...mockUser, email: 'newemail@example.com' };
      mockUserService.updateEmail.mockResolvedValue(updatedUser as any);

      const result = await controller.updateEmail(mockRequest, updateEmailDto);

      expect(result).toEqual(updatedUser);
      expect(userService.updateEmail).toHaveBeenCalledWith(
        'user1',
        'newemail@example.com',
      );
      expect(userService.updateEmail).toHaveBeenCalledTimes(1);
    });

    it('should handle email update errors', async () => {
      const updateEmailDto: UpdateEmailDto = {
        email: 'newemail@example.com',
      };
      const error = new Error('Email update failed');

      mockUserService.updateEmail.mockRejectedValue(error);

      await expect(
        controller.updateEmail(mockRequest, updateEmailDto),
      ).rejects.toThrow('Email update failed');
      expect(userService.updateEmail).toHaveBeenCalledWith(
        'user1',
        'newemail@example.com',
      );
    });
  });

  describe('updateRole', () => {
    it('should update user role successfully', async () => {
      const userId = 'user1';
      const updateUserDto = { role: UserRole.BUSINESS_OWNER };
      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };

      mockUserService.updateRole.mockResolvedValue(updateResult);

      const result = await controller.updateRole(userId, updateUserDto);

      expect(result).toEqual(updateResult);
      expect(userService.updateRole).toHaveBeenCalledWith(
        userId,
        UserRole.BUSINESS_OWNER,
      );
      expect(userService.updateRole).toHaveBeenCalledTimes(1);
    });

    it('should handle role update errors', async () => {
      const userId = 'user1';
      const updateUserDto = { role: UserRole.BUSINESS_OWNER };
      const error = new Error('Role update failed');

      mockUserService.updateRole.mockRejectedValue(error);

      await expect(
        controller.updateRole(userId, updateUserDto),
      ).rejects.toThrow('Role update failed');
      expect(userService.updateRole).toHaveBeenCalledWith(
        userId,
        UserRole.BUSINESS_OWNER,
      );
    });
  });

  describe('generateApiKey', () => {
    it('should generate API key successfully', async () => {
      const apiKeyResponse = { apiKey: 'new-api-key-123' };

      mockUserService.generateApiKey.mockResolvedValue(apiKeyResponse);

      const result = await controller.generateApiKey(mockRequest);

      expect(result).toEqual(apiKeyResponse);
      expect(userService.generateApiKey).toHaveBeenCalledWith('user1');
      expect(userService.generateApiKey).toHaveBeenCalledTimes(1);
    });

    it('should handle API key generation errors', async () => {
      const error = new Error('API key generation failed');

      mockUserService.generateApiKey.mockRejectedValue(error);

      await expect(controller.generateApiKey(mockRequest)).rejects.toThrow(
        'API key generation failed',
      );
      expect(userService.generateApiKey).toHaveBeenCalledWith('user1');
    });
  });

  describe('regenerateApiKey', () => {
    it('should regenerate API key successfully', async () => {
      const apiKeyResponse = { apiKey: 'regenerated-api-key-456' };

      mockUserService.regenerateApiKey.mockResolvedValue(apiKeyResponse);

      const result = await controller.regenerateApiKey(mockRequest);

      expect(result).toEqual(apiKeyResponse);
      expect(userService.regenerateApiKey).toHaveBeenCalledWith('user1');
      expect(userService.regenerateApiKey).toHaveBeenCalledTimes(1);
    });

    it('should handle API key regeneration errors', async () => {
      const error = new Error('API key regeneration failed');

      mockUserService.regenerateApiKey.mockRejectedValue(error);

      await expect(controller.regenerateApiKey(mockRequest)).rejects.toThrow(
        'API key regeneration failed',
      );
      expect(userService.regenerateApiKey).toHaveBeenCalledWith('user1');
    });
  });

  describe('updateIntegrations', () => {
    it('should update integrations and return status', async () => {
      const updatedUser = {
        hasSigoCredentials: jest.fn().mockReturnValue(true),
      };
      mockUserService.updateIntegrations.mockResolvedValue(updatedUser as any);

      const result = await controller.updateIntegrations(mockRequest, {
        sigoApiKey: 'key',
      } as any);

      expect(result).toEqual({
        success: true,
        message: 'Integraciones actualizadas exitosamente',
        hasSigoCredentials: true,
      });
      expect(userService.updateIntegrations).toHaveBeenCalledWith('user1', {
        sigoApiKey: 'key',
      });
    });
  });

  describe('getIntegrationStatus', () => {
    it('should return integration status', async () => {
      const status = { hasSigoCredentials: true, sigoApiUrl: 'url' };
      mockUserService.getIntegrationStatus.mockResolvedValue(status as any);

      const result = await controller.getIntegrationStatus(mockRequest);

      expect(result).toEqual(status);
      expect(userService.getIntegrationStatus).toHaveBeenCalledWith('user1');
    });
  });

  describe('getCredentialsForSync', () => {
    it('should return credentials when found', async () => {
      const credentials = { grafUserId: 'u1', sigo: { apiKey: 'k' } };
      mockUserService.findUserForCredentialsSync.mockResolvedValue(
        credentials as any,
      );

      const result = await controller.getCredentialsForSync('user@example.com');

      expect(result).toEqual(credentials);
      expect(userService.findUserForCredentialsSync).toHaveBeenCalledWith(
        'user@example.com',
      );
    });

    it('should return empty object when no credentials found', async () => {
      mockUserService.findUserForCredentialsSync.mockResolvedValue(null);

      const result = await controller.getCredentialsForSync('user@example.com');

      expect(result).toEqual({});
    });
  });
});
