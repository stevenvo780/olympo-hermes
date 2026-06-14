import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tax } from './entities/tax.entity';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { Store } from '../store/entities/store.entity';
import { User } from '../user/entities/user.entity';
import { checkStoreAccess } from '../utils/permissions';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(Tax)
    private taxRepository: Repository<Tax>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async create(dto: CreateTaxDto, storeId: string, user: User): Promise<Tax> {
    const store = await checkStoreAccess(this.storeRepository, storeId, user);

    const existingTax = await this.taxRepository.findOne({
      where: { name: dto.name, store: { id: storeId } },
    });
    if (existingTax) {
      throw new ConflictException(
        `Tax with name "${dto.name}" already exists in this store`,
      );
    }

    const tax = this.taxRepository.create({ ...dto, store });
    return this.taxRepository.save(tax);
  }

  async findByStore(storeId: string): Promise<Tax[]> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['owner'],
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return this.taxRepository.find({ where: { store: { id: storeId } } });
  }

  async getTaxById(id: number, storeId: string): Promise<Tax> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['owner'],
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    const tax = await this.taxRepository.findOne({
      where: { id },
      relations: ['store'],
    });
    if (!tax) {
      throw new NotFoundException('Tax not found');
    }
    if (tax.store.id !== store.id) {
      throw new ForbiddenException(
        'Tax does not belong to the specified store',
      );
    }
    return tax;
  }

  async update(
    id: number,
    dto: UpdateTaxDto,
    storeId: string,
    user: User,
  ): Promise<Tax> {
    const store = await checkStoreAccess(this.storeRepository, storeId, user);

    const tax = await this.taxRepository.findOne({
      where: { id },
      relations: ['store'],
    });
    if (!tax) {
      throw new NotFoundException('Tax not found');
    }
    if (tax.store.id !== store.id) {
      throw new ForbiddenException(
        'Tax does not belong to the specified store',
      );
    }

    if (dto.name && dto.name !== tax.name) {
      const existingTax = await this.taxRepository.findOne({
        where: { name: dto.name, store: { id: storeId } },
      });
      if (existingTax) {
        throw new ConflictException(
          `Tax with name "${dto.name}" already exists in this store`,
        );
      }
    }

    Object.assign(tax, dto);
    return this.taxRepository.save(tax);
  }

  async remove(id: number, storeId: string, user: User): Promise<void> {
    const store = await checkStoreAccess(this.storeRepository, storeId, user);

    const tax = await this.taxRepository.findOne({
      where: { id },
      relations: ['store'],
    });
    if (!tax) {
      throw new NotFoundException('Tax not found');
    }
    if (tax.store.id !== store.id) {
      throw new ForbiddenException(
        'Tax does not belong to the specified store',
      );
    }
    const result = await this.taxRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Tax not found');
    }
  }
}
