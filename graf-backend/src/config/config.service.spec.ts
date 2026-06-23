import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Config } from './entities/config.entity';
import { Store } from '../store/entities/store.entity';
import {
  createMockRepository,
  createTestStore,
  createTestUser,
} from '../test/test-utils';
import { NotFoundException } from '@nestjs/common';

jest.mock('../utils/permissions', () => ({
  checkStoreAccess: jest.fn(),
}));

describe('ConfigService', () => {
  let service: ConfigService;
  let configRepository: any;
  let storeRepository: any;

  beforeEach(async () => {
    const mockConfigRepository = createMockRepository();
    const mockStoreRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        { provide: getRepositoryToken(Config), useValue: mockConfigRepository },
        { provide: getRepositoryToken(Store), useValue: mockStoreRepository },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
    configRepository = module.get(getRepositoryToken(Config));
    storeRepository = module.get(getRepositoryToken(Store));
  });

  describe('createDefaultConfig', () => {
    it('should create and save default config', async () => {
      const store = createTestStore();
      configRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.createDefaultConfig(store);

      expect(result.store).toBe(store);
      expect(result.palette).toBeDefined();
      expect(configRepository.save).toHaveBeenCalled();
    });
  });

  describe('getConfigByStore', () => {
    it('should create default if config not found', async () => {
      const user = createTestUser();
      const store = createTestStore();
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      configRepository.findOne.mockResolvedValue(null);
      configRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.getConfigByStore('s1', user);

      expect(result.store).toBe(store);
      expect(configRepository.save).toHaveBeenCalled();
    });

    it('should return existing config and update missing plugins', async () => {
      const user = createTestUser();
      const store = createTestStore();
      const existingConfig = {
        id: 1,
        store,
        plugins: { nous: { enabled: true } },
      };
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      configRepository.findOne.mockResolvedValue(existingConfig);
      configRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.getConfigByStore('s1', user);

      expect(result.id).toBe(1);
      expect(result.plugins.sigo).toBeDefined(); // Added default
      expect(configRepository.save).toHaveBeenCalled();
    });

    it('should initialize plugins object when missing', async () => {
      const user = createTestUser();
      const store = createTestStore();
      const existingConfig = {
        id: 2,
        store,
        plugins: undefined,
      };
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      configRepository.findOne.mockResolvedValue(existingConfig);
      configRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.getConfigByStore('s1', user);

      expect(result.plugins).toBeDefined();
      expect(configRepository.save).toHaveBeenCalled();
    });

    it('should default navbar flags and height when invalid', async () => {
      const user = createTestUser();
      const store = createTestStore();
      const existingConfig = {
        id: 3,
        store,
        plugins: {},
        showNavbarLogo: null,
        showNavbarTitle: undefined,
        navbarHeight: 10,
      };
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      configRepository.findOne.mockResolvedValue(existingConfig);
      configRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.getConfigByStore('s1', user);

      expect(result.showNavbarLogo).toBe(true);
      expect(result.showNavbarTitle).toBe(true);
      expect(result.navbarHeight).toBe(60);
      expect(configRepository.save).toHaveBeenCalled();
    });

    it('should not save when config already has defaults', async () => {
      const user = createTestUser();
      const store = createTestStore();
      const existingConfig = {
        id: 5,
        store,
        plugins: {
          nous: { enabled: false, apiKey: '' },
          sigo: { enabled: false, apiKey: '' },
          talanton: { enabled: false, apiKey: '' },
          talaria: { enabled: false, apiKey: '' },
        },
        showNavbarLogo: false,
        showNavbarTitle: true,
        navbarHeight: 60,
      };
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      configRepository.findOne.mockResolvedValue(existingConfig);

      const result = await service.getConfigByStore('s1', user);

      expect(result).toBe(existingConfig);
      expect(configRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateConfigByStore', () => {
    it('should sanitize about content and update', async () => {
      const user = createTestUser();
      const store = createTestStore();
      const existingConfig = { id: 1, store };
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      configRepository.findOne.mockResolvedValue(existingConfig);
      configRepository.save.mockImplementation((c) => Promise.resolve(c));

      const dto = { about: '<script>alert(1)</script><p>Hello</p>' };
      const result = await service.updateConfigByStore('s1', user, dto);

      expect(result.about).toBe('<p>Hello</p>'); // Sanitized
      expect(configRepository.save).toHaveBeenCalled();
    });

    it('should create default config when missing', async () => {
      const user = createTestUser();
      const store = createTestStore();
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      configRepository.findOne.mockResolvedValue(null);
      configRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.updateConfigByStore('s1', user, {});

      expect(result.store).toBe(store);
      expect(configRepository.save).toHaveBeenCalled();
    });

    it('should not sanitize when about is empty', async () => {
      const user = createTestUser();
      const store = createTestStore();
      const existingConfig = { id: 7, store, about: 'Keep me' };
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      configRepository.findOne.mockResolvedValue(existingConfig);
      configRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.updateConfigByStore('s1', user, {
        footer: { info: 'ok' } as any,
      });

      expect(result.about).toBe('Keep me');
      expect(configRepository.save).toHaveBeenCalled();
    });
  });

  describe('getPublicConfigByStore', () => {
    it('should throw NotFoundException when store is missing', async () => {
      storeRepository.findOne.mockResolvedValue(null);

      await expect(service.getPublicConfigByStore('s1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create default config when none exists', async () => {
      const store = createTestStore();
      storeRepository.findOne.mockResolvedValue(store);
      configRepository.findOne.mockResolvedValue(null);
      configRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.getPublicConfigByStore('s1');

      expect(result.store).toBe(store);
      expect(configRepository.save).toHaveBeenCalled();
    });

    it('should update plugins when missing in public config', async () => {
      const store = createTestStore();
      const existingConfig = { id: 3, store, plugins: undefined };
      storeRepository.findOne.mockResolvedValue(store);
      configRepository.findOne.mockResolvedValue(existingConfig);
      configRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.getPublicConfigByStore('s1');

      expect(result.plugins).toBeDefined();
      expect(configRepository.save).toHaveBeenCalled();
    });

    it('should default navbar flags and height in public config', async () => {
      const store = createTestStore();
      const existingConfig = {
        id: 4,
        store,
        plugins: {},
        showNavbarLogo: undefined,
        showNavbarTitle: null,
        navbarHeight: 500,
      };
      storeRepository.findOne.mockResolvedValue(store);
      configRepository.findOne.mockResolvedValue(existingConfig);
      configRepository.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.getPublicConfigByStore('s1');

      expect(result.showNavbarLogo).toBe(true);
      expect(result.showNavbarTitle).toBe(true);
      expect(result.navbarHeight).toBe(60);
      expect(configRepository.save).toHaveBeenCalled();
    });

    it('should not save public config when no updates needed', async () => {
      const store = createTestStore();
      const existingConfig = {
        id: 6,
        store,
        plugins: {
          nous: { enabled: false, apiKey: '' },
          sigo: { enabled: false, apiKey: '' },
          talanton: { enabled: false, apiKey: '' },
          talaria: { enabled: false, apiKey: '' },
        },
        showNavbarLogo: true,
        showNavbarTitle: false,
        navbarHeight: 100,
      };
      storeRepository.findOne.mockResolvedValue(store);
      configRepository.findOne.mockResolvedValue(existingConfig);

      const result = await service.getPublicConfigByStore('s1');

      expect(result).toBe(existingConfig);
      expect(configRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getStoreByDomain', () => {
    it('should find store by domain', async () => {
      const store = { id: 's1' };
      configRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ store }),
      });

      const result = await service.getStoreByDomain('test.com');
      expect(result).toBe(store);
    });

    it('should throw NotFoundException if domain not found', async () => {
      configRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getStoreByDomain('none.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
