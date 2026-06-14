import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

describe('CustomerController', () => {
  let controller: CustomerController;
  let customerService: CustomerService;

  const mockCustomerService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByStore: jest.fn(),
    exportCustomers: jest.fn(),
    importCustomersFromExcel: jest.fn(),
    getStoreStats: jest.fn(),
    recalculateCustomerStats: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getCustomerStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        {
          provide: CustomerService,
          useValue: mockCustomerService,
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CustomerController>(CustomerController);
    customerService = module.get<CustomerService>(CustomerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer', async () => {
      const createCustomerDto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+57 300 123 4567',
        storeId: 'store1',
      } as CreateCustomerDto;

      const expectedCustomer = {
        id: 1,
        ...createCustomerDto,
      };

      mockCustomerService.create.mockResolvedValue(expectedCustomer);

      const result = await controller.create(createCustomerDto);

      expect(result).toEqual(expectedCustomer);
      expect(customerService.create).toHaveBeenCalledWith(createCustomerDto);
    });
  });

  describe('findByStore', () => {
    it('should return customers for a store', async () => {
      const expectedResult = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'John Smith', email: 'smith@example.com' },
      ];

      mockCustomerService.findByStore.mockResolvedValue(expectedResult);

      const result = await controller.findByStore('store1');

      expect(result).toEqual(expectedResult);
      expect(customerService.findByStore).toHaveBeenCalledWith('store1', {
        page: 1,
        limit: 10,
      });
    });
  });

  describe('exportCustomers', () => {
    it('should export customers including inactive when requested', async () => {
      const expected = [{ id: 1, name: 'Jane' }];
      mockCustomerService.exportCustomers.mockResolvedValue(expected);

      const result = await controller.exportCustomers('store1', 'true');

      expect(result).toEqual(expected);
      expect(customerService.exportCustomers).toHaveBeenCalledWith(
        'store1',
        true,
      );
    });
  });

  describe('importCustomers', () => {
    it('should import customers from excel data', async () => {
      const dto = { rows: [] } as any;
      const expected = {
        created: 0,
        updated: 0,
        deleted: 0,
        skipped: 0,
        failed: 0,
        results: [],
      };
      mockCustomerService.importCustomersFromExcel.mockResolvedValue(expected);

      const result = await controller.importCustomers('store1', dto);

      expect(result).toEqual(expected);
      expect(customerService.importCustomersFromExcel).toHaveBeenCalledWith(
        dto,
        'store1',
      );
    });
  });

  describe('getStoreStats', () => {
    it('should return store stats', async () => {
      const stats = { total: 2 };
      mockCustomerService.getStoreStats.mockResolvedValue(stats);

      const result = await controller.getStoreStats('store1');

      expect(result).toEqual(stats);
      expect(customerService.getStoreStats).toHaveBeenCalledWith('store1');
    });
  });

  describe('recalculateStoreStats', () => {
    it('should aggregate recalculation results and handle errors', async () => {
      mockCustomerService.findByStore.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mockCustomerService.recalculateCustomerStats
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('fail'));

      const result = await controller.recalculateStoreStats('store1');

      expect(result).toEqual({ total: 2, updated: 1, errors: 1 });
      expect(customerService.recalculateCustomerStats).toHaveBeenCalledTimes(2);
    });
  });

  describe('getStats', () => {
    it('should return customer statistics', async () => {
      const customerId = 1;
      const expectedStats = {
        totalCustomers: 100,
        activeCustomers: 80,
        totalLoyaltyPoints: 5000,
        averageSpent: 250.5,
        averageOrders: 3.2,
      };

      mockCustomerService.getCustomerStats.mockResolvedValue(expectedStats);

      const result = await controller.getStats(customerId);

      expect(result).toEqual(expectedStats);
      expect(customerService.getCustomerStats).toHaveBeenCalledWith(customerId);
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      const customerId = 1;
      const expectedCustomer = {
        id: customerId,
        name: 'John Doe',
        email: 'john@example.com',
      };

      mockCustomerService.findOne.mockResolvedValue(expectedCustomer);

      const result = await controller.findOne(customerId);

      expect(result).toEqual(expectedCustomer);
      expect(customerService.findOne).toHaveBeenCalledWith(customerId);
    });
  });

  describe('update', () => {
    it('should update a customer', async () => {
      const customerId = 1;
      const updateCustomerDto: UpdateCustomerDto = {
        name: 'Updated Name',
        phone: '+57 300 999 8888',
      };

      const expectedCustomer = {
        id: customerId,
        ...updateCustomerDto,
      };

      mockCustomerService.update.mockResolvedValue(expectedCustomer);

      const result = await controller.update(customerId, updateCustomerDto);

      expect(result).toEqual(expectedCustomer);
      expect(customerService.update).toHaveBeenCalledWith(
        customerId,
        updateCustomerDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove a customer', async () => {
      const customerId = 1;

      mockCustomerService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(customerId);

      expect(result).toBeUndefined();
      expect(customerService.remove).toHaveBeenCalledWith(customerId);
    });
  });
});
