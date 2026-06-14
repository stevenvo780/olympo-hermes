import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { ProductStockService } from '@/product/modules/stock/product-stock.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let productStockService: jest.Mocked<ProductStockService>;

  beforeEach(async () => {
    const mockProductStockService = {
      decrementStock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: ProductStockService,
          useValue: mockProductStockService,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    productStockService = module.get(ProductStockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
        {
          productId: 2,
          productName: 'Product 2',
          quantitySold: 1,
          unitPrice: 5,
          totalPrice: 5,
        },
      ],
      totalAmount: 25,
      timestamp: '2023-01-01T00:00:00Z',
      source: 'POS',
      metadata: {},
    };

    it('should successfully sync items from POS', async () => {
      productStockService.decrementStock.mockResolvedValue({
        newStock: 8,
      } as any);

      const result = await service.syncFromPOS(payload);

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(2);
      expect(productStockService.decrementStock).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures', async () => {
      productStockService.decrementStock
        .mockResolvedValueOnce({ newStock: 8 } as any)
        .mockRejectedValueOnce(new Error('Stock error'));

      const result = await service.syncFromPOS(payload);

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].error).toBe('Stock error');
    });

    it('should use fallback when newStock is falsy', async () => {
      productStockService.decrementStock.mockResolvedValue({
        newStock: 0,
      } as any);

      const result = await service.syncFromPOS({
        ...payload,
        items: [
          {
            productId: 1,
            productName: 'Product 1',
            quantitySold: 2,
            unitPrice: 10,
            totalPrice: 20,
          },
        ],
      });

      expect(result.results[0].newStock).toBe('unknown');
    });

    it('should throw error if general failure occurs', async () => {
      await expect(
        service.syncFromPOS({ ...payload, items: undefined } as any),
      ).rejects.toThrow();
    });
  });
});
