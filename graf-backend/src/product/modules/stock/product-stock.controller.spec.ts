import { Test, TestingModule } from '@nestjs/testing';
import { ProductStockController } from './product-stock.controller';
import { ProductStockService } from './product-stock.service';
import { ConflictException } from '@nestjs/common';
import { FirebaseAuthGuard } from '@/auth/firebase-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';

describe('ProductStockController', () => {
  let controller: ProductStockController;

  const mockService = {
    updateStock: jest.fn(),
    decrementStock: jest.fn(),
    incrementStock: jest.fn(),
  } as unknown as jest.Mocked<ProductStockService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductStockController],
      providers: [{ provide: ProductStockService, useValue: mockService }],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(ProductStockController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('updateStock delega a service.updateStock y normaliza source', async () => {
    (mockService.updateStock as any).mockResolvedValue({});
    await controller.updateStock(5, 'store-1', { stock: 7 });
    expect(mockService.updateStock).toHaveBeenCalledWith(
      5,
      'store-1',
      7,
      'nous',
      expect.objectContaining({ stock: 7 }),
    );
  });

  it('updateStock lanza ConflictException si stock negativo', async () => {
    await expect(
      controller.updateStock(5, 'store-1', { stock: -1 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('decrementStock delega a service.decrementStock', async () => {
    (mockService.decrementStock as any).mockResolvedValue({});
    await controller.decrementStock(2, 'store-1', {
      decrementBy: 3,
      source: 'x',
    });
    expect(mockService.decrementStock).toHaveBeenCalledWith(
      2,
      'store-1',
      3,
      'x',
      expect.any(Object),
    );
  });

  it('incrementStock delega a service.incrementStock y valida cantidad', async () => {
    (mockService.incrementStock as any).mockResolvedValue({});
    await controller.incrementStock(2, 'store-1', { quantity: 4 });
    expect(mockService.incrementStock).toHaveBeenCalledWith(
      2,
      'store-1',
      4,
      'nous',
      expect.any(Object),
    );
  });

  it('incrementStock lanza ConflictException si quantity negativa', async () => {
    await expect(
      controller.incrementStock(2, 'store-1', { quantity: -5 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
