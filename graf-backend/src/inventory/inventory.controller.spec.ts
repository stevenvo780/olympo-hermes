import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { HttpException } from '@nestjs/common';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: jest.Mocked<InventoryService>;

  beforeEach(async () => {
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

    it('should call service and return success', async () => {
      const serviceResult = { success: true };
      service.syncFromPOS.mockResolvedValue(serviceResult);

      const result = await controller.syncFromPOS(payload, 'valid-sig');

      expect(service.syncFromPOS).toHaveBeenCalledWith(payload);
      expect(result.success).toBe(true);
      expect(result.ventaId).toBe(123);
    });

    it('should throw HttpException on service failure', async () => {
      service.syncFromPOS.mockRejectedValue(new Error('Internal error'));

      await expect(controller.syncFromPOS(payload, 'sig')).rejects.toThrow(
        HttpException,
      );
    });
  });
});
