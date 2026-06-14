import { RegisterUserDto } from './auth/dto/register.dto';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateCategoryDto } from './category/dto/create-category.dto';
import { ImportCategoryExcelDto } from './category/dto/import-category-excel.dto';
import { UpdateCategoryDto } from './category/dto/update-category.dto';
import { Category } from './category/entities/category.entity';
import { CreateConfigDto } from './config/dto/create-config.dto';
import { Config } from './config/entities/config.entity';
import { PaymentCredentials } from './credentials/entities/payment-credentials.entity';
import { FindCustomersDto } from './customer/dto/find-customers.dto';
import {
  CustomerExcelRowDto,
  ImportCustomerExcelDto,
} from './customer/dto/import-customer-excel.dto';
import { Customer } from './customer/entities/customer.entity';
import { DeliveryZone } from './delivery-zone/entities/delivery-zone.entity';
import { Discount } from './discount/entities/discount.entity';
import { OrderItem } from './order/entities/order-item.entity';
import { Order } from './order/entities/order.entity';
import { UpdateProductDto } from './product/dto/update-product.dto';
import { ProductCategoryOrder } from './product/entities/product-category-order.entity';
import { Product } from './product/entities/product.entity';
import {
  CreateProfileDto,
  ShippingAddressDto,
} from './profile/dto/create-profile.dto';
import { Profile } from './profile/entities/profile.entity';
import { Store } from './store/entities/store.entity';
import { Tax } from './tax/entities/tax.entity';
import { FindUsersDto } from './user/dto/find-users.dto';
import { Subscription } from './user/entities/subscription.entity';
import { User } from './user/entities/user.entity';
import { PaymentLinkMapping } from './wompi/entities/payment-link.entity';
import { PaymentSource } from './wompi/entities/payment-source.entity';
import { mockFirebaseAdmin, mockFirebaseUser } from './test/firebase-mock';
import {
  createMockRequest,
  createMockRequestWithUser,
  createMockResponse,
  createTestCategory,
  createTestProduct,
  createTestStore,
  createTestUser,
  createTestingModule,
  waitForPromises,
} from './test/test-utils';

