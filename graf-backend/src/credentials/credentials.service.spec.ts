import { Test, TestingModule } from '@nestjs/testing';
import { CredentialsService } from './credentials.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentCredentials } from './entities/payment-credentials.entity';
import { Store } from '../store/entities/store.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { CreateCredentialsDto } from './dto/create-credentials.dto';
import { UpdateCredentialsDto } from './dto/update-credentials.dto';
import { NotFoundException } from '@nestjs/common';
import { checkStoreAccess } from '../utils/permissions';
import { encrypt, decrypt } from '../utils/encrypt';

jest.mock('../utils/permissions');
jest.mock('../utils/encrypt');

describe('CredentialsService', () => {
  let service: CredentialsService;
  let credentialsRepository: jest.Mocked<Repository<PaymentCredentials>>;
  let storeRepository: jest.Mocked<Repository<Store>>;

  const mockStore: Store = {
    id: '1',
    name: 'Test Store',
    owner: { id: 'owner1' } as User,
  } as Store;

  const mockUser: User = {
    id: 'user1',
    role: UserRole.BUSINESS_OWNER,
  } as User;

  const mockCredentials: PaymentCredentials = {
    id: 1,
    store: mockStore,
    publicKey: 'pub_test_key',
    privateKeyEncrypted: 'encrypted_private_key',
  } as PaymentCredentials;

  const mockCreateCredentialsDto: CreateCredentialsDto = {
    publicKey: 'pub_test_key',
    privateKey: 'prv_test_key',
  };

  const mockUpdateCredentialsDto: UpdateCredentialsDto = {
    publicKey: 'pub_test_key_updated',
    privateKey: 'prv_test_key_updated',
  };

  beforeEach(async () => {
    const mockCredentialsRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockStoreRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialsService,
        {
          provide: getRepositoryToken(PaymentCredentials),
          useValue: mockCredentialsRepository,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepository,
        },
      ],
    }).compile();

    service = module.get<CredentialsService>(CredentialsService);
    credentialsRepository = module.get(getRepositoryToken(PaymentCredentials));
    storeRepository = module.get(getRepositoryToken(Store));

    process.env.CREDENTIALS_SECRET = 'test_secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setCredentials', () => {
    it('should create new credentials when none exist', async () => {
      const storeId = '1';

      (checkStoreAccess as jest.Mock).mockResolvedValue(mockStore);
      (encrypt as jest.Mock).mockReturnValue('encrypted_private_key');
      credentialsRepository.findOne.mockResolvedValue(null);
      credentialsRepository.create.mockReturnValue(mockCredentials);
      credentialsRepository.save.mockResolvedValue(mockCredentials);

      const result = await service.setCredentials(
        storeId,
        mockUser,
        mockCreateCredentialsDto,
      );

      expect(result).toEqual(mockCredentials);
      expect(checkStoreAccess).toHaveBeenCalledWith(
        storeRepository,
        storeId,
        mockUser,
      );
      expect(encrypt).toHaveBeenCalledWith('prv_test_key', 'test_secret');
      expect(credentialsRepository.findOne).toHaveBeenCalledWith({
        where: { store: { id: storeId } },
      });
      expect(credentialsRepository.create).toHaveBeenCalledWith({
        store: mockStore,
      });
      expect(credentialsRepository.save).toHaveBeenCalled();
    });

    it('should update existing credentials', async () => {
      const storeId = '1';
      const existingCredentials = { ...mockCredentials };

      (checkStoreAccess as jest.Mock).mockResolvedValue(mockStore);
      (encrypt as jest.Mock).mockReturnValue('new_encrypted_private_key');
      credentialsRepository.findOne.mockResolvedValue(existingCredentials);
      credentialsRepository.save.mockResolvedValue({
        ...existingCredentials,
        publicKey: 'pub_test_key',
        privateKeyEncrypted: 'new_encrypted_private_key',
      });

      const result = await service.setCredentials(
        storeId,
        mockUser,
        mockCreateCredentialsDto,
      );

      expect(result.publicKey).toBe('pub_test_key');
      expect(result.privateKeyEncrypted).toBe('new_encrypted_private_key');
      expect(checkStoreAccess).toHaveBeenCalledWith(
        storeRepository,
        storeId,
        mockUser,
      );
      expect(encrypt).toHaveBeenCalledWith('prv_test_key', 'test_secret');
      expect(credentialsRepository.create).not.toHaveBeenCalled();
      expect(credentialsRepository.save).toHaveBeenCalled();
    });
  });

  describe('getCredentials', () => {
    it('should return decrypted credentials successfully', async () => {
      const storeId = '1';

      (checkStoreAccess as jest.Mock).mockResolvedValue(mockStore);
      (decrypt as jest.Mock).mockReturnValue('decrypted_private_key');
      credentialsRepository.findOne.mockResolvedValue(mockCredentials);

      const result = await service.getCredentials(storeId, mockUser);

      expect(result).toEqual({
        publicKey: 'pub_test_key',
        privateKey: 'decrypted_private_key',
      });
      expect(checkStoreAccess).toHaveBeenCalledWith(
        storeRepository,
        storeId,
        mockUser,
      );
      expect(credentialsRepository.findOne).toHaveBeenCalledWith({
        where: { store: { id: storeId } },
      });
      expect(decrypt).toHaveBeenCalledWith(
        'encrypted_private_key',
        'test_secret',
      );
    });

    it('should throw NotFoundException when credentials not found', async () => {
      const storeId = '1';

      (checkStoreAccess as jest.Mock).mockResolvedValue(mockStore);
      credentialsRepository.findOne.mockResolvedValue(null);

      await expect(service.getCredentials(storeId, mockUser)).rejects.toThrow(
        new NotFoundException('Credentials not found'),
      );

      expect(checkStoreAccess).toHaveBeenCalledWith(
        storeRepository,
        storeId,
        mockUser,
      );
      expect(credentialsRepository.findOne).toHaveBeenCalledWith({
        where: { store: { id: storeId } },
      });
    });
  });

  describe('updateCredentials', () => {
    it('should update credentials successfully', async () => {
      const storeId = '1';
      const existingCredentials = { ...mockCredentials };

      (checkStoreAccess as jest.Mock).mockResolvedValue(mockStore);
      (encrypt as jest.Mock).mockReturnValue('updated_encrypted_private_key');
      credentialsRepository.findOne.mockResolvedValue(existingCredentials);
      credentialsRepository.save.mockResolvedValue({
        ...existingCredentials,
        publicKey: 'pub_test_key_updated',
        privateKeyEncrypted: 'updated_encrypted_private_key',
      });

      const result = await service.updateCredentials(
        storeId,
        mockUser,
        mockUpdateCredentialsDto,
      );

      expect(result.publicKey).toBe('pub_test_key_updated');
      expect(result.privateKeyEncrypted).toBe('updated_encrypted_private_key');
      expect(checkStoreAccess).toHaveBeenCalledWith(
        storeRepository,
        storeId,
        mockUser,
      );
      expect(credentialsRepository.findOne).toHaveBeenCalledWith({
        where: { store: { id: storeId } },
      });
      expect(encrypt).toHaveBeenCalledWith(
        'prv_test_key_updated',
        'test_secret',
      );
      expect(credentialsRepository.save).toHaveBeenCalled();
    });

    it('should update only public key when private key not provided', async () => {
      const storeId = '1';
      const existingCredentials = { ...mockCredentials };
      const updateDto = { publicKey: 'pub_test_key_updated' };

      (checkStoreAccess as jest.Mock).mockResolvedValue(mockStore);
      credentialsRepository.findOne.mockResolvedValue(existingCredentials);
      credentialsRepository.save.mockResolvedValue({
        ...existingCredentials,
        publicKey: 'pub_test_key_updated',
      });

      const result = await service.updateCredentials(
        storeId,
        mockUser,
        updateDto,
      );

      expect(result.publicKey).toBe('pub_test_key_updated');
      expect(encrypt).not.toHaveBeenCalled();
      expect(credentialsRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when credentials not found', async () => {
      const storeId = '1';

      (checkStoreAccess as jest.Mock).mockResolvedValue(mockStore);
      credentialsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateCredentials(storeId, mockUser, mockUpdateCredentialsDto),
      ).rejects.toThrow(new NotFoundException('Credentials not found'));

      expect(checkStoreAccess).toHaveBeenCalledWith(
        storeRepository,
        storeId,
        mockUser,
      );
      expect(credentialsRepository.findOne).toHaveBeenCalledWith({
        where: { store: { id: storeId } },
      });
    });
  });
});
