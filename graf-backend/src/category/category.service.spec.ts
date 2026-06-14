import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Store } from '../store/entities/store.entity';
import { Product } from '../product/entities/product.entity';
import { DataSource } from 'typeorm';
import {
  ConflictException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  createMockRepository,
  createTestUser,
  createTestCategory,
  createTestStore,
  MockRepository,
} from '../test/test-utils';

jest.mock('../utils/permissions', () => ({
  checkStoreAccess: jest.fn(),
}));

describe('CategoryService', () => {
  let service: CategoryService;
  let categoryRepository: MockRepository<Category>;
  let storeRepository: MockRepository<Store>;
  let queryRunner: any;

  beforeEach(async () => {
    const mockCategoryRepository = createMockRepository<Category>();
    const mockStoreRepository = createMockRepository<Store>();
    const mockProductRepository = createMockRepository<Product>();

    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        find: jest.fn(),
        remove: jest.fn(),
        count: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(0),
        })),
      } as any,
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
        { provide: getRepositoryToken(Store), useValue: mockStoreRepository },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    categoryRepository = module.get(getRepositoryToken(Category));
    storeRepository = module.get(getRepositoryToken(Store));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    const user = createTestUser();
    const storeId = 'store-1';

    it('should create a root category', async () => {
      const dto = { name: 'Root', description: 'Desc' };
      const store = createTestStore({ id: storeId });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      categoryRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxPosition: 0 }),
      });

      categoryRepository.create.mockReturnValue({ ...dto, store });
      categoryRepository.save.mockResolvedValue({ id: 1, ...dto, store });

      const result = await service.createCategory(dto, storeId, user);

      expect(result.id).toBe(1);
      expect(categoryRepository.save).toHaveBeenCalled();
    });

    it('should create a subcategory', async () => {
      const dto = { name: 'Child', parentId: 10 };
      const store = createTestStore({ id: storeId });
      const parent = createTestCategory({ id: 10, store });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      categoryRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxPosition: 0 }),
      });

      categoryRepository.findOne.mockResolvedValue(parent);
      categoryRepository.create.mockReturnValue({ ...dto, store, parent });
      categoryRepository.save.mockResolvedValue({
        id: 2,
        ...dto,
        store,
        parent,
      });

      const result = await service.createCategory(dto, storeId, user);

      expect(result.parent).toEqual(parent);
    });

    it('should throw ConflictException on duplicate name', async () => {
      const dto = { name: 'Duplicate' };
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(createTestStore());

      categoryRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxPosition: 0 }),
      });

      categoryRepository.create.mockReturnValue(dto as Category);
      const error = { code: '23505', message: 'Duplicate' } as unknown as {
        code: string;
        message: string;
      };
      categoryRepository.save.mockRejectedValue(error);

      await expect(service.createCategory(dto, storeId, user)).rejects.toThrow(
        ConflictException,
      );
    });
    it('should throw NotFoundException if parent category not found', async () => {
      const dto = { name: 'Child', parentId: 99 };
      const store = createTestStore({ id: storeId });
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      categoryRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxPosition: 0 }),
      });

      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.createCategory(dto, storeId, user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use provided position', async () => {
      const dto = { name: 'Pos', position: 10 };
      const store = createTestStore({ id: storeId });
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      categoryRepository.create.mockReturnValue({ ...dto, store });
      categoryRepository.save.mockResolvedValue({ id: 1, ...dto, store });

      const result = await service.createCategory(dto, storeId, user);
      expect(result.position).toBe(10);
      expect(categoryRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should throw generic error', async () => {
      const dto = { name: 'Error' };
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(createTestStore());

      categoryRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxPosition: 0 }),
      });

      categoryRepository.create.mockReturnValue(dto);
      categoryRepository.save.mockRejectedValue(new Error('Generic'));

      await expect(service.createCategory(dto, storeId, user)).rejects.toThrow(
        'Generic',
      );
    });
  });

  describe('findByStoreHierarchical', () => {
    it('should throw NotFoundException if store not found', async () => {
      storeRepository.findOne.mockResolvedValue(null);
      await expect(service.findByStoreHierarchical('s1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return hierarchical structure', async () => {
      const storeId = 'store-1';
      const parent = createTestCategory({ id: 1, position: 1 });
      const child = createTestCategory({ id: 2, position: 2, parent });

      storeRepository.findOne.mockResolvedValue({ id: storeId });
      categoryRepository.find.mockResolvedValue([parent, child]);

      const result = await service.findByStoreHierarchical(storeId);

      expect(result.length).toBe(1); // Only root
      expect(result[0].id).toBe(1);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe(2);
    });

    it('should sort root categories by position', async () => {
      const storeId = 'store-1';
      const rootA = createTestCategory({ id: 1, position: 2 });
      const rootB = createTestCategory({ id: 2, position: 1 });

      storeRepository.findOne.mockResolvedValue({ id: storeId });
      categoryRepository.find.mockResolvedValue([rootA, rootB]);

      const result = await service.findByStoreHierarchical(storeId);

      expect(result[0].id).toBe(2);
      expect(result[1].id).toBe(1);
    });
  });

  describe('importExcel', () => {
    it('should import categories transactionally', async () => {
      const dto = { rows: [{ name: 'Cat 1', description: 'D1' }] };
      const storeId = 'store-1';
      const user = createTestUser();
      const store = createTestStore({ id: storeId });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      queryRunner.manager.findOne.mockResolvedValueOnce(null); // Existing check by name (skipped ID check as row has no ID)
      queryRunner.manager.findOne.mockResolvedValueOnce(store); // Store fetch for creation

      queryRunner.manager.save.mockResolvedValue({});

      const result = await service.importExcel(dto as any, storeId, user);

      expect(result.created).toBe(1);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should fail rows with empty category name', async () => {
      const dto = { rows: [{ name: '   ' }] };
      const storeId = 'store-1';
      const user = createTestUser();
      const store = createTestStore({ id: storeId });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      const result = await service.importExcel(dto as any, storeId, user);

      expect(result.failed).toBe(1);
      expect(result.results[0].message).toContain('Nombre de categoría vacío');
    });

    it('should update existing categories when changes are detected', async () => {
      const dto = { rows: [{ id: 1, name: 'Updated', position: 2 }] };
      const storeId = 'store-1';
      const user = createTestUser();
      const store = createTestStore({ id: storeId });
      const existing = createTestCategory({ id: 1, name: 'Old', store });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      queryRunner.manager.findOne.mockResolvedValueOnce(existing);
      queryRunner.manager.save.mockResolvedValue(existing);

      const result = await service.importExcel(dto as any, storeId, user);

      expect(result.updated).toBe(1);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Category,
        expect.objectContaining({ name: 'Updated', position: 2 }),
      );
    });

    it('should update description, image, and parent when provided', async () => {
      const dto = {
        rows: [
          {
            id: 1,
            name: 'Cat',
            description: '',
            imageUrl: '',
            parentId: 2,
          },
        ],
      };
      const storeId = 'store-1';
      const user = createTestUser();
      const store = createTestStore({ id: storeId });
      const existingParent = createTestCategory({ id: 1, store });
      const existing = createTestCategory({
        id: 1,
        name: 'Cat',
        description: 'Old',
        imageUrl: 'old',
        store,
        parent: existingParent,
      });
      const newParent = createTestCategory({ id: 2, store });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      queryRunner.manager.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(newParent);
      queryRunner.manager.save.mockResolvedValue(existing);

      const result = await service.importExcel(dto as any, storeId, user);

      expect(result.updated).toBe(1);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Category,
        expect.objectContaining({
          description: '',
          imageUrl: '',
          parent: newParent,
        }),
      );
    });

    it('should clear parent when parentId is null during update', async () => {
      const dto = { rows: [{ id: 1, name: 'Cat', parentId: null }] };
      const storeId = 'store-1';
      const user = createTestUser();
      const store = createTestStore({ id: storeId });
      const existing = createTestCategory({ id: 1, name: 'Cat', store });
      existing.parent = createTestCategory({ id: 2, store });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      queryRunner.manager.findOne.mockResolvedValueOnce(existing);
      queryRunner.manager.save.mockResolvedValue(existing);

      const result = await service.importExcel(dto as any, storeId, user);

      expect(result.updated).toBe(1);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Category,
        expect.objectContaining({ parent: null }),
      );
    });

    it('should skip existing categories with no changes', async () => {
      const dto = { rows: [{ id: 1, name: 'Same' }] };
      const storeId = 'store-1';
      const user = createTestUser();
      const store = createTestStore({ id: storeId });
      const existing = createTestCategory({ id: 1, name: 'Same', store });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      queryRunner.manager.findOne.mockResolvedValueOnce(existing);

      const result = await service.importExcel(dto as any, storeId, user);

      expect(result.skipped).toBe(1);
      expect(result.results[0].status).toBe('skipped');
    });

    it('should throw ConflictException on duplicate names in excel', async () => {
      const dto = { rows: [{ name: 'Cat 1' }, { name: 'Cat 1' }] };
      await expect(
        service.importExcel(dto as any, 's1', createTestUser()),
      ).rejects.toThrow(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should delete categories not in excel', async () => {
      const dto = { rows: [], deleteCategoriesNotInExcel: true };
      const storeId = 's1';
      const store = createTestStore({ id: storeId });
      const catToDelete = createTestCategory({ id: 10, store });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      queryRunner.manager.find.mockResolvedValue([catToDelete]);
      queryRunner.manager.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0), // 0 products
      });
      queryRunner.manager.count.mockResolvedValue(0); // 0 children
      queryRunner.manager.remove.mockResolvedValue({});

      const result = await service.importExcel(
        dto as any,
        storeId,
        createTestUser(),
      );

      expect(result.deleted).toBe(1);
      expect(queryRunner.manager.remove).toHaveBeenCalledWith(
        Category,
        catToDelete,
      );
    });

    it('should use excel ids when deleting categories', async () => {
      const dto = { rows: [{ id: 1 }], deleteCategoriesNotInExcel: true };
      const storeId = 's1';
      const store = createTestStore({ id: storeId });
      const keepCategory = createTestCategory({ id: 1, store });
      const deleteCategory = createTestCategory({ id: 2, store });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      queryRunner.manager.find.mockResolvedValue([
        keepCategory,
        deleteCategory,
      ]);
      queryRunner.manager.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });
      queryRunner.manager.count.mockResolvedValue(0);
      queryRunner.manager.remove.mockResolvedValue({});

      const result = await service.importExcel(
        dto as any,
        storeId,
        createTestUser(),
      );

      expect(result.deleted).toBe(1);
      expect(queryRunner.manager.remove).toHaveBeenCalledWith(
        Category,
        deleteCategory,
      );
    });

    it('should create category with parent when provided', async () => {
      const dto = { rows: [{ name: 'Child', parentId: 5 }] };
      const storeId = 'store-1';
      const user = createTestUser();
      const store = createTestStore({ id: storeId });
      const parent = createTestCategory({ id: 5, store });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      queryRunner.manager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(store)
        .mockResolvedValueOnce(parent);
      queryRunner.manager.save.mockResolvedValue({});

      const result = await service.importExcel(dto as any, storeId, user);

      expect(result.created).toBe(1);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Category,
        expect.objectContaining({ parent }),
      );
    });

    it('should not delete category if it has products', async () => {
      const dto = { rows: [], deleteCategoriesNotInExcel: true };
      const storeId = 's1';
      const catToDelete = createTestCategory({ id: 10 });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(createTestStore({ id: storeId }));

      queryRunner.manager.find.mockResolvedValue([catToDelete]);
      queryRunner.manager.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5), // 5 products
      });

      const result = await service.importExcel(
        dto as any,
        storeId,
        createTestUser(),
      );

      expect(result.failed).toBe(1);
      expect(result.results[0].message).toContain('tiene 5 producto');
      expect(queryRunner.manager.remove).not.toHaveBeenCalled();
    });

    it('should not delete category if it has children', async () => {
      const dto = { rows: [], deleteCategoriesNotInExcel: true };
      const storeId = 's1';
      const catToDelete = createTestCategory({ id: 10 });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(createTestStore({ id: storeId }));

      queryRunner.manager.find.mockResolvedValue([catToDelete]);
      queryRunner.manager.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });
      queryRunner.manager.count.mockResolvedValue(2); // 2 children

      const result = await service.importExcel(
        dto as any,
        storeId,
        createTestUser(),
      );

      expect(result.failed).toBe(1);
      expect(result.results[0].message).toContain('tiene 2 subcategoría');
      expect(queryRunner.manager.remove).not.toHaveBeenCalled();
    });

    it('should record row failures when store is missing during creation', async () => {
      const dto = { rows: [{ name: 'New Cat' }] };
      const storeId = 'store-1';
      const store = { id: storeId };

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      queryRunner.manager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await service.importExcel(
        dto as any,
        storeId,
        createTestUser(),
      );

      expect(result.failed).toBe(1);
      expect(result.results[0].status).toBe('error');
    });

    it('should use fallback row name and error message on non-error failures', async () => {
      const nameObj = {
        calls: 0,
        toString() {
          this.calls += 1;
          return this.calls <= 2 ? 'CatName' : '';
        },
      };
      const dto = { rows: [{ name: nameObj }] };
      const storeId = 'store-1';
      const store = createTestStore({ id: storeId });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      queryRunner.manager.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(store);
      queryRunner.manager.save.mockRejectedValueOnce('boom');

      const result = await service.importExcel(
        dto as any,
        storeId,
        createTestUser(),
      );

      expect(result.failed).toBe(1);
      expect(result.results[0].categoryName).toBe('N/A');
      expect(result.results[0].message).toContain('Error desconocido');
    });

    it('should capture delete errors per category', async () => {
      const dto = { rows: [], deleteCategoriesNotInExcel: true };
      const storeId = 's1';
      const store = createTestStore({ id: storeId });
      const catToDelete = createTestCategory({ id: 10, store });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      queryRunner.manager.find.mockResolvedValue([catToDelete]);
      queryRunner.manager.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });
      queryRunner.manager.count.mockRejectedValueOnce(new Error('count fail'));

      const result = await service.importExcel(
        dto as any,
        storeId,
        createTestUser(),
      );

      expect(result.failed).toBe(1);
      expect(result.results[0].message).toContain('Error al eliminar');
    });

    it('should use fallback error message when delete throws non-error', async () => {
      const dto = { rows: [], deleteCategoriesNotInExcel: true };
      const storeId = 's1';
      const store = createTestStore({ id: storeId });
      const catToDelete = createTestCategory({ id: 10, store });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      queryRunner.manager.find.mockResolvedValue([catToDelete]);
      queryRunner.manager.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });
      queryRunner.manager.count.mockResolvedValue(0);
      queryRunner.manager.remove.mockRejectedValueOnce('boom');

      const result = await service.importExcel(
        dto as any,
        storeId,
        createTestUser(),
      );

      expect(result.failed).toBe(1);
      expect(result.results[0].message).toContain('Error desconocido');
    });

    it('should swallow errors when deleting categories not in excel fails globally', async () => {
      const dto = { rows: [], deleteCategoriesNotInExcel: true };
      const storeId = 's1';
      const store = createTestStore({ id: storeId });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      queryRunner.manager.find.mockRejectedValueOnce(new Error('fail'));

      const result = await service.importExcel(
        dto as any,
        storeId,
        createTestUser(),
      );

      expect(result).toBeDefined();
    });

    it('should use unknown error message when import throws non-error', async () => {
      const dto = { rows: [{ name: 'Cat 1' }] };
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockRejectedValueOnce('boom');

      await expect(
        service.importExcel(dto as any, 's1', createTestUser()),
      ).rejects.toThrow('Unknown error');
    });
  });
  describe('deleteCategory', () => {
    it('should delete category', async () => {
      const id = 1;
      const storeId = 's1';
      const user = createTestUser();
      const store = { id: storeId };
      const category = { id, store };

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      categoryRepository.findOne.mockResolvedValue(category);
      categoryRepository.delete.mockResolvedValue({});

      await service.deleteCategory(id, storeId, user);

      expect(categoryRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should throw Forbidden if store mismatch', async () => {
      const id = 1;
      const storeId = 's1';
      const user = createTestUser();
      const store = { id: storeId };
      const category = { id, store: { id: 'other' } };

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      categoryRepository.findOne.mockResolvedValue(category);

      await expect(service.deleteCategory(id, storeId, user)).rejects.toThrow(
        ForbiddenException,
      );
    });
    it('should throw NotFoundException if category not found', async () => {
      const user = createTestUser();
      const id = 1;
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue({ id: 's1' });
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteCategory(id, 's1', user)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByStore', () => {
    it('should return categories for store', async () => {
      const storeId = 'store-1';
      const categories = [createTestCategory(), createTestCategory()];
      storeRepository.findOne.mockResolvedValue({ id: storeId });
      categoryRepository.find.mockResolvedValue(categories);

      const result = await service.findByStore(storeId);

      expect(result).toEqual(categories);
      expect(categoryRepository.find).toHaveBeenCalledWith({
        where: { store: { id: storeId } },
        relations: ['parent', 'children'],
        order: { position: 'ASC' },
      });
    });

    it('should throw NotFoundException if store not found', async () => {
      storeRepository.findOne.mockResolvedValue(null);
      await expect(service.findByStore('store-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCategoryById', () => {
    it('should throw NotFoundException if store does not exist', async () => {
      storeRepository.findOne.mockResolvedValue(null);

      await expect(service.getCategoryById(1, 'store-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if category does not exist', async () => {
      const store = { id: 'store-1' };
      storeRepository.findOne.mockResolvedValue(store);
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.getCategoryById(1, 'store-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return category', async () => {
      const id = 1;
      const storeId = 'store-1';
      const store = { id: storeId };
      const category = { id, store };
      storeRepository.findOne.mockResolvedValue(store);
      categoryRepository.findOne.mockResolvedValue(category);

      const result = await service.getCategoryById(id, storeId);

      expect(result).toEqual(category);
    });

    it('should throw ForbiddenException if category not in store', async () => {
      const id = 1;
      const storeId = 'store-1';
      const store = { id: storeId };
      const category = { id, store: { id: 'other' } };
      storeRepository.findOne.mockResolvedValue(store);
      categoryRepository.findOne.mockResolvedValue(category);

      await expect(service.getCategoryById(id, storeId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateCategory', () => {
    const user = createTestUser();
    const storeId = 'store-1';

    it('should update category', async () => {
      const id = 1;
      const dto = { name: 'Updated' };
      const store = createTestStore({ id: storeId });
      const category = createTestCategory({ id, store });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      categoryRepository.findOne.mockResolvedValue(category);
      categoryRepository.save.mockResolvedValue({ ...category, ...dto });

      const result = await service.updateCategory(id, dto, storeId, user);

      expect(result.name).toBe(dto.name);
    });

    it('should update category parent', async () => {
      const id = 1;
      const parentId = 2;
      const dto = { parentId };
      const store = createTestStore({ id: storeId });
      const category = createTestCategory({ id, store });
      const parent = createTestCategory({ id: parentId, store });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);

      categoryRepository.findOne
        .mockResolvedValueOnce(category) // find category
        .mockResolvedValueOnce(parent); // find parent

      categoryRepository.save.mockImplementation((cat) => cat);

      const result = await service.updateCategory(id, dto, storeId, user);
      expect(result.parent).toEqual(parent);
    });
    it('should throw NotFoundException if category not found for update', async () => {
      const id = 99;
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(createTestStore());
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateCategory(id, {}, storeId, user),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if category does not belong to store', async () => {
      const id = 1;
      const store = createTestStore({ id: 's1' });
      const category = createTestCategory({
        id,
        store: { ...store, id: 'other' },
      });
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);
      categoryRepository.findOne.mockResolvedValue(category);

      await expect(service.updateCategory(id, {}, 's1', user)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should remove parent when parentId is null', async () => {
      const id = 1;
      const store = createTestStore({ id: 's1' });
      const category = createTestCategory({ id, store });
      category.parent = createTestCategory({ id: 10 });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);
      categoryRepository.findOne.mockResolvedValue(category);
      categoryRepository.save.mockImplementation((c) => c);

      const result = await service.updateCategory(
        id,
        { parentId: null },
        's1',
        user,
      );
      expect(result.parent).toBeNull();
    });

    it('should throw NotFoundException if new parent not found', async () => {
      const id = 1;
      const store = createTestStore({ id: 's1' });
      const category = createTestCategory({ id, store });

      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);
      categoryRepository.findOne.mockResolvedValueOnce(category); // cat
      categoryRepository.findOne.mockResolvedValueOnce(null); // parent

      await expect(
        service.updateCategory(id, { parentId: 99 }, 's1', user),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle generic error', async () => {
      const id = 1;
      const store = createTestStore({ id: 's1' });
      const category = createTestCategory({ id, store });
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);
      categoryRepository.findOne.mockResolvedValue(category);
      categoryRepository.save.mockRejectedValue(new Error('Gen'));

      await expect(service.updateCategory(id, {}, 's1', user)).rejects.toThrow(
        'Gen',
      );
    });

    it('should throw ConflictException on duplicate name update', async () => {
      const id = 1;
      const store = createTestStore({ id: 's1' });
      const category = createTestCategory({ id, store });
      const { checkStoreAccess } = require('../utils/permissions');
      checkStoreAccess.mockResolvedValue(store);
      categoryRepository.findOne.mockResolvedValue(category);
      categoryRepository.save.mockRejectedValue({ code: '23505' });

      await expect(
        service.updateCategory(id, { name: 'Dup' }, 's1', user),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getCategoryHierarchy', () => {
    it('should return hierarchy', async () => {
      const storeId = 'store-1';
      const store = createTestStore({ id: storeId });
      const child = createTestCategory({ id: 2, store });
      const parent = createTestCategory({ id: 1, store });
      child.parent = parent;

      storeRepository.findOne.mockResolvedValue(store);

      categoryRepository.findOne
        .mockResolvedValueOnce(child) // getCategoryById
        .mockResolvedValueOnce(parent); // loop

      const result = await service.getCategoryHierarchy(2, storeId);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });
  });

  describe('findRootCategories', () => {
    it('should throw NotFoundException if store is missing', async () => {
      storeRepository.findOne.mockResolvedValue(null);

      await expect(service.findRootCategories('store-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return root categories', async () => {
      const storeId = 'store-1';
      const store = createTestStore({ id: storeId });
      const root1 = createTestCategory({ id: 1, store });
      const root2 = createTestCategory({ id: 2, store });
      const child = createTestCategory({ id: 3, store });
      child.parent = root1;

      storeRepository.findOne.mockResolvedValue(store);
      categoryRepository.find.mockResolvedValue([root1, root2, child]);

      const result = await service.findRootCategories(storeId);
      expect(result).toHaveLength(2);
      expect(result.find((c) => c.id === 1).children).toHaveLength(1);
    });

    it('should return empty when no root categories exist', async () => {
      const storeId = 'store-1';
      const store = createTestStore({ id: storeId });
      const child = createTestCategory({ id: 3, store });
      child.parent = createTestCategory({ id: 99, store });

      storeRepository.findOne.mockResolvedValue(store);
      categoryRepository.find.mockResolvedValue([child]);

      const result = await service.findRootCategories(storeId);
      expect(result).toHaveLength(0);
    });
  });
});
