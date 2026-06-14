import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStockService } from './product-stock.service';
import { Product } from '../../entities/product.entity';
import { Store } from '@/store/entities/store.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

jest.mock('@/utils/permissions', () => ({
  checkStoreAccess: jest.fn().mockResolvedValue({ id: 'store-1' }),
}));

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepo = <T = any>(): MockRepo<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
});

describe('ProductStockService', () => {
  let service: ProductStockService;
  let productRepo: MockRepo<Product>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductStockService,
        {
          provide: getRepositoryToken(Product),
          useValue: createMockRepo<Product>(),
        },
        {
          provide: getRepositoryToken(Store),
          useValue: createMockRepo<Store>(),
        },
      ],
    }).compile();

    service = module.get(ProductStockService);
    productRepo = module.get(getRepositoryToken(Product));
  });

  it('updateStock actualiza y retorna resumen', async () => {
    (productRepo.findOne as any).mockResolvedValue({
      id: 1,
      stock: 5,
      title: 'P',
    });
    (productRepo.save as any).mockImplementation(async (p: any) => p);

    const res = await service.updateStock(1, 'store-1', 10, 'test');

    expect(res).toMatchObject({ productId: 1, newStock: 10, source: 'test' });
  });

  it('updateStock lanza NotFound si no existe', async () => {
    (productRepo.findOne as any).mockResolvedValue(null);
    await expect(
      service.updateStock(1, 'store-1', 10, 'x'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getStock retorna stock actual y falla si no existe', async () => {
    (productRepo.findOne as any)
      .mockResolvedValueOnce({ stock: 7 })
      .mockResolvedValueOnce(null);
    await expect(service.getStock(1, 's')).resolves.toBe(7);
    await expect(service.getStock(1, 's')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getStock retorna 0 cuando stock es null o 0', async () => {
    (productRepo.findOne as any)
      .mockResolvedValueOnce({ stock: null })
      .mockResolvedValueOnce({ stock: 0 });

    await expect(service.getStock(1, 's')).resolves.toBe(0);
    await expect(service.getStock(1, 's')).resolves.toBe(0);
  });

  it('getLowStockProducts construye query', async () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    } as any;
    (productRepo as any).createQueryBuilder = jest.fn().mockReturnValue(qb);
    const res = await service.getLowStockProducts('s', 5);
    expect(res).toEqual([]);
  });

  it('getLowStockProducts usa threshold por defecto', async () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    } as any;
    (productRepo as any).createQueryBuilder = jest.fn().mockReturnValue(qb);

    await service.getLowStockProducts('s');

    expect(qb.andWhere).toHaveBeenCalledWith(
      'product.stock <= :threshold',
      expect.objectContaining({ threshold: 10 }),
    );
  });

  it('decrementStock decrementa o lanza conflicto', async () => {
    (productRepo.findOne as any)
      .mockResolvedValueOnce({ id: 1, stock: 2, title: 'P' })
      .mockResolvedValueOnce({ id: 1, stock: 1, title: 'P' });
    (productRepo.save as any).mockImplementation(async (p: any) => p);

    await expect(service.decrementStock(1, 's', 3, 'x')).rejects.toBeInstanceOf(
      ConflictException,
    );

    const res = await service.decrementStock(1, 's', 1, 'x');
    expect(res).toMatchObject({ newStock: 0 });
  });

  it('decrementStock lanza NotFound si no existe el producto', async () => {
    (productRepo.findOne as any).mockResolvedValue(null);

    await expect(service.decrementStock(1, 's', 1, 'x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('incrementStock incrementa desde null o valor', async () => {
    (productRepo.findOne as any)
      .mockResolvedValueOnce({ id: 1, stock: null, title: 'P' })
      .mockResolvedValueOnce({ id: 1, stock: 2, title: 'P' });
    (productRepo.save as any).mockImplementation(async (p: any) => p);

    const r1 = await service.incrementStock(1, 's', 5, 'x');
    expect(r1).toMatchObject({ newStock: 5 });
    const r2 = await service.incrementStock(1, 's', 3, 'x');
    expect(r2).toMatchObject({ newStock: 5 });
  });

  it('incrementStock lanza NotFound si no existe el producto', async () => {
    (productRepo.findOne as any).mockResolvedValue(null);

    await expect(service.incrementStock(1, 's', 1, 'x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('generateStockReport calcula métricas agregadas', async () => {
    (productRepo.find as any).mockResolvedValue([
      { id: 1, stock: 5, basePrice: 10 },
      { id: 2, stock: 0, basePrice: 20 },
      { id: 3, stock: 12, basePrice: 5 },
    ]);
    const res = await service.generateStockReport('s', { id: 'u' } as any);
    expect(res).toMatchObject({
      totalProducts: 3,
      totalStock: 17,
      outOfStockProducts: 1,
    });
    expect(res.topProducts.length).toBeGreaterThan(0);
  });
});
