import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, UnauthorizedException } from '@nestjs/common';
import { signPayload } from 'prizma-contracts';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

const TEST_SECRET = 'unit-test-nous-secret';

function buildRequest(rawBody?: string) {
  return { rawBody } as unknown as import('express').Request;
}

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: jest.Mocked<InventoryService>;
  let previousSecret: string | undefined;

  beforeEach(async () => {
    previousSecret = process.env.HUB_CENTRAL_SECRET;
    process.env.HUB_CENTRAL_SECRET = TEST_SECRET;

    const mockInventoryService = {
      syncFromPOS: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
    service = module.get(InventoryService);
  });

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.HUB_CENTRAL_SECRET;
    } else {
      process.env.HUB_CENTRAL_SECRET = previousSecret;
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('syncFromPOS', () => {
    const payload = {
      ventaId: 123,
      storeId: 'store-1',
      items: [
        {
          productId: 1,
          productName: 'Product 1',
          quantitySold: 2,
          unitPrice: 10,
          totalPrice: 20,
        },
      ],
      totalAmount: 20,
      timestamp: '2023-01-01T00:00:00Z',
      source: 'POS',
      metadata: {},
    };


    it('should call service and return success when signature is valid', async () => {
      const serviceResult = { success: true };
      service.syncFromPOS.mockResolvedValue(serviceResult);

      const rawBody = JSON.stringify(payload);
      const signature = signPayload(rawBody, TEST_SECRET);

      const result = await controller.syncFromPOS(
        payload,
        signature,
        buildRequest(rawBody),
      );

      expect(service.syncFromPOS).toHaveBeenCalledWith(payload);
      expect(result.success).toBe(true);
      expect(result.ventaId).toBe(123);
    });

    it('should throw UnauthorizedException when signature is missing', async () => {
      await expect(
        controller.syncFromPOS(
          payload,
          undefined as unknown as string,
          buildRequest(JSON.stringify(payload)),
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when signature is invalid', async () => {
      await expect(
        controller.syncFromPOS(
          payload,
          'sha256=deadbeef',
          buildRequest(JSON.stringify(payload)),
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw HttpException on service failure', async () => {
      service.syncFromPOS.mockRejectedValue(new Error('Internal error'));

      const rawBody = JSON.stringify(payload);
      const signature = signPayload(rawBody, TEST_SECRET);

      await expect(
        controller.syncFromPOS(payload, signature, buildRequest(rawBody)),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('when HUB_CENTRAL_SECRET is not configured', () => {
    it('should refuse to verify even with a valid-looking signature', async () => {
      const previous = process.env.HUB_CENTRAL_SECRET;
      delete process.env.HUB_CENTRAL_SECRET;
      try {
        await expect(
          controller.syncFromPOS(
            {
              ventaId: 1,
              storeId: 's',
              items: [],
              totalAmount: 0,
              timestamp: '',
              source: 'POS',
              metadata: {},
            },
            'sha256=anything',
            buildRequest('{}'),
          ),
        ).rejects.toThrow();
      } finally {
        process.env.HUB_CENTRAL_SECRET = previous;
      }
    });
  });
});
