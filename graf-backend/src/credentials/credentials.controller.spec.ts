import { Test, TestingModule } from '@nestjs/testing';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';
import { CreateCredentialsDto } from './dto/create-credentials.dto';
import { UpdateCredentialsDto } from './dto/update-credentials.dto';
import { RequestWithUser } from '../auth/types';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../user/entities/user.entity';

describe('CredentialsController', () => {
  let controller: CredentialsController;
  let service: jest.Mocked<CredentialsService>;

  const mockCredentialsService = {
    setCredentials: jest.fn(),
    getCredentials: jest.fn(),
    updateCredentials: jest.fn(),
  };

  const mockRequest: RequestWithUser = {
    user: { id: 'user1', role: UserRole.BUSINESS_OWNER },
  } as unknown as RequestWithUser;

  const mockCreateCredentialsDto: CreateCredentialsDto = {
    publicKey: 'pub_test_key',
    privateKey: 'prv_test_key',
  };

  const mockUpdateCredentialsDto: UpdateCredentialsDto = {
    publicKey: 'pub_test_key_updated',
    privateKey: 'prv_test_key_updated',
  };

  const mockCredentialsResult = {
    id: 1,
    store: { id: '1', name: 'Test Store' },
    publicKey: 'pub_test_key',
    privateKeyEncrypted: 'encrypted_private_key',
  };

  const mockGetCredentialsResult = {
    publicKey: 'pub_test_key',
    privateKey: 'prv_test_key',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CredentialsController],
      providers: [
        {
          provide: CredentialsService,
          useValue: mockCredentialsService,
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CredentialsController>(CredentialsController);
    service = module.get(CredentialsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create credentials successfully', async () => {
      const storeId = '1';

      mockCredentialsService.setCredentials.mockResolvedValue(
        mockCredentialsResult as any,
      );

      const result = await controller.create(
        storeId,
        mockRequest,
        mockCreateCredentialsDto,
      );

      expect(result).toEqual(mockCredentialsResult);
      expect(service.setCredentials).toHaveBeenCalledWith(
        storeId,
        mockRequest.user,
        mockCreateCredentialsDto,
      );
      expect(service.setCredentials).toHaveBeenCalledTimes(1);
    });

    it('should handle errors from service', async () => {
      const storeId = '1';
      const error = new Error('Service error');

      mockCredentialsService.setCredentials.mockRejectedValue(error);

      await expect(
        controller.create(storeId, mockRequest, mockCreateCredentialsDto),
      ).rejects.toThrow('Service error');

      expect(service.setCredentials).toHaveBeenCalledWith(
        storeId,
        mockRequest.user,
        mockCreateCredentialsDto,
      );
    });
  });

  describe('get', () => {
    it('should get credentials successfully', async () => {
      const storeId = '1';

      mockCredentialsService.getCredentials.mockResolvedValue(
        mockGetCredentialsResult,
      );

      const result = await controller.get(storeId, mockRequest);

      expect(result).toEqual(mockGetCredentialsResult);
      expect(service.getCredentials).toHaveBeenCalledWith(
        storeId,
        mockRequest.user,
      );
      expect(service.getCredentials).toHaveBeenCalledTimes(1);
    });

    it('should handle not found error', async () => {
      const storeId = '1';
      const error = new Error('Credentials not found');

      mockCredentialsService.getCredentials.mockRejectedValue(error);

      await expect(controller.get(storeId, mockRequest)).rejects.toThrow(
        'Credentials not found',
      );

      expect(service.getCredentials).toHaveBeenCalledWith(
        storeId,
        mockRequest.user,
      );
    });
  });

  describe('update', () => {
    it('should update credentials successfully', async () => {
      const storeId = '1';
      const updatedCredentials = {
        ...mockCredentialsResult,
        publicKey: 'pub_test_key_updated',
      };

      mockCredentialsService.updateCredentials.mockResolvedValue(
        updatedCredentials as any,
      );

      const result = await controller.update(
        storeId,
        mockRequest,
        mockUpdateCredentialsDto,
      );

      expect(result).toEqual(updatedCredentials);
      expect(service.updateCredentials).toHaveBeenCalledWith(
        storeId,
        mockRequest.user,
        mockUpdateCredentialsDto,
      );
      expect(service.updateCredentials).toHaveBeenCalledTimes(1);
    });

    it('should update partial credentials successfully', async () => {
      const storeId = '1';
      const partialUpdateDto = { publicKey: 'pub_test_key_updated' };
      const updatedCredentials = {
        ...mockCredentialsResult,
        publicKey: 'pub_test_key_updated',
      };

      mockCredentialsService.updateCredentials.mockResolvedValue(
        updatedCredentials as any,
      );

      const result = await controller.update(
        storeId,
        mockRequest,
        partialUpdateDto,
      );

      expect(result).toEqual(updatedCredentials);
      expect(service.updateCredentials).toHaveBeenCalledWith(
        storeId,
        mockRequest.user,
        partialUpdateDto,
      );
    });

    it('should handle update errors', async () => {
      const storeId = '1';
      const error = new Error('Update failed');

      mockCredentialsService.updateCredentials.mockRejectedValue(error);

      await expect(
        controller.update(storeId, mockRequest, mockUpdateCredentialsDto),
      ).rejects.toThrow('Update failed');

      expect(service.updateCredentials).toHaveBeenCalledWith(
        storeId,
        mockRequest.user,
        mockUpdateCredentialsDto,
      );
    });
  });
});
