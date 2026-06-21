import { Test, TestingModule } from '@nestjs/testing';
import { PluginController } from './plugin.controller';
import { ConfigService } from '../config/config.service';
import { PluginService } from './plugin.service';

describe('PluginController', () => {
  let controller: PluginController;
  const mockConfigService = {
    getPublicConfigByStore: jest.fn(),
    updateConfigByStore: jest.fn(),
  } as const;

  const mockPluginService = {
    getStorePluginConfig: jest.fn(),
    getAvailablePlugins: jest.fn(),
    checkNousConnection: jest.fn(),
  } as Partial<PluginService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PluginController],
      providers: [
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PluginService, useValue: mockPluginService },
      ],
    })
      .overrideGuard(
        require('../auth/firebase-auth.guard').FirebaseAuthGuard,
      )
      .useValue({ canActivate: () => true })
      .overrideGuard(require('../auth/roles.guard').RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PluginController>(PluginController);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns plugins object', async () => {
      mockConfigService.getPublicConfigByStore.mockResolvedValue({
        plugins: { a: { enabled: true } },
      });
      const res = await controller.list('10');
      expect(res).toEqual({ a: { enabled: true } });
      expect(mockConfigService.getPublicConfigByStore).toHaveBeenCalledWith(
        '10',
      );
    });

    it('returns empty object when no plugins', async () => {
      mockConfigService.getPublicConfigByStore.mockResolvedValue({});
      const res = await controller.list('10');
      expect(res).toEqual({});
    });
  });

  describe('update', () => {
    it('passes plugins dto and returns updated plugins', async () => {
      mockConfigService.updateConfigByStore.mockResolvedValue({
        plugins: { b: { enabled: false } },
      });
      const res = await controller.update('5', {
        plugins: { b: { enabled: false } },
      });
      expect(res).toEqual({ b: { enabled: false } });
      expect(mockConfigService.updateConfigByStore).toHaveBeenCalledWith(
        '5',
        expect.any(Object),
        expect.objectContaining({ plugins: { b: { enabled: false } } }),
      );
    });

    it('returns empty object if service returns config without plugins', async () => {
      mockConfigService.updateConfigByStore.mockResolvedValue({});
      const res = await controller.update('5', { plugins: {} });
      expect(res).toEqual({});
    });
  });

  describe('getNousPlugins', () => {
    it('returns hub central plugin config', async () => {
      (mockPluginService.getStorePluginConfig as jest.Mock).mockResolvedValue({
        nous: { enabled: true },
      });

      const res = await controller.getNousPlugins('12');

      expect(res).toEqual({ nous: { enabled: true } });
      expect(mockPluginService.getStorePluginConfig).toHaveBeenCalledWith(12);
    });
  });

  describe('getAvailablePlugins', () => {
    it('returns available plugins', async () => {
      (mockPluginService.getAvailablePlugins as jest.Mock).mockResolvedValue([
        'a',
        'b',
      ]);

      const res = await controller.getAvailablePlugins();

      expect(res).toEqual(['a', 'b']);
      expect(mockPluginService.getAvailablePlugins).toHaveBeenCalled();
    });
  });

  describe('checkNousConnection', () => {
    it('returns connection status', async () => {
      (
        mockPluginService.checkNousConnection as jest.Mock
      ).mockResolvedValue({
        connected: true,
      });

      const res = await controller.checkNousConnection();

      expect(res).toEqual({ connected: true });
      expect(mockPluginService.checkNousConnection).toHaveBeenCalled();
    });
  });
});
