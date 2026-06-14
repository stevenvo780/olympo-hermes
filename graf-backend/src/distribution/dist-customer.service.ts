import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Customer } from '../customer/entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import {
  AddressDto,
  CreateDistCustomerDto,
  UpdateDistCustomerDto,
} from './dto/customer.dto';
import { DistAccessService } from './dist-access.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class DistCustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(CustomerAddress)
    private readonly addressRepo: Repository<CustomerAddress>,
    private readonly access: DistAccessService,
  ) {}

  async findAll(storeId: string, user: User, search?: string) {
    await this.access.assertAccess(storeId, user);
    return this.customerRepo.find({
      where: search
        ? [
            { storeId, name: ILike(`%${search}%`) },
            { storeId, documentNumber: ILike(`%${search}%`) },
          ]
        : { storeId },
      relations: ['addresses', 'zone'],
      order: { name: 'ASC' },
    });
  }

  /** Internal store-scoped lookup (caller is responsible for access checks). */
  async findByIdInStore(id: number, storeId: string): Promise<Customer> {
    const customer = await this.customerRepo.findOne({
      where: { id, storeId },
      relations: ['addresses', 'zone'],
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  async findOne(id: number, storeId: string, user: User): Promise<Customer> {
    await this.access.assertAccess(storeId, user);
    return this.findByIdInStore(id, storeId);
  }

  async create(
    storeId: string,
    user: User,
    dto: CreateDistCustomerDto,
  ): Promise<Customer> {
    await this.access.assertAccess(storeId, user);
    // G3: creating a NEW customer requires at least one delivery address/sede.
    // (Legacy customers loaded without addresses are tolerated via the bulk
    //  import / seed, see G1 — they can have addresses added later.)
    const validAddresses = (dto.addresses || []).filter((a) =>
      a?.address?.trim(),
    );
    if (validAddresses.length === 0) {
      throw new BadRequestException(
        'Para crear un cliente se requiere al menos una dirección/sede',
      );
    }
    const customer = this.customerRepo.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      documentNumber: dto.documentNumber,
      deliveryZoneId: dto.deliveryZoneId,
      storeId,
      isActive: true,
    });
    customer.addresses = (dto.addresses || []).map((a, idx) =>
      this.addressRepo.create({
        label: a.label,
        address: a.address,
        city: a.city,
        phone: a.phone,
        contactName: a.contactName,
        notes: a.notes,
        isDefault: a.isDefault ?? idx === 0,
        active: true,
      }),
    );
    return this.customerRepo.save(customer);
  }

  async update(
    id: number,
    storeId: string,
    user: User,
    dto: UpdateDistCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id, storeId, user);
    Object.assign(customer, dto);
    await this.customerRepo.save(customer);
    return this.findByIdInStore(id, storeId);
  }

  // --- Addresses (sedes) ---

  async addAddress(
    customerId: number,
    storeId: string,
    user: User,
    dto: AddressDto,
  ): Promise<CustomerAddress> {
    const customer = await this.findOne(customerId, storeId, user);
    const isFirst = (customer.addresses || []).length === 0;
    const address = this.addressRepo.create({
      customerId: customer.id,
      label: dto.label,
      address: dto.address,
      city: dto.city,
      phone: dto.phone,
      contactName: dto.contactName,
      notes: dto.notes,
      isDefault: dto.isDefault ?? isFirst,
      active: true,
    });
    if (address.isDefault) {
      await this.addressRepo.update(
        { customerId: customer.id },
        { isDefault: false },
      );
    }
    return this.addressRepo.save(address);
  }

  /** Loads an address verifying it belongs to a customer of the given store. */
  private async loadAddressInStore(
    addressId: number,
    storeId: string,
  ): Promise<CustomerAddress> {
    const address = await this.addressRepo.findOne({
      where: { id: addressId },
      relations: ['customer'],
    });
    if (!address) throw new NotFoundException('Dirección no encontrada');
    if (address.customer?.storeId !== storeId) {
      throw new ForbiddenException('La dirección no pertenece a esta tienda');
    }
    return address;
  }

  async updateAddress(
    addressId: number,
    storeId: string,
    user: User,
    dto: Partial<AddressDto>,
  ): Promise<CustomerAddress> {
    await this.access.assertAccess(storeId, user);
    const address = await this.loadAddressInStore(addressId, storeId);
    if (dto.isDefault) {
      await this.addressRepo.update(
        { customerId: address.customerId },
        { isDefault: false },
      );
    }
    Object.assign(address, dto);
    return this.addressRepo.save(address);
  }

  async removeAddress(
    addressId: number,
    storeId: string,
    user: User,
  ): Promise<void> {
    await this.access.assertAccess(storeId, user);
    const address = await this.loadAddressInStore(addressId, storeId);
    await this.addressRepo.remove(address);
  }

  /** Resolves the address to use for an order, validating ownership. */
  resolveAddress(
    customer: Customer,
    customerAddressId?: number,
  ): CustomerAddress | undefined {
    const addresses = customer.addresses || [];
    if (customerAddressId) {
      const found = addresses.find((a) => a.id === customerAddressId);
      if (!found) {
        throw new BadRequestException(
          'La dirección elegida no pertenece al cliente',
        );
      }
      return found;
    }
    return addresses.find((a) => a.isDefault) || addresses[0];
  }
}
