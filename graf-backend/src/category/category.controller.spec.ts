import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../user/entities/user.entity';
import { RequestWithUser } from '../auth/types';

describe('CategoryController', () => {
  let controller: CategoryController;

  const mockCategoryService = {
    createCategory: jest.fn(),
    findByStore: jest.fn(),
    findByStoreHierarchical: jest.fn(),
    getCategoryById: jest.fn(),
    getCategoryHierarchy: jest.fn(),
    findRootCategories: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    importExcel: jest.fn(),
  };

  const mockFirebaseAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockFirebaseAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<CategoryController>(CategoryController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const storeId = '1';
      const categoryData = {
        name: 'Test Category',
        description: 'Test description',
      };
      const req = {
        user: {
          id: 1,
          role: UserRole.BUSINESS_OWNER,
        },
      } as unknown as RequestWithUser;

      const expectedCategory = { id: 1, ...categoryData };

      mockCategoryService.createCategory.mockResolvedValue(expectedCategory);

      const result = await controller.create(req, storeId, categoryData);

      expect(result).toEqual(expectedCategory);
      expect(mockCategoryService.createCategory).toHaveBeenCalledWith(
        categoryData,
        storeId,
        req.user,
      );
    });
  });

  describe('findAll', () => {
    it('should return all categories for a store', async () => {
      const storeId = '1';
      const req = {
        user: {
          id: 1,
          role: UserRole.BUSINESS_OWNER,
        },
      } as unknown as RequestWithUser;

      const expectedCategories = [
        { id: 1, name: 'Category 1' },
        { id: 2, name: 'Category 2' },
      ];

      mockCategoryService.findByStore.mockResolvedValue(expectedCategories);

      const result = await controller.findAll(req, storeId);

      expect(result).toEqual(expectedCategories);
      expect(mockCategoryService.findByStore).toHaveBeenCalledWith(storeId);
    });
  });

  describe('findHierarchical', () => {
    it('should return categories in hierarchical structure', async () => {
      const storeId = '1';
      const req = {
        user: {
          id: 1,
          role: UserRole.BUSINESS_OWNER,
        },
      } as unknown as RequestWithUser;

      const expectedCategories = [
        {
          id: 1,
          name: 'Parent Category',
          children: [{ id: 2, name: 'Child Category' }],
        },
      ];

      mockCategoryService.findByStoreHierarchical.mockResolvedValue(
        expectedCategories,
      );

      const result = await controller.findHierarchical(req, storeId);

      expect(result).toEqual(expectedCategories);
      expect(mockCategoryService.findByStoreHierarchical).toHaveBeenCalledWith(
        storeId,
      );
    });
  });

  describe('findOne', () => {
    it('should return a single category', async () => {
      const categoryId = '1';
      const storeId = '1';

      const expectedCategory = { id: 1, name: 'Test Category' };

      mockCategoryService.getCategoryById.mockResolvedValue(expectedCategory);

      const result = await controller.findOne(categoryId, storeId);

      expect(result).toEqual(expectedCategory);
      expect(mockCategoryService.getCategoryById).toHaveBeenCalledWith(
        1,
        storeId,
      );
    });
  });

  describe('getHierarchy', () => {
    it('should return category hierarchy', async () => {
      const categoryId = '1';
      const storeId = '1';

      const expectedHierarchy = [
        { id: 1, name: 'Root Category' },
        { id: 2, name: 'Parent Category' },
        { id: 3, name: 'Current Category' },
      ];

      mockCategoryService.getCategoryHierarchy.mockResolvedValue(
        expectedHierarchy,
      );

      const result = await controller.getHierarchy(categoryId, storeId);

      expect(result).toEqual(expectedHierarchy);
      expect(mockCategoryService.getCategoryHierarchy).toHaveBeenCalledWith(
        1,
        storeId,
      );
    });
  });

  describe('findRootCategories', () => {
    it('should return root categories', async () => {
      const storeId = '1';

      const expectedCategories = [
        { id: 1, name: 'Root Category 1' },
        { id: 2, name: 'Root Category 2' },
      ];

      mockCategoryService.findRootCategories.mockResolvedValue(
        expectedCategories,
      );

      const result = await controller.findRootCategories(storeId);

      expect(result).toEqual(expectedCategories);
      expect(mockCategoryService.findRootCategories).toHaveBeenCalledWith(
        storeId,
      );
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const categoryId = '1';
      const storeId = '1';
      const updateData = {
        name: 'Updated Category',
        description: 'Updated description',
      };
      const req = {
        user: {
          id: 1,
          role: UserRole.BUSINESS_OWNER,
        },
      } as unknown as RequestWithUser;

      const expectedCategory = { id: 1, ...updateData };

      mockCategoryService.updateCategory.mockResolvedValue(expectedCategory);

      const result = await controller.update(
        req,
        categoryId,
        storeId,
        updateData,
      );

      expect(result).toEqual(expectedCategory);
      expect(mockCategoryService.updateCategory).toHaveBeenCalledWith(
        1,
        updateData,
        storeId,
        req.user,
      );
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      const categoryId = '1';
      const storeId = '1';
      const req = {
        user: {
          id: 1,
          role: UserRole.BUSINESS_OWNER,
        },
      } as unknown as RequestWithUser;

      mockCategoryService.deleteCategory.mockResolvedValue(undefined);

      const result = await controller.remove(req, categoryId, storeId);

      expect(result).toBeUndefined();
      expect(mockCategoryService.deleteCategory).toHaveBeenCalledWith(
        1,
        storeId,
        req.user,
      );
    });
  });

  describe('importExcel', () => {
    it('should import categories from excel payload', async () => {
      const storeId = '1';
      const req = {
        user: {
          id: 1,
          role: UserRole.BUSINESS_OWNER,
        },
      } as unknown as RequestWithUser;
      const dto = { rows: [] };
      const expected = {
        created: 0,
        updated: 0,
        deleted: 0,
        skipped: 0,
        failed: 0,
        results: [],
      };

      mockCategoryService.importExcel.mockResolvedValue(expected);

      const result = await controller.importExcel(req, storeId, dto as any);

      expect(result).toEqual(expected);
      expect(mockCategoryService.importExcel).toHaveBeenCalledWith(
        dto,
        storeId,
        req.user,
      );
    });
  });
});
