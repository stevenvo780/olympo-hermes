import { Test, TestingModule } from '@nestjs/testing';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { createMockRepository } from '../test/test-utils';

describe('ConfigController', () => {
  let controller: ConfigController;
  let service: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      getConfigByStore: jest.fn(),
      getPublicConfigByStore: jest.fn(),
      updateConfigByStore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ConfigController>(ConfigController);
    service = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyConfig', () => {
    it('should call service with user', async () => {
      const user = { id: 'u1' } as any;
      service.getConfigByStore.mockResolvedValue({ id: 1 } as any);

      const result = await controller.getMyConfig('s1', { user } as any);

      expect(service.getConfigByStore).toHaveBeenCalledWith('s1', user);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('getPublicConfig', () => {
    it('should call service for public config', async () => {
      service.getPublicConfigByStore.mockResolvedValue({
        id: 1,
        public: true,
      } as any);

      const result: any = await controller.getPublicConfig('s1');

      expect(service.getPublicConfigByStore).toHaveBeenCalledWith('s1');
      expect(result.public).toBe(true);
    });
  });

  describe('updateMyConfig', () => {
    it('should update config', async () => {
      const user = { id: 'u1' } as any;
      const dto = { logo: 'new-logo' };
      service.updateConfigByStore.mockResolvedValue({ id: 1, ...dto } as any);

      const result = await controller.updateMyConfig(
        's1',
        { user } as any,
        dto,
      );

      expect(service.updateConfigByStore).toHaveBeenCalledWith('s1', user, dto);
      expect(result.logo).toBe('new-logo');
    });
  });
});
