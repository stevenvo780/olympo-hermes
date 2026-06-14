import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { FirebaseAuthGuard } from '../src/auth/firebase-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { Store } from '../src/store/entities/store.entity';
import { Category } from '../src/category/entities/category.entity';
import { Product } from '../src/product/entities/product.entity';
import { ProductCategoryOrder } from '../src/product/entities/product-category-order.entity';
import { User, UserRole } from '../src/user/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * E2E Tests for ProductCategoryOrder
 *
 * These tests use a REAL PostgreSQL database (no mocks).
 *
 * Prerequisites:
 * 1. Start the test database: docker-compose -f docker-compose.e2e.yml up -d
 * 2. Run tests: npm run test:e2e
 */
describe('ProductCategoryOrderController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepo: Repository<User>;
  let storeRepo: Repository<Store>;
  let categoryRepo: Repository<Category>;
  let productRepo: Repository<Product>;
  let pcoRepo: Repository<ProductCategoryOrder>;

  let testUser: User;
  let testStore: Store;
  let testCategory: Category;
  let product1: Product;
  let product2: Product;
  let product3: Product;

  const timestamp = Date.now();
  const mockFirebaseUser = {
    uid: `e2e-test-uid-${timestamp}`,
    email: 'e2e-test@test.com',
    role: UserRole.BUSINESS_OWNER,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockFirebaseUser;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    storeRepo = moduleFixture.get<Repository<Store>>(getRepositoryToken(Store));
    categoryRepo = moduleFixture.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    productRepo = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    pcoRepo = moduleFixture.get<Repository<ProductCategoryOrder>>(
      getRepositoryToken(ProductCategoryOrder),
    );
  });

  afterAll(async () => {
    // Cleanup in reverse order of dependencies
    if (dataSource && dataSource.isInitialized) {
      try {
        // Delete test data
        if (testCategory) {
          await pcoRepo.delete({ category: { id: testCategory.id } });
        }
        if (product1) await productRepo.delete(product1.id);
        if (product2) await productRepo.delete(product2.id);
        if (product3) await productRepo.delete(product3.id);
        if (testCategory) await categoryRepo.delete(testCategory.id);
        if (testStore) await storeRepo.delete(testStore.id);
        if (testUser) await userRepo.delete(testUser.id);
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // Create fresh test data for each test
    const testTimestamp = Date.now();

    // Create test user
    testUser = await userRepo.save({
      id: mockFirebaseUser.uid,
      email: mockFirebaseUser.email,
      role: mockFirebaseUser.role,
      name: 'E2E Test User',
    });

    // Create test store
    testStore = await storeRepo.save({
      id: `e2e-store-${testTimestamp}`,
      name: 'E2E Test Store',
      owner: testUser,
    });

    // Create test category
    testCategory = await categoryRepo.save({
      name: 'E2E Test Category',
      store: testStore,
      position: 0,
    });

    // Create test products
    product1 = await productRepo.save({
      title: 'E2E Product 1',
      basePrice: 100,
      sku: `E2E-SKU1-${testTimestamp}`,
      store: testStore,
      enabled: true,
      categories: [testCategory],
    });

    product2 = await productRepo.save({
      title: 'E2E Product 2',
      basePrice: 200,
      sku: `E2E-SKU2-${testTimestamp}`,
      store: testStore,
      enabled: true,
      categories: [testCategory],
    });

    product3 = await productRepo.save({
      title: 'E2E Product 3',
      basePrice: 300,
      sku: `E2E-SKU3-${testTimestamp}`,
      store: testStore,
      enabled: true,
      categories: [testCategory],
    });

    // Create product category orders
    await pcoRepo.save([
      { product: product1, category: testCategory, orderInCategory: 1 },
      { product: product2, category: testCategory, orderInCategory: 2 },
      { product: product3, category: testCategory, orderInCategory: 3 },
    ]);
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      if (testCategory) {
        await pcoRepo.delete({ category: { id: testCategory.id } });
      }
      if (product1) await productRepo.delete(product1.id);
      if (product2) await productRepo.delete(product2.id);
      if (product3) await productRepo.delete(product3.id);
      if (testCategory) await categoryRepo.delete(testCategory.id);
      if (testStore) await storeRepo.delete(testStore.id);
      if (testUser) await userRepo.delete(testUser.id);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('GET /products/category-order/category/:categoryId', () => {
    it('should return products ordered by orderInCategory', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/category-order/category/${testCategory.id}`)
        .query({ storeId: testStore.id })
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].product.id).toBe(product1.id);
      expect(response.body[0].orderInCategory).toBe(1);
      expect(response.body[1].product.id).toBe(product2.id);
      expect(response.body[1].orderInCategory).toBe(2);
      expect(response.body[2].product.id).toBe(product3.id);
      expect(response.body[2].orderInCategory).toBe(3);
    });

    it('should return 404 for non-existent category', async () => {
      // API returns 404 when category doesn't exist
      await request(app.getHttpServer())
        .get('/products/category-order/category/999999')
        .query({ storeId: testStore.id })
        .expect(404);
    });
  });

  describe('PATCH /products/category-order/category', () => {
    it('should reorder product from position 1 to position 3', async () => {
      // Move product1 from position 1 to position 3
      const payload = {
        productId: product1.id,
        categoryId: testCategory.id,
        newOrder: 3,
        storeId: testStore.id,
      };

      const response = await request(app.getHttpServer())
        .patch('/products/category-order/category')
        .send(payload)
        .expect(200);

      expect(response.body.orderInCategory).toBe(3);
      expect(response.body.product.id).toBe(product1.id);

      // Verify the new order in DB
      const listResponse = await request(app.getHttpServer())
        .get(`/products/category-order/category/${testCategory.id}`)
        .query({ storeId: testStore.id })
        .expect(200);

      // After moving product1 to position 3:
      // product2 -> 1, product3 -> 2, product1 -> 3
      expect(listResponse.body[0].product.id).toBe(product2.id);
      expect(listResponse.body[0].orderInCategory).toBe(1);
      expect(listResponse.body[1].product.id).toBe(product3.id);
      expect(listResponse.body[1].orderInCategory).toBe(2);
      expect(listResponse.body[2].product.id).toBe(product1.id);
      expect(listResponse.body[2].orderInCategory).toBe(3);
    });

    it('should reorder product from position 3 to position 1', async () => {
      // Move product3 from position 3 to position 1
      const payload = {
        productId: product3.id,
        categoryId: testCategory.id,
        newOrder: 1,
        storeId: testStore.id,
      };

      await request(app.getHttpServer())
        .patch('/products/category-order/category')
        .send(payload)
        .expect(200);

      // Verify the new order
      const listResponse = await request(app.getHttpServer())
        .get(`/products/category-order/category/${testCategory.id}`)
        .query({ storeId: testStore.id })
        .expect(200);

      // After moving product3 to position 1:
      // product3 -> 1, product1 -> 2, product2 -> 3
      expect(listResponse.body[0].product.id).toBe(product3.id);
      expect(listResponse.body[0].orderInCategory).toBe(1);
      expect(listResponse.body[1].product.id).toBe(product1.id);
      expect(listResponse.body[1].orderInCategory).toBe(2);
      expect(listResponse.body[2].product.id).toBe(product2.id);
      expect(listResponse.body[2].orderInCategory).toBe(3);
    });

    it('should handle same position reorder (no change)', async () => {
      // Move product2 to its current position 2
      const payload = {
        productId: product2.id,
        categoryId: testCategory.id,
        newOrder: 2,
        storeId: testStore.id,
      };

      const response = await request(app.getHttpServer())
        .patch('/products/category-order/category')
        .send(payload)
        .expect(200);

      expect(response.body.orderInCategory).toBe(2);

      // Verify order is unchanged
      const listResponse = await request(app.getHttpServer())
        .get(`/products/category-order/category/${testCategory.id}`)
        .query({ storeId: testStore.id })
        .expect(200);

      expect(listResponse.body[0].product.id).toBe(product1.id);
      expect(listResponse.body[1].product.id).toBe(product2.id);
      expect(listResponse.body[2].product.id).toBe(product3.id);
    });

    it('should return 404 for non-existent product', async () => {
      const payload = {
        productId: 999999,
        categoryId: testCategory.id,
        newOrder: 1,
        storeId: testStore.id,
      };

      await request(app.getHttpServer())
        .patch('/products/category-order/category')
        .send(payload)
        .expect(404);
    });

    it('should return 404 for non-existent category', async () => {
      const payload = {
        productId: product1.id,
        categoryId: 999999,
        newOrder: 1,
        storeId: testStore.id,
      };

      await request(app.getHttpServer())
        .patch('/products/category-order/category')
        .send(payload)
        .expect(404);
    });

    it('should return error for invalid payload', async () => {
      // Missing productId - should fail
      const response1 = await request(app.getHttpServer())
        .patch('/products/category-order/category')
        .send({
          categoryId: testCategory.id,
          newOrder: 1,
          storeId: testStore.id,
        });

      expect([400, 404, 500]).toContain(response1.status);

      // Missing categoryId
      const response2 = await request(app.getHttpServer())
        .patch('/products/category-order/category')
        .send({
          productId: product1.id,
          newOrder: 1,
          storeId: testStore.id,
        });

      expect([400, 404, 500]).toContain(response2.status);
    });
  });

  describe('Database integrity tests', () => {
    it('should maintain unique constraint on product-category combination', async () => {
      // Attempt to create duplicate ProductCategoryOrder should fail
      // This verifies the @Unique(['product', 'category']) constraint
      const duplicateOrder = pcoRepo.create({
        product: product1,
        category: testCategory,
        orderInCategory: 99,
      });

      await expect(pcoRepo.save(duplicateOrder)).rejects.toThrow();
    });

    it('should cascade delete when product is deleted', async () => {
      // Get the PCO record for product1
      const pcoBefore = await pcoRepo.findOne({
        where: {
          product: { id: product1.id },
          category: { id: testCategory.id },
        },
      });
      expect(pcoBefore).toBeDefined();

      // Delete product1
      await productRepo.delete(product1.id);
      product1 = null; // Prevent afterEach from trying to delete again

      // PCO should be deleted via cascade
      const pcoAfter = await pcoRepo.findOne({
        where: { id: pcoBefore.id },
      });
      expect(pcoAfter).toBeNull();
    });

    it('should handle concurrent reorder operations', async () => {
      // Simulate two concurrent reorder operations
      const promises = [
        request(app.getHttpServer())
          .patch('/products/category-order/category')
          .send({
            productId: product1.id,
            categoryId: testCategory.id,
            newOrder: 3,
            storeId: testStore.id,
          }),
        request(app.getHttpServer())
          .patch('/products/category-order/category')
          .send({
            productId: product3.id,
            categoryId: testCategory.id,
            newOrder: 1,
            storeId: testStore.id,
          }),
      ];

      const results = await Promise.all(promises);

      // Both should succeed (no race condition errors)
      expect(results[0].status).toBe(200);
      expect(results[1].status).toBe(200);

      // Final state should be consistent (all positions should be unique)
      const listResponse = await request(app.getHttpServer())
        .get(`/products/category-order/category/${testCategory.id}`)
        .query({ storeId: testStore.id })
        .expect(200);

      const orders = listResponse.body.map((item) => item.orderInCategory);
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(orders.length);
    });
  });
});
