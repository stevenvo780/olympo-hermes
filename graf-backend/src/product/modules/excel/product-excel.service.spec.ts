import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProductExcelService } from './product-excel.service';
import { Product } from '../../entities/product.entity';
import { Store } from '@/store/entities/store.entity';
import { Tax } from '@/tax/entities/tax.entity';
import { Discount } from '@/discount/entities/discount.entity';
import { Category } from '@/category/entities/category.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { checkStoreAccess } from '@/utils/permissions';
import { ImportExcelDto } from '../../dto/import-excel.dto';

jest.mock('@/utils/permissions', () => ({
  checkStoreAccess: jest.fn(),
}));

class MockDataSource {
  query = jest.fn();
  createQueryRunner = jest.fn(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      find: jest.fn(),
      findBy: jest.fn(),
      save: jest.fn(),
    },
  }));
}

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepo = <T = any>(): MockRepo<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('ProductExcelService', () => {
  let service: ProductExcelService;
  let dataSource: MockDataSource;
  let queryRunner: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductExcelService,
        {
          provide: getRepositoryToken(Product),
          useValue: createMockRepo<Product>(),
        },
        {
          provide: getRepositoryToken(Store),
          useValue: createMockRepo<Store>(),
        },
        { provide: getRepositoryToken(Tax), useValue: createMockRepo<Tax>() },
        {
          provide: getRepositoryToken(Discount),
          useValue: createMockRepo<Discount>(),
        },
        {
          provide: getRepositoryToken(Category),
          useValue: createMockRepo<Category>(),
        },
        { provide: DataSource, useClass: MockDataSource },
      ],
    }).compile();

    service = module.get(ProductExcelService);
    dataSource = module.get(DataSource) as any;
    queryRunner = dataSource.createQueryRunner(); // Get the mock instance
    (dataSource.createQueryRunner as jest.Mock).mockReturnValue(queryRunner);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLookupData', () => {
    it('should return catalogs', async () => {
      const storeRepo = (service as any).storeRepository as any;
      storeRepo.findOne.mockResolvedValue({ id: 'store-1' });

      const categoryRepo = (service as any).categoryRepository as any;
      categoryRepo.find.mockResolvedValue([]);
      const taxRepo = (service as any).taxRepository as any;
      taxRepo.find.mockResolvedValue([]);
      const discountRepo = (service as any).discountRepository as any;
      discountRepo.find.mockResolvedValue([]);

      const result = await service.getLookupData('store-1');
      expect(result).toEqual({ categories: [], taxes: [], discounts: [] });
    });

    it('should throw NotFoundException if store not found', async () => {
      const storeRepo = (service as any).storeRepository as any;
      storeRepo.findOne.mockResolvedValue(null);
      await expect(service.getLookupData('x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('releaseStaleLocksForStore', () => {
    it('should attempt to terminate stale locks', async () => {
      dataSource.query
        .mockResolvedValueOnce([
          {
            pid: 123,
            state: 'active',
            duration_seconds: 400,
            query_preview: 'SELECT 1',
          },
        ])
        .mockResolvedValueOnce([]);

      await (service as any).releaseStaleLocksForStore('store-1');

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('pg_stat_activity'),
      );
      expect(dataSource.query).toHaveBeenCalledWith(
        'SELECT pg_terminate_backend($1)',
        [123],
      );
    });

    it('should handle termination errors gracefully', async () => {
      dataSource.query
        .mockResolvedValueOnce([
          {
            pid: 456,
            state: 'active',
            duration_seconds: 400,
            query_preview: 'SELECT 2',
          },
        ])
        .mockRejectedValueOnce(new Error('terminate fail'));

      await (service as any).releaseStaleLocksForStore('store-1');

      expect(dataSource.query).toHaveBeenCalledWith(
        'SELECT pg_terminate_backend($1)',
        [456],
      );
    });

    it('should catch query errors gracefully', async () => {
      dataSource.query.mockRejectedValue(new Error('Query fail'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const originalEval = global.eval;
      (global as any).eval = () => {
        throw new Error('eval fail');
      };

      try {
        await (service as any).releaseStaleLocksForStore('s1');
        expect(consoleSpy).toHaveBeenCalled();
      } finally {
        (global as any).eval = originalEval;
        consoleSpy.mockRestore();
      }
    });
  });

  describe('getAllProductsForExport', () => {
    it('should order hierarchy', async () => {
      const storeRepo = (service as any).storeRepository as any;
      storeRepo.findOne.mockResolvedValue({ id: 's' });
      const productRepo = (service as any).productRepository as any;
      productRepo.find.mockResolvedValue([
        { id: 1 },
        { id: 2, parent: { id: 1 } },
        { id: 3 },
      ]);
      const res = await service.getAllProductsForExport('s');
      expect(res.map((p: any) => p.id)).toEqual([1, 2, 3]);
    });

    it('should sort children by id', async () => {
      const storeRepo = (service as any).storeRepository as any;
      storeRepo.findOne.mockResolvedValue({ id: 's' });
      const productRepo = (service as any).productRepository as any;
      productRepo.find.mockResolvedValue([
        { id: 1 },
        { id: 3, parent: { id: 1 } },
        { id: 2, parent: { id: 1 } },
      ]);

      const res = await service.getAllProductsForExport('s');

      expect(res.map((p: any) => p.id)).toEqual([1, 2, 3]);
    });

    it('should skip already visited products', async () => {
      const storeRepo = (service as any).storeRepository as any;
      storeRepo.findOne.mockResolvedValue({ id: 's' });
      const productRepo = (service as any).productRepository as any;
      productRepo.find.mockResolvedValue([{ id: 1 }, { id: 1 }]);

      const res = await service.getAllProductsForExport('s');

      expect(res.map((p: any) => p.id)).toEqual([1]);
    });

    it('should include orphan products at the end', async () => {
      const storeRepo = (service as any).storeRepository as any;
      storeRepo.findOne.mockResolvedValue({ id: 's' });
      const productRepo = (service as any).productRepository as any;
      productRepo.find.mockResolvedValue([
        { id: 1 },
        { id: 2, parent: { id: 99 } },
      ]);

      const res = await service.getAllProductsForExport('s');

      expect(res.map((p: any) => p.id)).toEqual([1, 2]);
    });

    it('should throw NotFoundException if store not found', async () => {
      const storeRepo = (service as any).storeRepository as any;
      storeRepo.findOne.mockResolvedValue(null);

      await expect(service.getAllProductsForExport('s')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('importExcel', () => {
    const storeId = 'store-1';
    const user: any = { id: 'user-1' };
    const store = { id: storeId };

    it('should import new products', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store); // Store lookup
      queryRunner.manager.findOne.mockResolvedValueOnce(null); // Product lookup (does not exist)

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'NEW-SKU',
            title: 'New Product',
            basePrice: 100,
            stock: 10,
            action: 'create',
          },
        ],
      };

      queryRunner.manager.save.mockResolvedValue({ id: 1 });

      const result = await service.importExcel(dto, storeId, user);

      expect(result.created).toBe(1);
      expect(result.failed).toBe(0);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({
          sku: 'NEW-SKU',
          title: 'New Product',
          basePrice: 100,
          stock: 10,
        }),
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should fail when store is missing in transaction', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(null); // Store missing

      await expect(
        service.importExcel({ rows: [] } as any, storeId, user),
      ).rejects.toThrow('Store not found');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should handle undefined rows gracefully', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);

      const result = await service.importExcel({} as any, storeId, user);

      expect(result).toMatchObject({
        created: 0,
        updated: 0,
        deleted: 0,
        skipped: 0,
        failed: 0,
      });
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should create product with parent and relations', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      queryRunner.manager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 2, sku: 'PARENT' });

      queryRunner.manager.findBy
        .mockResolvedValueOnce([{ id: 1 }])
        .mockResolvedValueOnce([{ id: 2 }])
        .mockResolvedValueOnce([{ id: 3 }]);

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'NEW-SKU',
            title: 'New Product',
            basePrice: 100,
            parentSku: 'PARENT',
            taxIds: [1],
            discountIds: [2],
            categoryIds: [3],
            action: 'create',
          },
        ],
      };

      await service.importExcel(dto, storeId, user);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({
          sku: 'NEW-SKU',
          parent: { id: 2, sku: 'PARENT' },
          taxes: [{ id: 1 }],
          discounts: [{ id: 2 }],
          categories: [{ id: 3 }],
        }),
      );
    });

    it('should create product with blank title and null parent when missing', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      queryRunner.manager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'NEW-BLANK',
            title: '   ',
            description: '',
            basePrice: 0,
            stock: '' as unknown as number,
            parentSku: 'MISSING-PARENT',
            action: 'create',
          } as any,
        ],
      };

      await service.importExcel(dto, storeId, user);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({
          sku: 'NEW-BLANK',
          title: '',
          stock: null,
          enabled: true,
          parent: null,
        }),
      );
    });

    it('should update existing products', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store); // Store
      const existingProduct = { id: 1, sku: 'SKU-1', title: 'Old' };
      queryRunner.manager.findOne.mockResolvedValueOnce(existingProduct); // Product

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'SKU-1',
            title: 'Updated',
            action: 'update',
            basePrice: 100,
          },
        ],
      };

      const result = await service.importExcel(dto, storeId, user);

      expect(result.updated).toBe(1);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({ title: 'Updated' }),
      );
    });

    it('should default action to update when missing', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store); // Store
      const existingProduct = { id: 1, sku: 'SKU-1', title: 'Old' };
      queryRunner.manager.findOne.mockResolvedValueOnce(existingProduct); // Product

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'SKU-1',
            title: 'Default Update',
            basePrice: 100,
          } as any,
        ],
      };

      const result = await service.importExcel(dto, storeId, user);

      expect(result.updated).toBe(1);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({ title: 'Default Update' }),
      );
    });

    it('should preserve title and clear description when values are blank', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      const existingProduct = {
        id: 1,
        sku: 'SKU-1',
        title: 'Keep Title',
        description: 'Old',
        stock: 5,
        parent: { id: 9 },
      };
      queryRunner.manager.findOne.mockResolvedValueOnce(existingProduct);

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'SKU-1',
            title: '   ',
            description: '   ',
            stock: '' as unknown as number,
          } as any,
        ],
      };

      await service.importExcel(dto, storeId, user);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({
          title: 'Keep Title',
          description: '',
          stock: null,
          parent: null,
        }),
      );
    });

    it('should default null title/description and keep zero stock on update', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      const existingProduct = {
        id: 1,
        sku: 'SKU-NULL',
        title: 'Keep Title',
        description: 'Old',
        stock: 5,
      };
      queryRunner.manager.findOne.mockResolvedValueOnce(existingProduct);

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'SKU-NULL',
            title: null as any,
            description: null as any,
            stock: 0,
            basePrice: 0,
          } as any,
        ],
      };

      await service.importExcel(dto, storeId, user);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({
          title: 'Keep Title',
          description: '',
          stock: 0,
        }),
      );
    });

    it('should update longDescription when provided', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      const existingProduct = {
        id: 1,
        sku: 'SKU-LONG',
        title: 'Product',
        longDescription: 'Old long description',
      };
      queryRunner.manager.findOne.mockResolvedValueOnce(existingProduct);

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'SKU-LONG',
            longDescription: 'New long description',
          } as any,
        ],
      };

      await service.importExcel(dto, storeId, user);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({
          longDescription: 'New long description',
        }),
      );
    });

    it('should clear longDescription when blank string provided', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      const existingProduct = {
        id: 1,
        sku: 'SKU-LONG-BLANK',
        title: 'Product',
        longDescription: 'Existing description',
      };
      queryRunner.manager.findOne.mockResolvedValueOnce(existingProduct);

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'SKU-LONG-BLANK',
            longDescription: '   ',
          } as any,
        ],
      };

      await service.importExcel(dto, storeId, user);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({
          longDescription: '',
        }),
      );
    });

    it('should handle null longDescription on update', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      const existingProduct = {
        id: 1,
        sku: 'SKU-LONG-NULL',
        title: 'Product',
        longDescription: 'Existing',
      };
      queryRunner.manager.findOne.mockResolvedValueOnce(existingProduct);

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'SKU-LONG-NULL',
            longDescription: null,
          } as any,
        ],
      };

      await service.importExcel(dto, storeId, user);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({
          longDescription: '',
        }),
      );
    });

    it('should update existing product fields and relations', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      const existingProduct = {
        id: 1,
        sku: 'SKU-1',
        title: 'Old',
        description: 'Old',
        stock: 10,
      };
      queryRunner.manager.findOne
        .mockResolvedValueOnce(existingProduct)
        .mockResolvedValueOnce({ id: 2, sku: 'PARENT' });

      queryRunner.manager.findBy
        .mockResolvedValueOnce([{ id: 1 }])
        .mockResolvedValueOnce([{ id: 2 }])
        .mockResolvedValueOnce([{ id: 3 }]);

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'SKU-1',
            title: 'Updated',
            description: 'New Desc',
            stock: '' as any,
            basePrice: 100,
            enabled: false,
            images: ['img'],
            parentSku: 'PARENT',
            taxIds: [1],
            discountIds: [2],
            categoryIds: [3],
            action: 'update',
          },
        ],
      };

      await service.importExcel(dto, storeId, user);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({
          title: 'Updated',
          description: 'New Desc',
          stock: null,
          enabled: false,
          images: ['img'],
          parent: { id: 2, sku: 'PARENT' },
        }),
      );
    });

    it('should update stock and clear relations when arrays are empty', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      const existingProduct = {
        id: 1,
        sku: 'SKU-1',
        title: 'Old',
        stock: 10,
        parent: { id: 9 },
      };
      queryRunner.manager.findOne.mockResolvedValueOnce(existingProduct);

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'SKU-1',
            title: 'Old',
            basePrice: 0,
            stock: 5,
            taxIds: [],
            discountIds: [],
            categoryIds: [],
            action: 'update',
          },
        ],
      };

      await service.importExcel(dto, storeId, user);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({
          stock: 5,
          taxes: [],
          discounts: [],
          categories: [],
        }),
      );
    });

    it('should set parent to null when parentSku not found', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      const existingProduct = {
        id: 1,
        sku: 'SKU-1',
        parent: { id: 2 },
      };
      queryRunner.manager.findOne
        .mockResolvedValueOnce(existingProduct)
        .mockResolvedValueOnce(null);

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'SKU-1',
            title: 'Test',
            basePrice: 0,
            parentSku: 'MISSING-PARENT',
            action: 'update',
          },
        ],
      };

      await service.importExcel(dto, storeId, user);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({ parent: null }),
      );
    });

    it('should keep parent when parentSku points to self', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      const existingProduct = {
        id: 1,
        sku: 'SKU-1',
        parent: { id: 2 },
      };
      queryRunner.manager.findOne.mockResolvedValueOnce(existingProduct);

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'SKU-1',
            title: 'Test',
            basePrice: 0,
            parentSku: 'SKU-1',
            action: 'update',
          },
        ],
      };

      await service.importExcel(dto, storeId, user);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({ parent: { id: 2 } }),
      );
    });

    it('should handle delete action', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      const existingProduct = { id: 1, sku: 'SKU-1', enabled: true };
      queryRunner.manager.findOne.mockResolvedValueOnce(existingProduct);

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'SKU-1',
            action: 'delete',
            title: 'Delete Me',
            basePrice: 0,
          },
        ],
      };

      const result = await service.importExcel(dto, storeId, user);

      expect(result.deleted).toBe(1);
      expect(existingProduct.enabled).toBe(false);
      expect(queryRunner.manager.save).toHaveBeenCalled();
    });

    it('should skip delete when product does not exist', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(null);

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'MISSING-SKU',
            action: 'delete',
            title: 'Missing',
            basePrice: 0,
          },
        ],
      };

      const result = await service.importExcel(dto, storeId, user);

      expect(result.skipped).toBe(1);
      expect(result.results[0].status).toBe('skipped');
    });

    it('should handle failures per row', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);

      // First row fails (no sku)
      // Second row throws error during processing
      queryRunner.manager.findOne.mockRejectedValueOnce(
        new Error('Processing Error'),
      );

      const dto: ImportExcelDto = {
        rows: [
          { sku: '', action: 'create', title: 'N/A', basePrice: 0 }, // Invalid
          { sku: 'SKU-ERROR', action: 'create', title: 'Error', basePrice: 0 }, // Causes error
        ],
      };

      const result = await service.importExcel(dto, storeId, user);

      expect(result.failed).toBe(2);
    });

    it('should handle non-Error row failures', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      queryRunner.manager.findOne.mockImplementation(() => {
        throw 'boom';
      });

      const dto: ImportExcelDto = {
        rows: [{ sku: 'SKU-1', action: 'create', title: 'X', basePrice: 0 }],
      };

      const result = await service.importExcel(dto, storeId, user);

      expect(result.results[0].message).toContain('Error desconocido');
    });

    it('should delete products not in excel if option enabled', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      queryRunner.manager.findOne.mockResolvedValue(null); // No incoming products exist yet (simulating creation)

      // existing products in DB
      const p1 = { id: 1, sku: 'KEEP-ME', enabled: true };
      const p2 = { id: 2, sku: 'DELETE-ME', enabled: true };
      queryRunner.manager.find.mockResolvedValue([p1, p2]);

      const dto: ImportExcelDto = {
        rows: [
          { sku: 'KEEP-ME', action: 'update', title: 'Keep', basePrice: 10 },
        ],
        deleteProductsNotInExcel: true,
      };

      const result = await service.importExcel(dto, storeId, user);

      expect(result.created).toBe(1);
      expect(result.deleted).toBe(1); // p2 deleted
      expect(p2.enabled).toBe(false);
    });

    it('should swallow errors during bulk delete', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      queryRunner.manager.findOne.mockResolvedValue(null);

      const p1 = { id: 1, sku: 'd', enabled: true };
      queryRunner.manager.find.mockResolvedValue([p1]);
      // Fail the save inside the loop
      queryRunner.manager.save.mockRejectedValue(new Error('Delete fail'));

      const dto: ImportExcelDto = {
        rows: [],
        deleteProductsNotInExcel: true,
      };

      const result = await service.importExcel(dto, storeId, user);
      // No failure reported because it's swallowed
      expect(result.results).toHaveLength(0);
    });

    it('should rollback and throw BadRequestException on general error', async () => {
      (checkStoreAccess as jest.Mock).mockImplementation(() => {
        throw new Error('Access Denied');
      });

      await expect(
        service.importExcel({ rows: [] } as any, storeId, user),
      ).rejects.toThrow(BadRequestException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should map statement timeout to friendly message', async () => {
      (checkStoreAccess as jest.Mock).mockImplementation(() => {
        throw new Error('statement timeout');
      });

      await expect(
        service.importExcel({ rows: [] } as any, storeId, user),
      ).rejects.toThrow(
        'La importación tardó demasiado (timeout). Intenta con menos productos o contacta a soporte.',
      );
    });

    it('should map lock timeout to friendly message', async () => {
      (checkStoreAccess as jest.Mock).mockImplementation(() => {
        throw new Error('lock timeout');
      });

      await expect(
        service.importExcel({ rows: [] } as any, storeId, user),
      ).rejects.toThrow(
        'La base de datos está ocupada. Espera unos segundos e intenta nuevamente.',
      );
    });

    it('should associate relations (tax, discount, category)', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(null); // new product

      const tax = { id: 1 };
      const discount = { id: 2 };
      const category = { id: 3 };

      queryRunner.manager.findBy
        .mockResolvedValueOnce([tax]) // tax
        .mockResolvedValueOnce([discount]) // discount
        .mockResolvedValueOnce([category]); // category

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'REL-SKU',
            taxIds: [1],
            discountIds: [2],
            categoryIds: [3],
            action: 'create',
            title: 'Rel Product',
            basePrice: 100,
          },
        ],
      };

      await service.importExcel(dto, storeId, user);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({
          taxes: [tax],
          discounts: [discount],
          categories: [category],
        }),
      );
    });

    it('should create product with defaults and missing parent', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(null);
      queryRunner.manager.findOne.mockResolvedValueOnce(null); // parent lookup returns null

      const dto: ImportExcelDto = {
        rows: [{ sku: 'SKU-EMPTY', title: '', basePrice: 0, action: 'create' }],
      };

      await service.importExcel(dto, storeId, user);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({
          sku: 'SKU-EMPTY',
          title: '',
          description: '',
          basePrice: 0,
          enabled: true,
          images: [],
          stock: null,
        }),
      );
    });

    it('should create product with null title and zero stock', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(null);

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'SKU-NULL',
            title: null as any,
            description: null as any,
            basePrice: 0,
            stock: 0,
            action: 'create',
          } as any,
        ],
      };

      await service.importExcel(dto, storeId, user);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({
          sku: 'SKU-NULL',
          title: '',
          description: '',
          stock: 0,
        }),
      );
    });

    it('should honor enabled flag and images on create', async () => {
      (checkStoreAccess as jest.Mock).mockResolvedValue(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(null);

      const dto: ImportExcelDto = {
        rows: [
          {
            sku: 'SKU-IMG',
            title: 'With images',
            basePrice: 10,
            enabled: false,
            images: ['img1'],
            action: 'create',
          },
        ],
      };

      await service.importExcel(dto, storeId, user);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Product,
        expect.objectContaining({
          sku: 'SKU-IMG',
          enabled: false,
          images: ['img1'],
        }),
      );
    });
  });
});
