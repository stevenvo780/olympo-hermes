import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discount } from './entities/discount.entity';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { Product } from '../product/entities/product.entity';
import { Store } from '../store/entities/store.entity';
import { User } from '../user/entities/user.entity';
import { checkStoreAccess } from '../utils/permissions';

@Injectable()
export class DiscountService {
  constructor(
    @InjectRepository(Discount)
    private discountRepository: Repository<Discount>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async create(
    dto: CreateDiscountDto,
    storeId: string,
    user: User,
  ): Promise<Discount> {
    const product = dto.productId
      ? await this.productRepository.findOneBy({ id: dto.productId })
      : null;

    const store = await checkStoreAccess(this.storeRepository, storeId, user);

    const existingDiscount = await this.discountRepository.findOne({
      where: { name: dto.name, store: { id: storeId } },
    });
    if (existingDiscount) {
      throw new ConflictException(
        `Discount with name "${dto.name}" already exists in this store`,
      );
    }

    const discount = this.discountRepository.create({
      discountType: dto.discountType,
      name: dto.name,
      discountValue: dto.discountValue,
      product,
      store,
    });
    return this.discountRepository.save(discount);
  }

  async getDiscountById(id: number, storeId: string): Promise<Discount> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['owner'],
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    const discount = await this.discountRepository.findOne({
      where: { id },
      relations: ['product', 'store'],
    });
    if (!discount) {
      throw new NotFoundException('Discount not found');
    }
    if (discount.store.id !== store.id) {
      throw new ForbiddenException(
        'Discount does not belong to the specified store',
      );
    }
    return discount;
  }

  async findByStore(storeId: string): Promise<Discount[]> {
    return this.discountRepository.find({
      where: { store: { id: storeId } },
      relations: ['product', 'store'],
    });
  }

  async update(
    id: number,
    dto: UpdateDiscountDto,
    storeId: string,
    user: User,
  ): Promise<Discount> {
    const store = await checkStoreAccess(this.storeRepository, storeId, user);

    const discount = await this.discountRepository.findOne({
      where: { id },
      relations: ['store'],
    });
    if (!discount) {
      throw new NotFoundException('Discount not found');
    }
    if (discount.store.id !== store.id) {
      throw new ForbiddenException(
        'Discount does not belong to the specified store',
      );
    }

    if (dto.name && dto.name !== discount.name) {
      const existingDiscount = await this.discountRepository.findOne({
        where: { name: dto.name, store: { id: storeId } },
      });
      if (existingDiscount) {
        throw new ConflictException(
          `Discount with name "${dto.name}" already exists in this store`,
        );
      }
    }

    if (dto.productId !== undefined) {
      discount.product = await this.productRepository.findOneBy({
        id: dto.productId,
      });
    }
    const dtoWithStoreId = dto as UpdateDiscountDto & { storeId?: string };
    if (dtoWithStoreId.storeId !== undefined) {
      const newStore = await this.storeRepository.findOne({
        where: { id: dtoWithStoreId.storeId },
      });
      if (!newStore) {
        throw new NotFoundException('Store not found');
      }
      discount.store = newStore;
    }
    Object.assign(discount, dto);
    return this.discountRepository.save(discount);
  }

  async remove(id: number, storeId: string, user: User): Promise<void> {
    const store = await checkStoreAccess(this.storeRepository, storeId, user);

    const discount = await this.discountRepository.findOne({
      where: { id },
      relations: ['store'],
    });
    if (!discount) {
      throw new NotFoundException('Discount not found');
    }
    if (discount.store.id !== store.id) {
      throw new ForbiddenException(
        'Discount does not belong to the specified store',
      );
    }
    const result = await this.discountRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Discount not found');
    }
  }
}
