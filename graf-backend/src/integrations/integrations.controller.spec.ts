import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationsController } from './integrations.controller';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { createMockRepository } from '../test/test-utils';

describe('IntegrationsController', () => {
  let controller: IntegrationsController;
  let httpService: any;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockHttpService = {
      axiosRef: {
        get: jest.fn(),
        put: jest.fn(),
      },
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntegrationsController],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(User), useValue: createMockRepository() }, // Needed for guards
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<IntegrationsController>(IntegrationsController);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  describe('getApiSigoConfig', () => {
    it('should fetch config from hub central', async () => {
      configService.get.mockReturnValue('http://hub-url');
      const mockResponse = { data: { config: { triggerEvent: 'test' } } };
      httpService.axiosRef.get.mockResolvedValue(mockResponse);

      const req = { user: { email: 'test@test.com' } } as any;
      const result = await controller.getApiSigoConfig('store-1', req);

      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        expect.stringContaining('hub-url'),
        expect.objectContaining({
          headers: expect.objectContaining({ 'x-user-email': 'test@test.com' }),
        }),
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle missing triggerEvent and payments', async () => {
      configService.get.mockReturnValue('http://hub-url');
      const mockResponse = { data: { config: {} } };
      httpService.axiosRef.get.mockResolvedValue(mockResponse);

      const req = { user: undefined } as any;
      const result = await controller.getApiSigoConfig('store-1', req);

      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        expect.stringContaining('hub-url'),
        expect.objectContaining({
          headers: expect.objectContaining({ 'x-user-email': '' }),
        }),
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle missing config payload', async () => {
      configService.get.mockReturnValue('http://hub-url');
      const mockResponse = { data: {} };
      httpService.axiosRef.get.mockResolvedValue(mockResponse);

      const req = { user: { email: 'test@test.com' } } as any;
      const result = await controller.getApiSigoConfig('store-3', req);

      expect(result).toEqual(mockResponse.data);
    });

    it('should log when payments are present', async () => {
      configService.get.mockReturnValue('http://hub-url');
      const mockResponse = {
        data: { config: { payments: { types: { card: true } } } },
      };
      httpService.axiosRef.get.mockResolvedValue(mockResponse);

      const req = { user: { email: 'pay@test.com' } } as any;
      const result = await controller.getApiSigoConfig('store-2', req);

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateApiSigoConfig', () => {
    it('should update config in hub central', async () => {
      configService.get.mockReturnValue('http://hub-url');
      const mockResponse = { data: { config: { triggerEvent: 'saved' } } };
      httpService.axiosRef.put.mockResolvedValue(mockResponse);

      const req = { user: { email: 'test@test.com' } } as any;
      const body = { some: 'config' };
      const result = await controller.updateApiSigoConfig(
        'store-1',
        req,
        'true',
        body,
      );

      expect(httpService.axiosRef.put).toHaveBeenCalledWith(
        expect.stringContaining('hub-url'),
        { enabled: true, config: body },
        expect.any(Object),
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should map enabled flag to false and handle empty config', async () => {
      configService.get.mockReturnValue('http://hub-url');
      const mockResponse = { data: { config: {} } };
      httpService.axiosRef.put.mockResolvedValue(mockResponse);

      const req = { user: { email: 'test@test.com' } } as any;
      const result = await controller.updateApiSigoConfig(
        'store-1',
        req,
        'false',
        {},
      );

      expect(httpService.axiosRef.put).toHaveBeenCalledWith(
        expect.stringContaining('hub-url'),
        { enabled: false, config: {} },
        expect.any(Object),
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should allow undefined enabled and include payments summary', async () => {
      configService.get.mockReturnValue('http://hub-url');
      const mockResponse = { data: { config: { triggerEvent: '' } } };
      httpService.axiosRef.put.mockResolvedValue(mockResponse);

      const req = { user: { email: 'test@test.com' } } as any;
      const body = {
        triggerEvent: 'order.created',
        payments: { types: { cash: true, card: true } },
      };

      const result = await controller.updateApiSigoConfig(
        'store-1',
        req,
        'maybe',
        body,
      );

      expect(httpService.axiosRef.put).toHaveBeenCalledWith(
        expect.stringContaining('hub-url'),
        { enabled: undefined, config: body },
        expect.any(Object),
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should default configBody when not provided', async () => {
      configService.get.mockReturnValue('http://hub-url');
      const mockResponse = { data: { config: {} } };
      httpService.axiosRef.put.mockResolvedValue(mockResponse);

      const req = { user: { email: 'test@test.com' } } as any;
      const result = await controller.updateApiSigoConfig(
        'store-1',
        req,
        undefined,
        undefined as any,
      );

      expect(httpService.axiosRef.put).toHaveBeenCalledWith(
        expect.stringContaining('hub-url'),
        { enabled: undefined, config: {} },
        expect.any(Object),
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle update response without config', async () => {
      configService.get.mockReturnValue('http://hub-url');
      const mockResponse = { data: {} };
      httpService.axiosRef.put.mockResolvedValue(mockResponse);

      const req = { user: { email: 'test@test.com' } } as any;
      const result = await controller.updateApiSigoConfig(
        'store-1',
        req,
        'true',
        { triggerEvent: '' },
      );

      expect(result).toEqual(mockResponse.data);
    });
  });
});
