import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Provider, ModuleMetadata } from '@nestjs/common';

import { User, UserRole } from '../user/entities/user.entity';
import { Store } from '../store/entities/store.entity';
import { Product } from '../product/entities/product.entity';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { Category } from '../category/entities/category.entity';
import { Customer } from '../customer/entities/customer.entity';
import { RequestWithUser } from '../auth/types';
import { PaymentFrequency } from '../wompi/entities/payment-source.entity';
import { PlanType } from '../user/entities/subscription.entity';

export type MockRepository<T = unknown> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

export const createMockRepository = <T>(): Partial<Repository<T>> => ({
  find: jest.fn(),
  findBy: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  create: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    getCount: jest.fn(),
    getManyAndCount: jest.fn(),
    execute: jest.fn(),
  }),
});

export const createTestingModule = async (
  providers: Provider[],
  imports: ModuleMetadata['imports'] = [],
): Promise<TestingModule> => {
  return await Test.createTestingModule({
    imports,
    providers,
  }).compile();
};

export const createTestUser = (overrides: Partial<User> = {}): User => {
  const user = new User();
  user.id = 'test-user-id';
  user.email = 'test@example.com';
  user.name = 'Test User';
  user.role = UserRole.CUSTOMER;
  user.apiKey = null;
  Object.assign(user, overrides);
  return user;
};

export const createMockRequestWithUser = (
  user?: Partial<User>,
): Partial<RequestWithUser> => {
  const testUser = createTestUser(user);
  return {
    user: testUser,
    token: {
      uid: testUser.id,
      email: testUser.email,
      aud: 'test-audience',
      auth_time: Date.now(),
      exp: Date.now() + 3600,
      firebase: {
        identities: {},
        sign_in_provider: 'password',
      },
      iat: Date.now(),
      iss: 'test-issuer',
      sub: testUser.id,
    },
    headers: {
      authorization: 'Bearer test-token',
    },
    get: jest.fn(),
    header: jest.fn(),
    accepts: jest.fn(),
    acceptsCharsets: jest.fn(),
    acceptsEncodings: jest.fn(),
    acceptsLanguages: jest.fn(),
  } as Partial<RequestWithUser>;
};

export const createTestCustomer = (
  overrides: Partial<Customer> = {},
): Customer => {
  const customer = new Customer();
  customer.id = 1;
  customer.name = 'Test Customer';
  customer.email = 'customer@example.com';
  customer.phone = '123456789';
  customer.address = 'Test Address';
  customer.city = 'Bogotá';
  customer.storeId = 'test-store-id';
  Object.assign(customer, overrides);
  return customer;
};

export const createTestStore = (overrides: Partial<Store> = {}): Store => {
  const store = new Store();
  store.id = 'test-store-id';
  store.name = 'Test Store';
  store.description = 'Test Description';
  store.owner = createTestUser({ role: UserRole.BUSINESS_OWNER });
  Object.assign(store, overrides);
  return store;
};

export const createTestProduct = (
  overrides: Partial<Product> = {},
): Product => {
  const product = new Product();
  product.id = 1;
  product.title = 'Test Product';
  product.description = 'Test Description';
  product.basePrice = 100;
  product.enabled = true;
  product.store = createTestStore();
  Object.assign(product, overrides);
  return product;
};

export const createTestOrder = (overrides: Partial<Order> = {}): Order => {
  const order = new Order();
  order.id = 1;
  order.status = OrderStatus.PENDING;
  order.amount = {
    total: 150,
    discountTotal: 0,
    taxTotal: 0,
    delivery: 0,
  };
  order.store = createTestStore();
  order.items = [];
  Object.assign(order, overrides);
  return order;
};

export const createTestCategory = (
  overrides: Partial<Category> = {},
): Category => {
  const category = new Category();
  category.id = 1;
  category.name = 'Test Category';
  category.description = 'Test Description';
  category.store = createTestStore();
  Object.assign(category, overrides);
  return category;
};

export const createMockRequest = (user?: User) => ({
  user: user || createTestUser(),
  headers: {
    authorization: 'Bearer test-token',
  },
});

export const createMockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
});

export const waitForPromises = () => new Promise(setImmediate);

export const mockFirebaseAdmin = {
  default: {
    auth: jest.fn().mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({
        uid: 'test-user-id',
        email: 'test@example.com',
      }),
      createUser: jest.fn().mockResolvedValue({
        uid: 'test-user-id',
        email: 'test@example.com',
      }),
      updateUser: jest.fn().mockResolvedValue({
        uid: 'test-user-id',
        email: 'test@example.com',
      }),
    }),
  },
  auth: jest.fn().mockReturnValue({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'test-user-id',
      email: 'test@example.com',
    }),
    createUser: jest.fn().mockResolvedValue({
      uid: 'test-user-id',
      email: 'test@example.com',
    }),
    updateUser: jest.fn().mockResolvedValue({
      uid: 'test-user-id',
      email: 'test@example.com',
    }),
  }),
};

export const mockWompiResponses = {
  createPaymentLink: {
    data: {
      data: {
        id: 'test-payment-link-id',
        permalink: 'https://checkout.wompi.co/l/test-payment-link-id',
      },
    },
  },
  createPaymentSource: {
    data: {
      data: {
        id: 123,
        status: 'AVAILABLE',
        status_message: 'Available for transactions',
      },
    },
  },
  createTransaction: {
    data: {
      data: {
        id: 'test-transaction-id',
        status: 'APPROVED',
        status_message: 'Transaction approved',
        amount_in_cents: 10000,
        payment_method: {
          payment_description: JSON.stringify({
            planType: PlanType.BASIC,
            frequency: PaymentFrequency.MONTHLY,
            userId: 'test-user-id',
            sourceId: 'encrypted-source-id',
          }),
        },
      },
    },
  },
};
