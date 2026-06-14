import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Customer } from './entities/customer.entity';
import { Store } from '../store/entities/store.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ImportCustomerExcelDto } from './dto/import-customer-excel.dto';
import { PluginService } from '../plugins/plugin.service';
import { CauceHubService } from '../cauce/hub.service';
import { SortOrder } from '../user/dto/find-users.dto';

export interface CustomerForOrderDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  documentNumber?: string;
}

interface FindOrCreateCustomerForOrderOptions {
  forceNew?: boolean;
}

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly pluginService: PluginService,
    private readonly cauceHub: CauceHubService,
  ) {}

  /** Map a Graf Customer entity to the @cauce/contracts CUSTOMER_CREATED payload. */
  private toCauceCustomerPayload(customer: Customer) {
    return {
      customer: {
        id: customer?.id != null ? String(customer.id) : undefined,
        name: customer?.name || undefined,
        phone: customer?.phone || undefined,
        email: customer?.email || undefined,
      },
    };
  }

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const store = await this.storeRepository.findOne({
      where: { id: createCustomerDto.storeId },
    });

    if (!store) {
      throw new NotFoundException(
        `Store with ID ${createCustomerDto.storeId} not found`,
      );
    }

    const { email, phone, documentNumber } = createCustomerDto;
    if (!email && !phone && !documentNumber) {
      throw new BadRequestException(
        'Debe proporcionar al menos uno de: email, phone o documentNumber',
      );
    }

    const existing = await this.findByIdentifiers(
      { email, phone, documentNumber },
      createCustomerDto.storeId,
    );

    if (existing) {
      const merged = this.customerRepository.merge(existing, {
        name: createCustomerDto.name ?? existing.name,
        email: email ?? existing.email,
        phone: phone ?? existing.phone,
        documentNumber: documentNumber ?? existing.documentNumber,
        address: createCustomerDto.address ?? existing.address,
        city: createCustomerDto.city ?? existing.city,
        postalCode: createCustomerDto.postalCode ?? existing.postalCode,
        birthDate: createCustomerDto.birthDate ?? existing.birthDate,
        notes: createCustomerDto.notes ?? existing.notes,
      });
      return await this.customerRepository.save(merged);
    }

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      store,
    });
    const savedCustomer = await this.customerRepository.save(customer);

    try {
      this.pluginService.emit(
        'customer.created',
        savedCustomer as unknown as Record<string, unknown>,
        store,
      );
    } catch (err) {
      console.error('Error emitiendo evento customer.created:', err);
    }

    // Cauce: Graf owns the online customer (flow 5, cliente.creado).
    // Fault-tolerant: never breaks the create transaction.
    await this.cauceHub.customerCreated(
      this.toCauceCustomerPayload(savedCustomer),
    );

    return savedCustomer;
  }

  async findAll(): Promise<Customer[]> {
    return await this.customerRepository.find({
      relations: ['store'],
      order: { createdAt: SortOrder.DESC },
    });
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['store'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async findByEmail(email: string, storeId?: string): Promise<Customer | null> {
    const whereCondition: Record<string, unknown> = { email };
    if (storeId) {
      whereCondition.storeId = storeId;
    }

    return await this.customerRepository.findOne({
      where: whereCondition,
      relations: ['store'],
    });
  }

  async findByPhone(phone: string, storeId?: string): Promise<Customer | null> {
    const whereCondition: Record<string, unknown> = { phone };
    if (storeId) {
      whereCondition.storeId = storeId;
    }

    return await this.customerRepository.findOne({
      where: whereCondition,
      relations: ['store'],
    });
  }

  private async findByIdentifiers(
    identifiers: { email?: string; phone?: string; documentNumber?: string },
    storeId: string,
  ): Promise<Customer | null> {
    const where: Array<Record<string, unknown>> = [];
    if (identifiers.email) where.push({ email: identifiers.email, storeId });
    if (identifiers.phone) where.push({ phone: identifiers.phone, storeId });
    if (identifiers.documentNumber)
      where.push({ documentNumber: identifiers.documentNumber, storeId });

    if (where.length === 0) return null;

    return await this.customerRepository.findOne({ where });
  }

  async findByStore(
    storeId: string,
    pagination?: { page: number; limit: number },
  ): Promise<Customer[]> {
    const { page = 1, limit = 10 } = pagination || {};
    return await this.customerRepository.find({
      where: { storeId },
      relations: ['store'],
      order: { createdAt: SortOrder.DESC },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);

    if (
      updateCustomerDto.storeId &&
      updateCustomerDto.storeId !== customer.storeId
    ) {
      const store = await this.storeRepository.findOne({
        where: { id: updateCustomerDto.storeId },
      });

      if (!store) {
        throw new NotFoundException(
          `Store with ID ${updateCustomerDto.storeId} not found`,
        );
      }
      customer.store = store;
      customer.storeId = store.id;
    }

    if (
      updateCustomerDto.email ||
      updateCustomerDto.phone ||
      updateCustomerDto.documentNumber
    ) {
      const conflict = await this.findByIdentifiers(
        {
          email: updateCustomerDto.email,
          phone: updateCustomerDto.phone,
          documentNumber: updateCustomerDto.documentNumber,
        },
        customer.storeId,
      );
      if (conflict && conflict.id !== customer.id) {
        throw new BadRequestException(
          'Ya existe otro cliente en esta tienda con el mismo email, teléfono o documento',
        );
      }
    }

    Object.assign(customer, updateCustomerDto);
    return await this.customerRepository.save(customer);
  }

  async remove(id: number): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
  }

  async findOrCreateCustomerForOrder(
    customerData: CustomerForOrderDto,
    storeId: string,
    options?: FindOrCreateCustomerForOrderOptions,
  ): Promise<Customer> {
    const forceNew = options?.forceNew === true;
    let customer: Customer | null = null;
    if (!forceNew && customerData.email) {
      customer = await this.findByEmail(customerData.email, storeId);
    }

    if (!forceNew && !customer && customerData.phone) {
      customer = await this.findByPhone(customerData.phone, storeId);
    }

    if (customer) {
      const updateData: Partial<Customer> = {};

      if (customerData.name && customerData.name !== customer.name) {
        updateData.name = customerData.name;
      }
      if (customerData.phone && customerData.phone !== customer.phone) {
        updateData.phone = customerData.phone;
      }
      if (customerData.address && customerData.address !== customer.address) {
        updateData.address = customerData.address;
      }
      if (customerData.city && customerData.city !== customer.city) {
        updateData.city = customerData.city;
      }

      if (
        customerData.documentNumber &&
        customerData.documentNumber !== customer.documentNumber
      ) {
        updateData.documentNumber = customerData.documentNumber;
      }

      if (Object.keys(updateData).length > 0) {
        await this.customerRepository.update(customer.id, updateData);
        return await this.findOne(customer.id);
      }

      return customer;
    }

    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    if (
      !customerData.email &&
      !customerData.phone &&
      !customerData.documentNumber
    ) {
      throw new BadRequestException(
        'Para crear un cliente desde la orden, proporcione email, teléfono o documento',
      );
    }

    const newCustomer = this.customerRepository.create({
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone || undefined,
      address: customerData.address || undefined,
      city: customerData.city || undefined,
      documentNumber: customerData.documentNumber,
      storeId,
      store,
    });

    const savedCustomer = await this.customerRepository.save(newCustomer);

    try {
      this.pluginService.emit(
        'customer.created',
        savedCustomer as unknown as Record<string, unknown>,
        store,
      );
    } catch (err) {
      console.error('Error emitiendo evento customer.created:', err);
    }

    // Cauce: Graf owns the online customer (flow 5, cliente.creado).
    // Fault-tolerant: never breaks the order/customer creation flow.
    await this.cauceHub.customerCreated(
      this.toCauceCustomerPayload(savedCustomer),
    );

    return savedCustomer;
  }

  async getCustomerStats(customerId: number): Promise<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  }> {
    await this.findOne(customerId);

    return {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
    };
  }

  async updateCustomerOrderStats(
    customerId: number,
    orderAmount: number,
  ): Promise<void> {
    const customer = await this.findOne(customerId);

    await this.customerRepository.update(customerId, {
      totalOrders: customer.totalOrders + 1,
      totalSpent: Number(customer.totalSpent) + orderAmount,
    });
  }

  async recalculateCustomerStats(customerId: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: ['orders'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const totalOrders = customer.orders?.length || 0;
    const totalSpent =
      customer.orders?.reduce((sum, order) => {
        return sum + Number(order.amount?.total || 0);
      }, 0) || 0;

    await this.customerRepository.update(customerId, {
      totalOrders,
      totalSpent,
    });

    return await this.findOne(customerId);
  }

  async getStoreStats(storeId: string): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    averageSpent: number;
  }> {
    const customers = await this.customerRepository.find({
      where: { storeId },
    });

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(
      (c) => c.isActive !== false,
    ).length;

    const totalSpent = customers.reduce((sum, customer) => {
      return sum + Number(customer.totalSpent || 0);
    }, 0);

    const averageSpent = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

    return {
      totalCustomers,
      activeCustomers,
      averageSpent,
    };
  }

  async exportCustomers(
    storeId: string,
    includeInactive = false,
  ): Promise<Customer[]> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const whereCondition: Record<string, unknown> = { storeId };
    if (!includeInactive) {
      whereCondition.isActive = true;
    }

    return await this.customerRepository.find({
      where: whereCondition,
      order: { createdAt: SortOrder.DESC },
    });
  }

  async importCustomersFromExcel(
    dto: ImportCustomerExcelDto,
    storeId: string,
  ): Promise<{
    created: number;
    updated: number;
    deleted: number;
    skipped: number;
    failed: number;
    results: {
      email: string;
      status: string;
      message: string;
      name?: string;
    }[];
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const store = await queryRunner.manager.findOne(Store, {
        where: { id: storeId },
      });

      if (!store) {
        throw new NotFoundException('Store not found');
      }

      const summary = {
        created: 0,
        updated: 0,
        deleted: 0,
        skipped: 0,
        failed: 0,
      };

      const results: {
        email: string;
        status: string;
        message: string;
        name?: string;
      }[] = [];

      const rows = dto.rows || [];

      for (const row of rows) {
        const email = (row.email || '').toString().trim().toLowerCase();
        const phone = (row.phone || '').toString().trim();
        const documentNumber = (row.documentNumber || '').toString().trim();

        if (!email && !phone && !documentNumber) {
          results.push({
            email: 'N/A',
            status: 'failed',
            message: 'Debe incluir al menos email, teléfono o documento',
          });
          summary.failed++;
          continue;
        }

        try {
          const existing = await queryRunner.manager.findOne(Customer, {
            where: [
              ...(email ? [{ email, storeId }] : []),
              ...(phone ? [{ phone, storeId }] : []),
              ...(documentNumber ? [{ documentNumber, storeId }] : []),
            ],
          });

          const action = row.action || 'update';

          if (action === 'delete') {
            if (existing) {
              existing.isActive = false;
              await queryRunner.manager.save(Customer, existing);
              results.push({
                email,
                name: existing.name,
                status: 'deleted',
                message: 'Cliente desactivado',
              });
              summary.deleted++;
            } else {
              results.push({
                email,
                status: 'skipped',
                message: 'Cliente no existe para eliminar',
              });
              summary.skipped++;
            }
            continue;
          }

          if (existing) {
            if (row.name !== undefined) existing.name = row.name;
            if (row.phone !== undefined) existing.phone = row.phone;
            if (row.documentNumber !== undefined)
              existing.documentNumber = row.documentNumber;
            if (row.address !== undefined) existing.address = row.address;
            if (row.city !== undefined) existing.city = row.city;
            if (row.postalCode !== undefined)
              existing.postalCode = row.postalCode;

            await queryRunner.manager.save(Customer, existing);

            results.push({
              email,
              name: existing.name,
              status: 'updated',
              message: 'Cliente actualizado',
            });
            summary.updated++;
          } else {
            if (action === 'create' || action === 'update') {
              const newCustomer = queryRunner.manager.create(Customer, {
                email,
                name: row.name || '',
                phone: row.phone,
                documentNumber: row.documentNumber,
                address: row.address,
                city: row.city,
                postalCode: row.postalCode,
                storeId,
                isActive: true,
                totalOrders: 0,
                totalSpent: 0,
                loyaltyPoints: 0,
              });

              await queryRunner.manager.save(Customer, newCustomer);

              results.push({
                email,
                name: newCustomer.name,
                status: 'created',
                message: 'Cliente creado',
              });
              summary.created++;

              try {
                this.pluginService.emit(
                  'customer.created',
                  newCustomer as unknown as Record<string, unknown>,
                  store,
                );
              } catch (err) {
                console.error('Error emitiendo evento customer.created:', err);
              }

              // Cauce: Graf owns the online customer (flow 5, cliente.creado).
              // Fault-tolerant: never breaks the Excel import transaction.
              await this.cauceHub.customerCreated(
                this.toCauceCustomerPayload(newCustomer as Customer),
              );
            } else {
              results.push({
                email,
                status: 'skipped',
                message: 'Cliente no existe y acción no permite crear',
              });
              summary.skipped++;
            }
          }
        } catch (error) {
          console.error(`Error procesando cliente ${email}:`, error);
          results.push({
            email,
            status: 'failed',
            message: error.message || 'Error desconocido',
          });
          summary.failed++;
        }
      }

      await queryRunner.commitTransaction();

      return {
        ...summary,
        results,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `Error en la importación: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
