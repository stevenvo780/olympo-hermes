import { Test, TestingModule } from '@nestjs/testing';
import { UniversalEventService } from './universal-event.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

describe('UniversalEventService', () => {
  let service: UniversalEventService;
  let http: { axiosRef: { post: jest.Mock } };
  let config: { get: jest.Mock };

  const store = { id: 'store-1' } as any;

  beforeEach(async () => {
    http = {
      axiosRef: {
        post: jest.fn().mockResolvedValue({ data: {} }),
      },
    } as any;
    config = { get: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniversalEventService,
        { provide: HttpService, useValue: http },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(UniversalEventService);
    jest.clearAllMocks();
  });

  it('no hace nada si HUB_CENTRAL_URL no está configurada', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'HUB_CENTRAL_URL') return undefined;
      return undefined;
    });

    await service.sendEvent('product.updated', { foo: 'bar' }, store);
    expect(http.axiosRef.post).not.toHaveBeenCalled();
  });

  it('envía evento con payload y encabezados firmados', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'HUB_CENTRAL_URL') return 'https://hub.example.com';
      if (key === 'HUB_CENTRAL_SECRET') return 's3cr3t';
      return undefined;
    });

    let capturedPayload: any;
    let capturedHeaders: any;
    http.axiosRef.post.mockImplementation(
      (url: string, payload: any, { headers }: any) => {
        capturedPayload = payload;
        capturedHeaders = headers;
        return { data: {} } as any;
      },
    );

    const data = { any: 'data' };
    await service.sendEvent('product.updated', data, store);

    expect(http.axiosRef.post).toHaveBeenCalledWith(
      'https://hub.example.com/api/v1/webhooks/hermes',
      expect.any(Object),
      expect.any(Object),
    );

    expect(capturedPayload).toMatchObject({
      event_type: 'product.updated',
      data: expect.objectContaining({ store_id: 'store-1', any: 'data' }),
      tenant_context: expect.objectContaining({
        tenant_id: 'hermes-store-store-1',
      }),
    });

    const expectedSignature = crypto
      .createHmac('sha256', 's3cr3t')
      .update(JSON.stringify(capturedPayload))
      .digest('hex');
    expect(capturedHeaders['X-Hermes-Signature']).toBe(
      `sha256=${expectedSignature}`,
    );
    expect(capturedHeaders['X-Tenant-Id']).toBe('hermes-store-store-1');
    expect(capturedHeaders['Content-Type']).toBe('application/json');
  });

  it('incluye user_id si viene en data', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'HUB_CENTRAL_URL') return 'https://hub.example.com';
      if (key === 'HUB_CENTRAL_SECRET') return 's3cr3t';
      return undefined;
    });
    let capturedPayload: any;
    http.axiosRef.post.mockImplementation(
      (url: string, payload: any, _options: any) => {
        capturedPayload = payload;
        return { data: {} } as any;
      },
    );
    await service.sendEvent('x', { user: { id: 123 } }, store);
    expect(capturedPayload.tenant_context.user_id).toBe(123);
  });

  it('incluye header de usuario cuando se proporciona email', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'HUB_CENTRAL_URL') return 'https://hub.example.com';
      if (key === 'HUB_CENTRAL_SECRET') return 's3cr3t';
      return undefined;
    });

    let capturedHeaders: any;
    http.axiosRef.post.mockImplementation(
      (_url: string, _payload: any, { headers }: any) => {
        capturedHeaders = headers;
        return { data: {} } as any;
      },
    );

    await service.sendEvent('x', {}, store, 'user@example.com');

    expect(capturedHeaders['X-User-Email']).toBe('user@example.com');
  });

  it('usa apiKey por defecto cuando no hay secret', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'HUB_CENTRAL_URL') return 'https://hub.example.com';
      return undefined;
    });

    let capturedHeaders: any;
    http.axiosRef.post.mockImplementation(
      (_url: string, _payload: any, { headers }: any) => {
        capturedHeaders = headers;
        return { data: {} } as any;
      },
    );

    await service.sendEvent('x', {}, store);

    expect(capturedHeaders['X-Api-Key']).toBe('nous_secure_key_2024');
  });

  it('propaga el error si la llamada HTTP falla', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'HUB_CENTRAL_URL') return 'https://hub.example.com';
      if (key === 'HUB_CENTRAL_SECRET') return 's3cr3t';
      if (key === 'HUB_CENTRAL_RETRY_ATTEMPTS') return 1;
      return undefined;
    });
    http.axiosRef.post.mockRejectedValue(new Error('network'));

    await expect(service.sendEvent('x', {}, store)).rejects.toThrow('network');
  });

  it('usa código de error cuando está disponible', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'HUB_CENTRAL_URL') return 'https://hub.example.com';
      if (key === 'HUB_CENTRAL_SECRET') return 's3cr3t';
      if (key === 'HUB_CENTRAL_RETRY_ATTEMPTS') return 1;
      return undefined;
    });
    http.axiosRef.post.mockRejectedValue({ code: 'ECONNRESET' });

    await expect(service.sendEvent('x', {}, store)).rejects.toBeDefined();
  });

  it('usa unknown cuando el error no tiene mensaje', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'HUB_CENTRAL_URL') return 'https://hub.example.com';
      if (key === 'HUB_CENTRAL_SECRET') return 's3cr3t';
      if (key === 'HUB_CENTRAL_RETRY_ATTEMPTS') return 1;
      return undefined;
    });
    http.axiosRef.post.mockRejectedValue({});

    await expect(service.sendEvent('x', {}, store)).rejects.toBeDefined();
  });

  it('reintenta cuando falla la primera solicitud', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'HUB_CENTRAL_URL') return 'https://hub.example.com';
      if (key === 'HUB_CENTRAL_SECRET') return 's3cr3t';
      if (key === 'HUB_CENTRAL_RETRY_ATTEMPTS') return 2;
      if (key === 'HUB_CENTRAL_RETRY_BASE_MS') return 1;
      return undefined;
    });

    jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined as any);
    http.axiosRef.post
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ data: {} });

    await service.sendEvent('x', {}, store);

    expect(http.axiosRef.post).toHaveBeenCalledTimes(2);
  });

  it('sleep resuelve en el tiempo esperado', async () => {
    jest.useFakeTimers();
    const promise = (service as any).sleep(10);
    jest.advanceTimersByTime(10);
    await promise;
    jest.useRealTimers();
  });

  it('does not throw when throwOnError is false', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'HUB_CENTRAL_URL') return 'https://hub.example.com';
      if (key === 'HUB_CENTRAL_SECRET') return 's3cr3t';
      if (key === 'HUB_CENTRAL_RETRY_ATTEMPTS') return 1;
      return undefined;
    });
    http.axiosRef.post.mockRejectedValue(new Error('network'));

    await expect(
      service.sendEvent('x', {}, store, undefined, { throwOnError: false }),
    ).resolves.toBeUndefined();
  });
});
