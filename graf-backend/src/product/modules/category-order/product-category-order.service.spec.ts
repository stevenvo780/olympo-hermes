import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProductCategoryOrderService } from './product-category-order.service';
import { Product } from '../../entities/product.entity';
import { ProductCategoryOrder } from '../../entities/product-category-order.entity';
import { Category } from '@/category/entities/category.entity';
import { Store } from '@/store/entities/store.entity';
import { NotFoundException } from '@nestjs/common';

class MockDataSource {
  transaction = jest.fn(async (fn: any) => {
    const manager = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((entity, data) => ({ ...data })),
      save: jest.fn((entity, data) => Promise.resolve({ id: 1, ...data })),
      update: jest.fn(),
    };
    return fn(manager);
  });
}

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepo = <T = any>(): MockRepo<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('ProductCategoryOrderService', () => {
  let service: ProductCategoryOrderService;
  let dataSource: MockDataSource;
  let categoryRepo: MockRepo<Category>;
  let productCategoryOrderRepo: MockRepo<ProductCategoryOrder>;

  beforeEach(async () => {
    categoryRepo = createMockRepo<Category>();
    productCategoryOrderRepo = createMockRepo<ProductCategoryOrder>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCategoryOrderService,
        {
          provide: getRepositoryToken(Product),
          useValue: createMockRepo<Product>(),
        },
        {
          provide: getRepositoryToken(ProductCategoryOrder),
          useValue: productCategoryOrderRepo,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: categoryRepo,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: createMockRepo<Store>(),
        },
        { provide: DataSource, useClass: MockDataSource },
      ],
    }).compile();

    service = module.get(ProductCategoryOrderService);
    dataSource = module.get(DataSource) as any;
  });

  describe('updateProductCategoryOrder', () => {
    it('debe lanzar NotFoundException si producto no existe', async () => {
      (dataSource.transaction as any).mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
        };
        return fn(manager);
      });

      await expect(
        service.updateProductCategoryOrder(1, 1, 1, 'store-1', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar NotFoundException si categoría no existe', async () => {
      (dataSource.transaction as any).mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest
            .fn()
            .mockResolvedValueOnce({ id: 1, categories: [] })
            .mockResolvedValueOnce(null),
        };
        return fn(manager);
      });

      await expect(
        service.updateProductCategoryOrder(1, 1, 1, 'store-1', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar NotFoundException si producto no pertenece a categoría', async () => {
      (dataSource.transaction as any).mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest
            .fn()
            .mockResolvedValueOnce({ id: 1, categories: [{ id: 2 }] })
            .mockResolvedValueOnce({ id: 3 }),
        };
        return fn(manager);
      });

      await expect(
        service.updateProductCategoryOrder(1, 3, 1, 'store-1', {} as any),
      ).rejects.toThrow('El producto no pertenece a esta categoría');
    });

    it('debe actualizar orden correctamente', async () => {
      const mockOrder = {
        id: 1,
        product: { id: 1, enabled: true },
        category: { id: 1 },
        orderInCategory: 1,
      };
      (dataSource.transaction as any).mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest
            .fn()
            .mockResolvedValueOnce({
              id: 1,
              categories: [{ id: 1 }],
              enabled: true,
            })
            .mockResolvedValueOnce({ id: 1 })
            .mockResolvedValueOnce(mockOrder),
          find: jest.fn().mockResolvedValue([mockOrder]),
          update: jest.fn(),
        };
        return fn(manager);
      });

      const result = await service.updateProductCategoryOrder(
        1,
        1,
        1,
        'store-1',
        {} as any,
      );
      expect(result).toBeDefined();
    });

    it('debe crear una nueva orden si no existe', async () => {
      (dataSource.transaction as any).mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest
            .fn()
            .mockResolvedValueOnce({
              id: 1,
              categories: [{ id: 1 }],
              enabled: true,
            })
            .mockResolvedValueOnce({ id: 1 })
            .mockResolvedValueOnce(null),
          find: jest.fn().mockResolvedValue([]),
          create: jest.fn().mockReturnValue({ id: 2, product: { id: 1 } }),
          save: jest.fn().mockResolvedValue({ id: 2 }),
          update: jest.fn(),
        };
        return fn(manager);
      });

      await service.updateProductCategoryOrder(1, 1, 1, 'store-1', {} as any);
    });

    it('debe retornar la orden actual si la posición no cambia (oldIndex === newIndex)', async () => {
      const mockOrder = {
        id: 1,
        product: { id: 1, enabled: true },
        category: { id: 1 },
        orderInCategory: 1,
      };
      (dataSource.transaction as any).mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest
            .fn()
            .mockResolvedValueOnce({
              id: 1,
              categories: [{ id: 1 }],
              enabled: true,
            })
            .mockResolvedValueOnce({ id: 1 }),
          find: jest.fn().mockResolvedValue([mockOrder]),
        };
        return fn(manager);
      });

      const result = await service.updateProductCategoryOrder(
        1,
        1,
        1,
        'store-1',
        {} as any,
      );
      expect(result).toBeDefined();
    });

    it('debe crear orden con indice correcto si ya existen otras ordenes', async () => {
      const otherOrder = {
        id: 2,
        product: { id: 2, enabled: true },
        orderInCategory: 5,
      };
      (dataSource.transaction as any).mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest
            .fn()
            .mockResolvedValueOnce({
              id: 1,
              categories: [{ id: 1 }],
              enabled: true,
            })
            .mockResolvedValueOnce({ id: 1 })
            .mockResolvedValueOnce(null),
          find: jest.fn().mockResolvedValue([otherOrder]),
          create: jest.fn().mockReturnValue({ id: 1, product: { id: 1 } }),
          save: jest.fn(),
          update: jest.fn(),
        };
        return fn(manager);
      });

      await service.updateProductCategoryOrder(1, 1, 1, 'store-1', {} as any);
    });

    it('debe mover la orden y actualizar indices', async () => {
      const order1 = {
        id: 1,
        product: { id: 1, enabled: true },
        orderInCategory: 1,
      };
      const order2 = {
        id: 2,
        product: { id: 2, enabled: true },
        orderInCategory: 2,
      };
      (dataSource.transaction as any).mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest
            .fn()
            .mockResolvedValueOnce({
              id: 1,
              categories: [{ id: 1 }],
              enabled: true,
            })
            .mockResolvedValueOnce({ id: 1 })
            .mockResolvedValueOnce(order1),
          find: jest.fn().mockResolvedValue([order1, order2]),
          update: jest.fn(),
        };
        return fn(manager);
      });

      await service.updateProductCategoryOrder(1, 1, 2, 'store-1', {} as any);
    });
  });

  describe('getProductCategoryOrders', () => {
    it('debe lanzar NotFoundException si categoría no existe', async () => {
      (categoryRepo.findOne as any).mockResolvedValue(null);

      await expect(
        service.getProductCategoryOrders(1, 'store-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe retornar órdenes de productos para categoría', async () => {
      const mockCategory = { id: 1, store: { id: 'store-1' } };
      const mockOrders = [
        { id: 1, product: { id: 1 }, orderInCategory: 1 },
        { id: 2, product: { id: 2 }, orderInCategory: 2 },
      ];
      (categoryRepo.findOne as any).mockResolvedValue(mockCategory);
      (productCategoryOrderRepo.find as any).mockResolvedValue(mockOrders);

      const result = await service.getProductCategoryOrders(1, 'store-1');
      expect(result).toEqual(mockOrders);
    });
  });

  describe('syncProductCategoryOrders', () => {
    it('debe procesar categorías para un producto', async () => {
      (dataSource.transaction as any).mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue({ id: 1 }),
          find: jest.fn().mockResolvedValue([{ category: { id: 1 } }]),
          remove: jest.fn(),
          createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockResolvedValue({ max: 5 }),
          }),
          create: jest.fn((entity, data) => data),
          save: jest.fn(),
        };
        return fn(manager);
      });

      await service.syncProductCategoryOrders(1, [1, 2], 'store-1');

      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('debe retornar si el producto no existe', async () => {
      (dataSource.transaction as any).mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
          find: jest.fn(),
          remove: jest.fn(),
        };
        return fn(manager);
      });

      await service.syncProductCategoryOrders(1, [1, 2], 'store-1');
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('debe eliminar ordenes que ya no estan en la lista', async () => {
      (dataSource.transaction as any).mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue({ id: 1 }),
          find: jest
            .fn()
            .mockResolvedValue([
              { category: { id: 1 } },
              { category: { id: 3 } },
            ]),
          remove: jest.fn(),
          createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockResolvedValue({ max: 5 }),
          }),
          create: jest.fn((entity, data) => data),
          save: jest.fn(),
        };
        return fn(manager);
      });

      await service.syncProductCategoryOrders(1, [1, 2], 'store-1');
    });

    it('debe asignar orden 1 si es el primer producto en la categoria', async () => {
      (dataSource.transaction as any).mockImplementation(async (fn: any) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue({ id: 1 }),
          find: jest.fn().mockResolvedValue([]),
          remove: jest.fn(),
          createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockResolvedValue(null),
          }),
          create: jest.fn((entity, data) => data),
          save: jest.fn(),
        };
        return fn(manager);
      });

      await service.syncProductCategoryOrders(1, [1], 'store-1');
    });
  });
});
