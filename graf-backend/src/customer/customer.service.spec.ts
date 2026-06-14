import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CustomerService } from './customer.service';
import { Customer } from './entities/customer.entity';
import { Store } from '../store/entities/store.entity';
import { PluginService } from '../plugins/plugin.service';
import { createMockRepository } from '../test/test-utils';

describe('CustomerService', () => {
  let service: CustomerService;
  let customerRepository: any;
  let storeRepository: any;
  let pluginService: any;
  let queryRunner: any;

  beforeEach(async () => {
    const mockCustomerRepository = createMockRepository();
    const mockStoreRepository = createMockRepository();
    const mockPluginService = { emit: jest.fn() };

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
        merge: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(0),
        })),
      },
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        { provide: PluginService, useValue: mockPluginService },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        { provide: getRepositoryToken(Store), useValue: mockStoreRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    customerRepository = module.get(getRepositoryToken(Customer));
    storeRepository = module.get(getRepositoryToken(Store));
    pluginService = module.get(PluginService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a customer successfully', async () => {
      const dto = { name: 'Test', email: 'test@test.com', storeId: 'store-1' };
      const store = { id: 'store-1' };

      storeRepository.findOne.mockResolvedValue(store);
      customerRepository.findOne.mockResolvedValue(null);
      customerRepository.create.mockReturnValue(dto);
      customerRepository.save.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto as any);

      expect(result.id).toBe(1);
      expect(pluginService.emit).toHaveBeenCalledWith(
        'customer.created',
        expect.anything(),
        store,
      );
    });

    it('should ignore plugin emit errors on create', async () => {
      const dto = { name: 'Test', email: 'test2@test.com', storeId: 'store-1' };
      const store = { id: 'store-1' };

      storeRepository.findOne.mockResolvedValue(store);
      customerRepository.findOne.mockResolvedValue(null);
      customerRepository.create.mockReturnValue(dto);
      customerRepository.save.mockResolvedValue({ id: 2, ...dto });
      pluginService.emit.mockImplementationOnce(() => {
        throw new Error('emit fail');
      });

      const result = await service.create(dto as any);

      expect(result.id).toBe(2);
    });

    it('should exercise console ninja fallback on emit errors', async () => {
      const originalEval = global.eval;
      (global as any).eval = () => {
        throw new Error('eval fail');
      };

      try {
        const dto = {
          name: 'Test',
          email: 'test-ninja@test.com',
          storeId: 'store-1',
        };
        const store = { id: 'store-1' };

        storeRepository.findOne.mockResolvedValue(store);
        customerRepository.findOne.mockResolvedValue(null);
        customerRepository.create.mockReturnValue(dto);
        customerRepository.save.mockResolvedValue({ id: 99, ...dto });
        pluginService.emit.mockImplementationOnce(() => {
          throw new Error('emit fail');
        });

        await service.create(dto as any);
      } finally {
        (global as any).eval = originalEval;
      }
    });

    it('should update existing customer if email matches', async () => {
      const dto = {
        name: 'Updated Name',
        email: 'exist@test.com',
        storeId: 'store-1',
      };
      const existing = {
        id: 1,
        name: 'Old',
        email: 'exist@test.com',
        storeId: 'store-1',
      };

      storeRepository.findOne.mockResolvedValue({ id: 'store-1' });
      customerRepository.findOne.mockResolvedValue(existing);
      customerRepository.merge.mockReturnValue({
        ...existing,
        name: 'Updated Name',
      });
      customerRepository.save.mockResolvedValue({
        ...existing,
        name: 'Updated Name',
      });

      const result = await service.create(dto as any);

      expect(result.name).toBe('Updated Name');
      expect(pluginService.emit).not.toHaveBeenCalled();
    });

    it('should keep existing fields when incoming values are undefined', async () => {
      const dto = {
        email: 'exist2@test.com',
        storeId: 'store-1',
      };
      const existing = {
        id: 2,
        name: 'Old',
        email: 'exist2@test.com',
        phone: '123',
        documentNumber: 'DOC',
        address: 'Addr',
        city: 'City',
        postalCode: 'Code',
        birthDate: '1990-01-01',
        notes: 'Note',
      };

      storeRepository.findOne.mockResolvedValue({ id: 'store-1' });
      customerRepository.findOne.mockResolvedValue(existing);
      customerRepository.merge.mockReturnValue(existing);
      customerRepository.save.mockResolvedValue(existing);

      const result = await service.create(dto as any);

      expect(result.name).toBe('Old');
      expect(result.phone).toBe('123');
    });

    it('should retain existing email when only phone is provided', async () => {
      const dto = {
        phone: '555',
        storeId: 'store-1',
      };
      const existing = {
        id: 3,
        name: 'Existing',
        email: 'existing@test.com',
        phone: '111',
        storeId: 'store-1',
      };

      storeRepository.findOne.mockResolvedValue({ id: 'store-1' });
      customerRepository.findOne.mockResolvedValue(existing);
      customerRepository.merge.mockReturnValue({
        ...existing,
        phone: '555',
      });
      customerRepository.save.mockResolvedValue({
        ...existing,
        phone: '555',
      });

      const result = await service.create(dto as any);

      expect(result.email).toBe('existing@test.com');
      expect(result.phone).toBe('555');
    });

    it('should throw BadRequest if no identifiers provided', async () => {
      storeRepository.findOne.mockResolvedValue({});
      await expect(
        service.create({ name: 'No Contact', storeId: '1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if store does not exist', async () => {
      storeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Test',
          email: 'test@test.com',
          storeId: 'x',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return customers ordered by createdAt', async () => {
      const customers = [{ id: 1 }, { id: 2 }];
      customerRepository.find.mockResolvedValue(customers);

      const result = await service.findAll();

      expect(result).toEqual(customers);
      expect(customerRepository.find).toHaveBeenCalledWith({
        relations: ['store'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when customer missing', async () => {
      customerRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail and findByPhone', () => {
    it('should query by email and store when storeId provided', async () => {
      customerRepository.findOne.mockResolvedValue({ id: 1 });

      await service.findByEmail('test@test.com', 'store-1');

      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@test.com', storeId: 'store-1' },
        relations: ['store'],
      });
    });

    it('should query by phone without store when storeId missing', async () => {
      customerRepository.findOne.mockResolvedValue({ id: 2 });

      await service.findByPhone('12345');

      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: { phone: '12345' },
        relations: ['store'],
      });
    });

    it('should query by phone with store when storeId provided', async () => {
      customerRepository.findOne.mockResolvedValue({ id: 3 });

      await service.findByPhone('999', 'store-1');

      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: { phone: '999', storeId: 'store-1' },
        relations: ['store'],
      });
    });
  });

  describe('findByIdentifiers', () => {
    it('should query by documentNumber when provided', async () => {
      customerRepository.findOne.mockResolvedValue({ id: 1 });

      const result = await (service as any).findByIdentifiers(
        { documentNumber: '123' },
        'store-1',
      );

      expect(result).toEqual({ id: 1 });
      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: [{ documentNumber: '123', storeId: 'store-1' }],
      });
    });

    it('should query by email and phone when provided', async () => {
      customerRepository.findOne.mockResolvedValue({ id: 2 });

      await (service as any).findByIdentifiers(
        { email: 'a@test.com', phone: '555' },
        'store-1',
      );

      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: 'a@test.com', storeId: 'store-1' },
          { phone: '555', storeId: 'store-1' },
        ],
      });
    });

    it('should return null when no identifiers are provided', async () => {
      const result = await (service as any).findByIdentifiers({}, 'store-1');

      expect(result).toBeNull();
      expect(customerRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findByStore', () => {
    it('should use default pagination when not provided', async () => {
      customerRepository.find.mockResolvedValue([]);

      await service.findByStore('store-1');

      expect(customerRepository.find).toHaveBeenCalledWith({
        where: { storeId: 'store-1' },
        relations: ['store'],
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('update', () => {
    it('should move customer to a new store', async () => {
      const existing = { id: 1, storeId: 'store-1', store: { id: 'store-1' } };
      const targetStore = { id: 'store-2' };

      customerRepository.findOne.mockResolvedValue(existing);
      storeRepository.findOne.mockResolvedValue(targetStore);
      customerRepository.save.mockResolvedValue({
        ...existing,
        storeId: 'store-2',
      });

      const result = await service.update(1, { storeId: 'store-2' } as any);

      expect(result.storeId).toBe('store-2');
      expect(storeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'store-2' },
      });
    });

    it('should throw NotFoundException when new store does not exist', async () => {
      customerRepository.findOne.mockResolvedValue({
        id: 1,
        storeId: 'store-1',
        store: { id: 'store-1' },
      });
      storeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(1, { storeId: 'missing' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on identifier conflict', async () => {
      const existing = { id: 1, storeId: 'store-1', store: { id: 'store-1' } };
      const conflict = { id: 2, storeId: 'store-1' };

      customerRepository.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(conflict);

      await expect(
        service.update(1, { email: 'dup@test.com' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove customer', async () => {
      const customer = { id: 1 } as Customer;
      customerRepository.findOne.mockResolvedValue(customer);

      await service.remove(1);

      expect(customerRepository.remove).toHaveBeenCalledWith(customer);
    });
  });

  describe('findOrCreateCustomerForOrder', () => {
    it('should create new customer if not found', async () => {
      const dto = { name: 'Order Cust', email: 'order@test.com' };
      storeRepository.findOne.mockResolvedValue({ id: 's1' });
      customerRepository.findOne.mockResolvedValue(null);
      customerRepository.create.mockReturnValue(dto);
      customerRepository.save.mockResolvedValue({ id: 1, ...dto });

      const result = await service.findOrCreateCustomerForOrder(dto, 's1');

      expect(result.email).toBe(dto.email);
      expect(pluginService.emit).toHaveBeenCalled();
    });

    it('should update existing customer details', async () => {
      const dto = { name: 'New Name', email: 'exist@test.com' };
      const existing = { id: 1, name: 'Old', email: 'exist@test.com' };

      customerRepository.findOne.mockResolvedValue(existing);
      customerRepository.update.mockResolvedValue({});
      customerRepository.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ ...existing, name: 'New Name' });

      const result = await service.findOrCreateCustomerForOrder(dto, 's1');

      expect(result.name).toBe('New Name');
      expect(customerRepository.update).toHaveBeenCalled();
    });

    it('should find customer by phone and update phone when changed', async () => {
      const dto = { phone: '999', name: 'Phone Name' };
      const existing = { id: 3, phone: '111', name: 'Old' };

      customerRepository.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ ...existing, phone: '999', name: 'Old' });
      customerRepository.update.mockResolvedValue({});

      const result = await service.findOrCreateCustomerForOrder(
        dto as any,
        's1',
      );

      expect(customerRepository.update).toHaveBeenCalledWith(3, {
        phone: '999',
        name: 'Phone Name',
      });
      expect(result.phone).toBe('999');
    });

    it('should update address, city, and documentNumber when changed', async () => {
      const dto = {
        email: 'exist@test.com',
        address: 'Street 1',
        city: 'City',
        documentNumber: 'DOC',
      };
      const existing = {
        id: 1,
        email: 'exist@test.com',
        address: 'Old Street',
        city: 'Old City',
        documentNumber: 'OLD',
      };

      customerRepository.findOne.mockResolvedValue(existing);
      customerRepository.update.mockResolvedValue({});
      customerRepository.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ ...existing, ...dto });

      const result = await service.findOrCreateCustomerForOrder(
        dto as any,
        's1',
      );

      expect(result.address).toBe('Street 1');
      expect(result.city).toBe('City');
      expect(result.documentNumber).toBe('DOC');
    });

    it('should return existing customer when no changes detected', async () => {
      const dto = { name: 'Same', email: 'exist@test.com' };
      const existing = { id: 1, name: 'Same', email: 'exist@test.com' };

      customerRepository.findOne.mockResolvedValue(existing);

      const result = await service.findOrCreateCustomerForOrder(dto, 's1');

      expect(result).toBe(existing);
      expect(customerRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if store does not exist', async () => {
      customerRepository.findOne.mockResolvedValue(null);
      storeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOrCreateCustomerForOrder(
          { name: 'Test', email: 'a@test.com' },
          's1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when missing identifiers', async () => {
      customerRepository.findOne.mockResolvedValue(null);
      storeRepository.findOne.mockResolvedValue({ id: 's1' });

      await expect(
        service.findOrCreateCustomerForOrder({ name: 'Test' }, 's1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should ignore plugin emit errors when creating new customer', async () => {
      const dto = { name: 'Order Cust', email: 'order2@test.com' };
      storeRepository.findOne.mockResolvedValue({ id: 's1' });
      customerRepository.findOne.mockResolvedValue(null);
      customerRepository.create.mockReturnValue(dto);
      customerRepository.save.mockResolvedValue({ id: 2, ...dto });
      pluginService.emit.mockImplementationOnce(() => {
        throw new Error('emit fail');
      });

      const result = await service.findOrCreateCustomerForOrder(
        dto as any,
        's1',
      );

      expect(result.id).toBe(2);
    });

    it('should force a new customer for guest orders even when identifiers match', async () => {
      const dto = {
        name: 'Compra Invitado',
        email: 'repeat@test.com',
        phone: '3001234567',
      };

      storeRepository.findOne.mockResolvedValue({ id: 's1' });
      customerRepository.create.mockReturnValue(dto);
      customerRepository.save.mockResolvedValue({ id: 10, ...dto });

      const result = await service.findOrCreateCustomerForOrder(dto, 's1', {
        forceNew: true,
      });

      expect(customerRepository.update).not.toHaveBeenCalled();
      expect(result.id).toBe(10);
      expect(customerRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'repeat@test.com',
          phone: '3001234567',
        }),
      );
    });
  });

  describe('getCustomerStats', () => {
    it('should return default stats after validating customer exists', async () => {
      customerRepository.findOne.mockResolvedValue({ id: 1 });

      const result = await service.getCustomerStats(1);

      expect(result).toEqual({
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
      });
    });
  });

  describe('importCustomersFromExcel', () => {
    it('should return empty summary when rows are missing', async () => {
      const store = { id: 's1' };

      queryRunner.manager.findOne.mockResolvedValueOnce(store);

      const result = await service.importCustomersFromExcel({} as any, 's1');

      expect(result).toMatchObject({
        created: 0,
        updated: 0,
        deleted: 0,
        skipped: 0,
        failed: 0,
      });
    });

    it('should import customers transactionally', async () => {
      const dto = {
        rows: [{ email: 'new@test.com', name: 'New', action: 'create' }],
      };
      const store = { id: 's1' };

      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(null);
      queryRunner.manager.create.mockReturnValue(dto.rows[0]);
      queryRunner.manager.save.mockResolvedValue(dto.rows[0]);

      const result = await service.importCustomersFromExcel(dto as any, 's1');

      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.created).toBe(1);
      expect(result.results[0].status).toBe('created');
    });

    it('should create customer when only phone is provided', async () => {
      const dto = {
        rows: [{ phone: '123', action: 'create' }],
      };
      const store = { id: 's1' };

      queryRunner.manager.findOne
        .mockResolvedValueOnce(store)
        .mockResolvedValueOnce(null);
      queryRunner.manager.create.mockReturnValue({ phone: '123', name: '' });
      queryRunner.manager.save.mockResolvedValue({ id: 1, phone: '123' });

      const result = await service.importCustomersFromExcel(dto as any, 's1');

      expect(result.created).toBe(1);
      expect(queryRunner.manager.create).toHaveBeenCalledWith(
        Customer,
        expect.objectContaining({ name: '' }),
      );
      expect(queryRunner.manager.findOne.mock.calls[1][1].where).toEqual([
        { phone: '123', storeId: 's1' },
      ]);
    });

    it('should default action to update and apply field changes', async () => {
      const dto = {
        rows: [
          {
            email: 'update2@test.com',
            phone: '999',
            address: 'Addr',
            city: 'City',
          },
        ],
      };
      const store = { id: 's1' };
      const existing = { id: 10, email: 'update2@test.com', phone: '111' };

      queryRunner.manager.findOne
        .mockResolvedValueOnce(store)
        .mockResolvedValueOnce(existing);

      const result = await service.importCustomersFromExcel(dto as any, 's1');

      expect(result.updated).toBe(1);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        Customer,
        expect.objectContaining({
          phone: '999',
          address: 'Addr',
          city: 'City',
        }),
      );
    });

    it('should rollback on error', async () => {
      queryRunner.manager.findOne.mockRejectedValue(new Error('DB Fail'));

      await expect(
        service.importCustomersFromExcel({ rows: [] } as any, 's1'),
      ).rejects.toThrow(BadRequestException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should delete existing customer when action is delete', async () => {
      const dto = { rows: [{ email: 'delete@test.com', action: 'delete' }] };
      const store = { id: 's1' };
      const existing = { id: 1, name: 'To Delete', isActive: true };

      queryRunner.manager.findOne
        .mockResolvedValueOnce(store)
        .mockResolvedValueOnce(existing);

      await service.importCustomersFromExcel(dto as any, 's1');

      expect(queryRunner.manager.save).toHaveBeenCalledWith(Customer, {
        ...existing,
        isActive: false,
      });
    });

    it('should skip delete when customer does not exist', async () => {
      const dto = { rows: [{ email: 'missing@test.com', action: 'delete' }] };
      const store = { id: 's1' };

      queryRunner.manager.findOne
        .mockResolvedValueOnce(store)
        .mockResolvedValueOnce(null);

      const result = await service.importCustomersFromExcel(dto as any, 's1');

      expect(result.skipped).toBe(1);
      expect(result.results[0].status).toBe('skipped');
    });

    it('should fail rows without identifiers', async () => {
      const dto = { rows: [{ name: 'No identifiers' }] };
      const store = { id: 's1' };

      queryRunner.manager.findOne.mockResolvedValueOnce(store);

      const result = await service.importCustomersFromExcel(dto as any, 's1');

      expect(result.failed).toBe(1);
      expect(result.results[0].status).toBe('failed');
    });

    it('should update existing customer when action is update', async () => {
      const dto = {
        rows: [
          { email: 'update@test.com', name: 'Updated Name', action: 'update' },
        ],
      };
      const store = { id: 's1' };
      const existing = { id: 1, name: 'Old', email: 'update@test.com' };

      queryRunner.manager.findOne
        .mockResolvedValueOnce(store)
        .mockResolvedValueOnce(existing);

      const result = await service.importCustomersFromExcel(dto as any, 's1');

      expect(result.updated).toBe(1);
      expect(result.results[0].status).toBe('updated');
    });

    it('should fail when store does not exist', async () => {
      queryRunner.manager.findOne.mockResolvedValue(null);

      await expect(
        service.importCustomersFromExcel({ rows: [] } as any, 's1'),
      ).rejects.toThrow(BadRequestException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should update documentNumber and postalCode for existing customer', async () => {
      const dto = {
        rows: [
          {
            email: 'update@test.com',
            documentNumber: 'DOC',
            postalCode: '11001',
            action: 'update',
          },
        ],
      };
      const store = { id: 's1' };
      const existing = {
        id: 1,
        email: 'update@test.com',
        documentNumber: 'OLD',
        postalCode: 'OLD',
      };

      queryRunner.manager.findOne
        .mockResolvedValueOnce(store)
        .mockResolvedValueOnce(existing);

      await service.importCustomersFromExcel(dto as any, 's1');

      expect(queryRunner.manager.save).toHaveBeenCalledWith(Customer, {
        ...existing,
        documentNumber: 'DOC',
        postalCode: '11001',
      });
    });

    it('should skip when action does not allow create', async () => {
      const dto = { rows: [{ email: 'skip@test.com', action: 'ignore' }] };
      const store = { id: 's1' };

      queryRunner.manager.findOne
        .mockResolvedValueOnce(store)
        .mockResolvedValueOnce(null);

      const result = await service.importCustomersFromExcel(dto as any, 's1');

      expect(result.skipped).toBe(1);
      expect(result.results[0].status).toBe('skipped');
    });

    it('should capture row errors during import', async () => {
      const dto = { rows: [{ email: 'error@test.com', action: 'update' }] };
      const store = { id: 's1' };

      queryRunner.manager.findOne
        .mockResolvedValueOnce(store)
        .mockRejectedValueOnce(new Error('Row error'));

      const result = await service.importCustomersFromExcel(dto as any, 's1');

      expect(result.failed).toBe(1);
      expect(result.results[0].status).toBe('failed');
    });

    it('should use fallback error message when missing', async () => {
      const dto = { rows: [{ email: 'error2@test.com', action: 'update' }] };
      const store = { id: 's1' };

      queryRunner.manager.findOne
        .mockResolvedValueOnce(store)
        .mockRejectedValueOnce({ message: '' });

      const result = await service.importCustomersFromExcel(dto as any, 's1');

      expect(result.failed).toBe(1);
      expect(result.results[0].message).toBe('Error desconocido');
    });

    it('should ignore plugin emit errors when creating customers', async () => {
      const dto = {
        rows: [{ email: 'new2@test.com', name: 'New', action: 'create' }],
      };
      const store = { id: 's1' };

      queryRunner.manager.findOne.mockResolvedValueOnce(store);
      queryRunner.manager.findOne.mockResolvedValueOnce(null);
      queryRunner.manager.create.mockReturnValue(dto.rows[0]);
      queryRunner.manager.save.mockResolvedValue(dto.rows[0]);
      pluginService.emit.mockImplementationOnce(() => {
        throw new Error('emit fail');
      });

      const result = await service.importCustomersFromExcel(dto as any, 's1');

      expect(result.created).toBe(1);
    });
  });

  describe('recalculateCustomerStats', () => {
    it('should recalculate stats from orders', async () => {
      const customer = {
        id: 1,
        orders: [{ amount: { total: 100 } }, { amount: { total: 50 } }],
      };

      customerRepository.findOne.mockResolvedValue(customer);
      customerRepository.update.mockResolvedValue({});

      await service.recalculateCustomerStats(1);

      expect(customerRepository.update).toHaveBeenCalledWith(1, {
        totalOrders: 2,
        totalSpent: 150,
      });
    });

    it('should treat missing order amounts as zero', async () => {
      const customer = {
        id: 3,
        orders: [{ amount: { total: 100 } }, { amount: {} }, {}],
      };

      customerRepository.findOne.mockResolvedValue(customer);
      customerRepository.update.mockResolvedValue({});

      await service.recalculateCustomerStats(3);

      expect(customerRepository.update).toHaveBeenCalledWith(3, {
        totalOrders: 3,
        totalSpent: 100,
      });
    });

    it('should handle customers without orders', async () => {
      const customer = {
        id: 2,
        orders: undefined,
      };

      customerRepository.findOne
        .mockResolvedValueOnce(customer)
        .mockResolvedValueOnce(customer);
      customerRepository.update.mockResolvedValue({});

      await service.recalculateCustomerStats(2);

      expect(customerRepository.update).toHaveBeenCalledWith(2, {
        totalOrders: 0,
        totalSpent: 0,
      });
    });

    it('should throw NotFoundException when customer is missing', async () => {
      customerRepository.findOne.mockResolvedValue(null);

      await expect(service.recalculateCustomerStats(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateCustomerOrderStats', () => {
    it('should increment totals', async () => {
      const customer = { id: 1, totalOrders: 2, totalSpent: 100 };
      customerRepository.findOne.mockResolvedValue(customer);
      customerRepository.update.mockResolvedValue({});

      await service.updateCustomerOrderStats(1, 50);

      expect(customerRepository.update).toHaveBeenCalledWith(1, {
        totalOrders: 3,
        totalSpent: 150,
      });
    });
  });

  describe('getStoreStats', () => {
    it('should compute totals and averages', async () => {
      customerRepository.find.mockResolvedValue([
        { totalSpent: 100, isActive: true },
        { totalSpent: 200, isActive: false },
      ]);

      const result = await service.getStoreStats('store-1');

      expect(result.totalCustomers).toBe(2);
      expect(result.activeCustomers).toBe(1);
      expect(result.averageSpent).toBe(150);
    });

    it('should treat missing totalSpent values as zero', async () => {
      customerRepository.find.mockResolvedValue([
        { totalSpent: 100, isActive: true },
        { totalSpent: undefined, isActive: true },
      ]);

      const result = await service.getStoreStats('store-1');

      expect(result.totalCustomers).toBe(2);
      expect(result.activeCustomers).toBe(2);
      expect(result.averageSpent).toBe(50);
    });

    it('should return zeros when no customers exist', async () => {
      customerRepository.find.mockResolvedValue([]);

      const result = await service.getStoreStats('store-1');

      expect(result.totalCustomers).toBe(0);
      expect(result.activeCustomers).toBe(0);
      expect(result.averageSpent).toBe(0);
    });
  });

  describe('exportCustomers', () => {
    it('should throw NotFoundException when store does not exist', async () => {
      storeRepository.findOne.mockResolvedValue(null);

      await expect(service.exportCustomers('store-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include only active customers by default', async () => {
      storeRepository.findOne.mockResolvedValue({ id: 'store-1' });
      customerRepository.find.mockResolvedValue([]);

      await service.exportCustomers('store-1');

      expect(customerRepository.find).toHaveBeenCalledWith({
        where: { storeId: 'store-1', isActive: true },
        order: { createdAt: 'DESC' },
      });
    });

    it('should include inactive customers when requested', async () => {
      storeRepository.findOne.mockResolvedValue({ id: 'store-1' });
      customerRepository.find.mockResolvedValue([]);

      await service.exportCustomers('store-1', true);

      expect(customerRepository.find).toHaveBeenCalledWith({
        where: { storeId: 'store-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });
});