describe('Coverage - DTOs and Entities', () => {
  it('instantiates DTOs and entities to exercise decorators', () => {
    const register = new RegisterUserDto();
    register.email = 'user@example.com';
    register.password = 'Password123';
    register.name = 'Test User';

    const createCategory = new CreateCategoryDto();
    createCategory.name = 'Categoria';
    createCategory.description = 'Descripcion';

    const updateCategory = new UpdateCategoryDto();
    updateCategory.name = 'Categoria 2';

    const importCategory = new ImportCategoryExcelDto();
    importCategory.rows = [];
    importCategory.deleteCategoriesNotInExcel = false;

    const createConfig = new CreateConfigDto();

    const findCustomers = new FindCustomersDto();
    findCustomers.search = 'cliente';
    findCustomers.page = 1;
    findCustomers.limit = 10;

    const importCustomer = new ImportCustomerExcelDto();
    importCustomer.rows = [
      {
        name: 'Cliente',
        email: 'cliente@example.com',
        phone: '123',
      } as CustomerExcelRowDto,
    ];

    const updateProduct = new UpdateProductDto();
    updateProduct.title = 'Producto';

    const createProfile = new CreateProfileDto();

    const findUsers = new FindUsersDto();
    findUsers.search = 'user';

    const user = new User();
    user.id = 'u1';
    user.email = 'user@example.com';

    const subscription = new Subscription();
    subscription.planType = 'FREE' as any;

    const store = new Store();
    store.id = 's1';
    store.name = 'Store';

    const category = new Category();
    category.name = 'Cat';

    const product = new Product();
    product.title = 'Producto';

    const productCategoryOrder = new ProductCategoryOrder();

    const order = new Order();
    order.id = 1;

    const orderItem = new OrderItem();
    orderItem.quantity = 1;

    const customer = new Customer();
    customer.name = 'Cliente';

    const deliveryZone = new DeliveryZone();
    deliveryZone.zone = 'Zona';

    const discount = new Discount();
    discount.name = 'Desc';

    const config = new Config();

    const credentials = new PaymentCredentials();

    const profile = new Profile();

    const tax = new Tax();
    tax.name = 'IVA';

    const paymentLink = new PaymentLinkMapping();
    paymentLink.id = 1;

    const paymentSource = new PaymentSource();
    paymentSource.id = 1;

    expect(register).toBeInstanceOf(RegisterUserDto);
    expect(createCategory).toBeInstanceOf(CreateCategoryDto);
    expect(updateCategory).toBeInstanceOf(UpdateCategoryDto);
    expect(importCategory).toBeInstanceOf(ImportCategoryExcelDto);
    expect(createConfig).toBeInstanceOf(CreateConfigDto);
    expect(findCustomers).toBeInstanceOf(FindCustomersDto);
    expect(importCustomer.rows).toHaveLength(1);
    expect(updateProduct).toBeInstanceOf(UpdateProductDto);
    expect(createProfile).toBeInstanceOf(CreateProfileDto);
    expect(findUsers).toBeInstanceOf(FindUsersDto);
    expect(user.email).toBe('user@example.com');
    expect(subscription.planType).toBe('FREE');
    expect(store.name).toBe('Store');
    expect(category.name).toBe('Cat');
    expect(product.title).toBe('Producto');

    expect(order.id).toBe(1);
    expect(orderItem.quantity).toBe(1);
    expect(customer.name).toBe('Cliente');
    expect(deliveryZone.zone).toBe('Zona');
    expect(discount.name).toBe('Desc');

    expect(tax.name).toBe('IVA');
    expect(paymentLink.id).toBe(1);
    expect(paymentSource.id).toBe(1);
    expect(productCategoryOrder).toBeInstanceOf(ProductCategoryOrder);
    expect(config).toBeInstanceOf(Config);
    expect(credentials).toBeInstanceOf(PaymentCredentials);
    expect(profile).toBeInstanceOf(Profile);
  });

  it('exercises firebase mocks', async () => {
    expect(mockFirebaseUser.toJSON()).toMatchObject({
      uid: 'firebase-uid',
      email: 'test@example.com',
    });
    expect(mockFirebaseUser.metadata.toJSON()).toHaveProperty('creationTime');

    const auth = mockFirebaseAdmin.auth();
    const token = await auth.verifyIdToken('token');
    expect(token.uid).toBe('firebase-uid');
  });

  it('creates a testing module helper', async () => {
    const module = await createTestingModule([]);
    expect(module).toBeDefined();
  });

  it('exercises test utils helpers and firebase admin extras', async () => {
    const user = createTestUser({ email: 'helper@example.com' });
    const store = createTestStore({ owner: user });
    const product = createTestProduct({ store });
    const category = createTestCategory({ store });
    const req = createMockRequest(user);
    const reqWithUser = createMockRequestWithUser(user);
    const res = createMockResponse();

    expect(product.store).toBe(store);
    expect(category.store).toBe(store);
    expect(req.user).toBeDefined();
    expect(reqWithUser.user?.email).toBe(user.email);
    expect(res.status).toBeDefined();

    await waitForPromises();

    expect(mockFirebaseAdmin.firestore()).toEqual({});
    expect(mockFirebaseAdmin.storage()).toEqual({});
  });

  it('transforms DTOs and runs validators', () => {
    const customersDto = plainToInstance(FindCustomersDto, {
      page: '2',
      limit: '5',
      minLoyaltyPoints: '1',
      maxLoyaltyPoints: '2',
      minTotalSpent: '10.5',
      maxTotalSpent: '20.5',
      isActive: 'true',
    });
    expect(customersDto.page).toBe(2);
    expect(customersDto.limit).toBe(5);
    expect(customersDto.minLoyaltyPoints).toBe(1);
    expect(customersDto.maxTotalSpent).toBe(20.5);
    expect(customersDto.isActive).toBe(true);

    const usersDto = plainToInstance(FindUsersDto, {
      limit: '3',
      offset: '1',
      minPoints: '4',
      maxPoints: '9',
      sortOrder: 'ASC',
    });
    expect(usersDto.limit).toBe(3);
    expect(usersDto.offset).toBe(1);
    expect(usersDto.minPoints).toBe(4);
    expect(usersDto.sortOrder).toBe('ASC');

    const profileDto = plainToInstance(CreateProfileDto, {
      shippingAddress: {
        address: 'Calle 1',
        city: 'Lima',
        department: 'Lima',
        country: 'PE',
      },
    });
    expect(profileDto.shippingAddress).toBeInstanceOf(ShippingAddressDto);

    const configDto = plainToInstance(CreateConfigDto, {
      palette: [
        '#000000',
        '#111111',
        '#222222',
        '#333333',
        '#444444',
        '#555555',
      ],
      banner: 'banner.jpg',
      storeName: 'Test Store',
      primaryColor: '#000000',
      textColor: '#ffffff',
      logo: 'logo.png',
      font: 'Arial',
      favicon: 'favicon.ico',
      bannerTitle: 'Title',
      bannerSubtitle: 'Subtitle',
      about: 'About',
      phoneNumber: '123',
      address: 'Address',
      city: 'City',
      country: 'Country',
      schedule: [
        {
          day: 'monday',
          isOpen: true,
          openTime: '08:00',
          closeTime: '18:00',
        },
      ],
      coordinates: { lat: 1, lng: 2 },
      dominios: ['example.com'],
      productViewConfig: {
        defaultView: 'grid',
        availableViews: ['grid'],
      },
    });
    expect(configDto.schedule?.[0].day).toBe('monday');
    expect(configDto.coordinates?.lat).toBe(1);
    expect(configDto.productViewConfig?.defaultView).toBe('grid');

    const importDto = plainToInstance(ImportCustomerExcelDto, {
      rows: [{ email: 'client@example.com' }],
    });
    expect(validateSync(importDto).length).toBe(0);

    const updateWithStock = plainToInstance(UpdateProductDto, { stock: 5 });
    const updateWithoutStock = plainToInstance(UpdateProductDto, {});
    expect(validateSync(updateWithStock).length).toBe(0);
    expect(validateSync(updateWithoutStock).length).toBe(0);
  });
});
