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
import { User, UserRole } from '../src/user/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * E2E Tests for Product CRUD Operations including Variations
 *
 * These tests use a REAL PostgreSQL database (no mocks).
 *
 * Prerequisites:
 * 1. Start the test database: docker-compose -f docker-compose.e2e.yml up -d
 * 2. Run tests: npm run test:e2e -- --testPathPattern=product-crud
 */
describe('Product CRUD with Variations (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepo: Repository<User>;
  let storeRepo: Repository<Store>;
  let categoryRepo: Repository<Category>;
  let productRepo: Repository<Product>;

  let testUser: User;
  let testStore: Store;
  let testCategory: Category;

  const timestamp = Date.now();
  const testUserId = `e2e-crud-test-uid-${timestamp}`;

  // This user object will be injected into requests by the mocked guard
  const mockFirebaseUser = {
    uid: testUserId,
    id: testUserId, // Important: this must match the user.id in the database
    email: 'e2e-crud-test@test.com',
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
          // Inject full user object that matches what the service expects
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

    // Create test user with the same ID as mockFirebaseUser
    testUser = await userRepo.save({
      id: testUserId,
      email: mockFirebaseUser.email,
      role: mockFirebaseUser.role,
      name: 'E2E CRUD Test User',
    });

    // Create test store with testUser as owner
    testStore = await storeRepo.save({
      id: `e2e-crud-store-${timestamp}`,
      name: 'E2E CRUD Test Store',
      owner: testUser,
    });

    // Create test category
    testCategory = await categoryRepo.save({
      name: 'E2E CRUD Test Category',
      store: testStore,
      position: 0,
    });
  });

  afterAll(async () => {
    // Cleanup in reverse order of dependencies
    if (dataSource && dataSource.isInitialized) {
      try {
        // Delete all test products first (including children due to parent reference)
        await productRepo
          .createQueryBuilder()
          .delete()
          .where('sku LIKE :pattern', { pattern: `E2E-CRUD-%` })
          .execute();

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

  describe('Product without variations', () => {
    let createdProductId: number;

    it('should create a simple product', async () => {
      const productData = {
        title: 'E2E Simple Product',
        description: 'A simple product without variations',
        basePrice: 100,
        stock: 50,
        sku: `E2E-CRUD-SIMPLE-${Date.now()}`,
        categoryIds: [testCategory.id],
      };

      const response = await request(app.getHttpServer())
        .post(`/products/${testStore.id}`)
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(productData.title);
      expect(response.body.sku).toBe(productData.sku);
      createdProductId = response.body.id;
    });

    it('should update the simple product', async () => {
      const updateData = {
        title: 'E2E Simple Product Updated',
        basePrice: 150,
      };

      const response = await request(app.getHttpServer())
        .put(`/products/${testStore.id}/${createdProductId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(parseFloat(response.body.basePrice)).toBe(updateData.basePrice);
    });

    it('should delete the simple product', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${testStore.id}/${createdProductId}`)
        .expect(200);

      // Verify it's deleted
      const product = await productRepo.findOne({
        where: { id: createdProductId },
      });
      expect(product).toBeNull();
    });
  });

  describe('Product with variations', () => {
    let parentProductId: number;
    let variation1Id: number;
    let variation2Id: number;

    it('should create a parent product', async () => {
      const productData = {
        title: 'E2E Parent Product',
        description: 'A parent product with variations',
        basePrice: 100,
        sku: `E2E-CRUD-PARENT-${Date.now()}`,
        categoryIds: [testCategory.id],
      };

      const response = await request(app.getHttpServer())
        .post(`/products/${testStore.id}`)
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      parentProductId = response.body.id;
    });

    it('should create variation 1 (child product)', async () => {
      const variationData = {
        title: 'E2E Variation 1 - Small',
        description: 'Small size variation',
        basePrice: 80,
        stock: 20,
        sku: `E2E-CRUD-VAR1-${Date.now()}`,
        parentId: parentProductId,
      };

      const response = await request(app.getHttpServer())
        .post(`/products/${testStore.id}`)
        .send(variationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.parent).toBeDefined();
      variation1Id = response.body.id;
    });

    it('should create variation 2 (child product)', async () => {
      const variationData = {
        title: 'E2E Variation 2 - Large',
        description: 'Large size variation',
        basePrice: 120,
        stock: 15,
        sku: `E2E-CRUD-VAR2-${Date.now()}`,
        parentId: parentProductId,
      };

      const response = await request(app.getHttpServer())
        .post(`/products/${testStore.id}`)
        .send(variationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      variation2Id = response.body.id;
    });

    it('should update a variation', async () => {
      const updateData = {
        title: 'E2E Variation 1 - Small Updated',
        basePrice: 85,
      };

      const response = await request(app.getHttpServer())
        .put(`/products/${testStore.id}/${variation1Id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
    });

    it('should delete a single variation (keep parent and other variation)', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${testStore.id}/${variation1Id}`)
        .expect(200);

      // Verify variation1 is deleted
      const deletedVariation = await productRepo.findOne({
        where: { id: variation1Id },
      });
      expect(deletedVariation).toBeNull();

      // Verify parent still exists
      const parent = await productRepo.findOne({
        where: { id: parentProductId },
      });
      expect(parent).not.toBeNull();

      // Verify variation2 still exists
      const remainingVariation = await productRepo.findOne({
        where: { id: variation2Id },
      });
      expect(remainingVariation).not.toBeNull();
    });

    it('should delete parent product and remaining variation', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${testStore.id}/${parentProductId}`)
        .expect(200);

      // Verify parent is deleted
      const parent = await productRepo.findOne({
        where: { id: parentProductId },
      });
      expect(parent).toBeNull();

      // Verify variation2 is also deleted (child)
      const variation = await productRepo.findOne({
        where: { id: variation2Id },
      });
      expect(variation).toBeNull();
    });
  });

  describe('Nested variations (sub-variations)', () => {
    let parentProductId: number;
    let variationId: number;
    let subVariation1Id: number;
    let subVariation2Id: number;

    it('should create parent -> variation -> sub-variations hierarchy', async () => {
      // Create parent
      const parentResponse = await request(app.getHttpServer())
        .post(`/products/${testStore.id}`)
        .send({
          title: 'E2E Nested Parent',
          basePrice: 100,
          sku: `E2E-CRUD-NESTED-PARENT-${Date.now()}`,
        })
        .expect(201);
      parentProductId = parentResponse.body.id;

      // Create variation (level 1)
      const variationResponse = await request(app.getHttpServer())
        .post(`/products/${testStore.id}`)
        .send({
          title: 'E2E Nested Variation',
          basePrice: 100,
          sku: `E2E-CRUD-NESTED-VAR-${Date.now()}`,
          parentId: parentProductId,
        })
        .expect(201);
      variationId = variationResponse.body.id;

      // Create sub-variation 1 (level 2)
      const subVar1Response = await request(app.getHttpServer())
        .post(`/products/${testStore.id}`)
        .send({
          title: 'E2E Sub-Variation 1',
          basePrice: 90,
          sku: `E2E-CRUD-NESTED-SUBVAR1-${Date.now()}`,
          parentId: variationId,
        })
        .expect(201);
      subVariation1Id = subVar1Response.body.id;

      // Create sub-variation 2 (level 2)
      const subVar2Response = await request(app.getHttpServer())
        .post(`/products/${testStore.id}`)
        .send({
          title: 'E2E Sub-Variation 2',
          basePrice: 110,
          sku: `E2E-CRUD-NESTED-SUBVAR2-${Date.now()}`,
          parentId: variationId,
        })
        .expect(201);
      subVariation2Id = subVar2Response.body.id;
    });

    it('should delete a sub-variation independently', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${testStore.id}/${subVariation1Id}`)
        .expect(200);

      // Verify sub-variation1 is deleted
      const deleted = await productRepo.findOne({
        where: { id: subVariation1Id },
      });
      expect(deleted).toBeNull();

      // Verify parent variation still exists
      const variation = await productRepo.findOne({
        where: { id: variationId },
      });
      expect(variation).not.toBeNull();
    });

    it('should delete variation and its remaining sub-variations', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${testStore.id}/${variationId}`)
        .expect(200);

      // Verify variation is deleted
      const variation = await productRepo.findOne({
        where: { id: variationId },
      });
      expect(variation).toBeNull();

      // Verify sub-variation2 is also deleted
      const subVar2 = await productRepo.findOne({
        where: { id: subVariation2Id },
      });
      expect(subVar2).toBeNull();

      // Verify parent still exists
      const parent = await productRepo.findOne({
        where: { id: parentProductId },
      });
      expect(parent).not.toBeNull();
    });

    it('should cleanup: delete parent', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${testStore.id}/${parentProductId}`)
        .expect(200);
    });
  });

  describe('Edge cases', () => {
    it('should return 404 when deleting non-existent product', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${testStore.id}/999999999`)
        .expect(404);
    });

    it('should return 404 when trying to delete from non-existent store', async () => {
      // Create a product
      const response = await request(app.getHttpServer())
        .post(`/products/${testStore.id}`)
        .send({
          title: 'E2E Wrong Store Test',
          basePrice: 50,
          sku: `E2E-CRUD-WRONGSTORE-${Date.now()}`,
        })
        .expect(201);

      // Try to delete from a different (non-existent) store - returns 404 because store not found
      await request(app.getHttpServer())
        .delete(`/products/wrong-store-id/${response.body.id}`)
        .expect(404);

      // Cleanup
      await productRepo.delete(response.body.id);
    });
  });
});
