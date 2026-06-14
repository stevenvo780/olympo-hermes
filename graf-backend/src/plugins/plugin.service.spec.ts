import { Test, TestingModule } from '@nestjs/testing';
import { PluginService } from './plugin.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService as EnvConfigService } from '@nestjs/config';
import { UniversalEventService } from './universal-event.service';
import { BadRequestException } from '@nestjs/common';
import { Store } from '../store/entities/store.entity';

describe('PluginService', () => {
  let service: PluginService;
  let httpService: jest.Mocked<HttpService>;
  let envConfigService: jest.Mocked<EnvConfigService>;
  let universalEventService: jest.Mocked<UniversalEventService>;

  const mockStore: Store = {
    id: '1',
    name: 'Test Store',
    owner: { id: 'owner1', email: 'owner@example.com' } as any,
  } as Store;

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
    };

    const mockEnvConfigService = {
      get: jest.fn(),
    };

    const mockUniversalEventService = {
      sendEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PluginService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: EnvConfigService, useValue: mockEnvConfigService },
        { provide: UniversalEventService, useValue: mockUniversalEventService },
      ],
    }).compile();

    service = module.get<PluginService>(PluginService);
    httpService = module.get(HttpService);
    envConfigService = module.get(EnvConfigService);
    universalEventService = module.get(UniversalEventService);
  });

  describe('emit', () => {
    it('should call universalEventService.sendEvent with correct parameters', async () => {
      await service.emit('test.event', { foo: 'bar' }, mockStore);

      expect(universalEventService.sendEvent).toHaveBeenCalledWith(
        'test.event',
        { foo: 'bar' },
        mockStore,
        'owner@example.com',
        { throwOnError: false },
      );
    });

    it('should handle errors gracefully when sending event', async () => {
      universalEventService.sendEvent.mockRejectedValue(
        new Error('Send failed'),
      );
      const loggerSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();

      await service.emit('test.event', {}, mockStore);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Fallo crítico'),
      );
    });

    it('should handle non-error rejections when sending event', async () => {
      universalEventService.sendEvent.mockRejectedValue('boom');
      const loggerSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();

      await service.emit('test.event', {}, mockStore);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Fallo crítico'),
      );
    });

    it('should warn if universalEventService is not present', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PluginService,
          { provide: HttpService, useValue: { get: jest.fn() } },
          { provide: EnvConfigService, useValue: { get: jest.fn() } },
        ],
      }).compile();
      const noUesService = module.get<PluginService>(PluginService);
      const loggerSpy = jest
        .spyOn(noUesService['logger'], 'warn')
        .mockImplementation();

      await noUesService.emit('test', {}, mockStore);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('UniversalEventService no está disponible'),
      );
    });

    it('should handle missing owner email', async () => {
      const storeWithoutEmail: Store = {
        id: '2',
        name: 'No Email Store',
        owner: {} as any,
      } as Store;

      await service.emit('test.event', { foo: 'bar' }, storeWithoutEmail);

      expect(universalEventService.sendEvent).toHaveBeenCalledWith(
        'test.event',
        { foo: 'bar' },
        storeWithoutEmail,
        undefined,
        { throwOnError: false },
      );
    });
  });

  describe('invoke', () => {
    it('should throw BadRequestException', async () => {
      await expect(service.invoke(mockStore, 'plugin', {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('checkHubCentralConnection', () => {
    it('should return error if URL not configured', async () => {
      envConfigService.get.mockReturnValue(undefined);
      const result = await service.checkHubCentralConnection();
      expect(result.connected).toBe(false);
      expect(result.error).toContain('no configurada');
    });

    it('should return connected if request succeeds', async () => {
      envConfigService.get.mockReturnValue('http://hub');
      httpService.get.mockReturnValue({
        toPromise: jest.fn().mockResolvedValue({ data: { status: 'ok' } }),
      } as any);

      const result = await service.checkHubCentralConnection();
      expect(result.connected).toBe(true);
      expect((result as any).status).toBe('ok');
    });

    it('should return not connected if request fails', async () => {
      envConfigService.get.mockReturnValue('http://hub');
      httpService.get.mockReturnValue({
        toPromise: jest.fn().mockRejectedValue(new Error('Network error')),
      } as any);

      const result = await service.checkHubCentralConnection();
      expect(result.connected).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('getAvailablePlugins', () => {
    it('should return plugins if success', async () => {
      envConfigService.get.mockReturnValue('http://hub');
      const plugins = [{ name: 'p1' }];
      httpService.get.mockReturnValue({
        toPromise: jest.fn().mockResolvedValue({ data: { plugins } }),
      } as any);

      const result = await service.getAvailablePlugins();
      expect(result.plugins).toEqual(plugins);
    });

    it('should return error if URL missing', async () => {
      envConfigService.get.mockReturnValue(undefined);
      const result = await service.getAvailablePlugins();
      expect(result.error).toBeDefined();
    });

    it('should return empty list on error', async () => {
      envConfigService.get.mockReturnValue('http://hub');
      httpService.get.mockReturnValue({
        toPromise: jest.fn().mockRejectedValue(new Error('Err')),
      } as any);
      const loggerSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();

      const result = await service.getAvailablePlugins();
      expect(result.plugins).toEqual([]);
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('getStorePluginConfig', () => {
    it('should return config if success', async () => {
      envConfigService.get.mockReturnValue('http://hub');
      const config = { enabled: true };
      httpService.get.mockReturnValue({
        toPromise: jest.fn().mockResolvedValue({ data: config }),
      } as any);

      const result = await service.getStorePluginConfig(1);
      expect(result).toEqual(config);
    });

    it('should return error if URL missing', async () => {
      envConfigService.get.mockReturnValue(undefined);
      const result = await service.getStorePluginConfig(1);
      expect(result.error).toBeDefined();
    });

    it('should return empty plugins on error', async () => {
      envConfigService.get.mockReturnValue('http://hub');
      httpService.get.mockReturnValue({
        toPromise: jest.fn().mockRejectedValue(new Error('Err')),
      } as any);
      const loggerSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();

      const result = await service.getStorePluginConfig(1);
      expect(result.plugins).toEqual([]);
      expect(loggerSpy).toHaveBeenCalled();
    });
  });
});
