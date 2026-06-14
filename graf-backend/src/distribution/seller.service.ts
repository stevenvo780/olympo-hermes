import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller } from './entities/seller.entity';
import { CreateSellerDto, UpdateSellerDto } from './dto/seller.dto';
import { DistAccessService } from './dist-access.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class SellerService {
  constructor(
    @InjectRepository(Seller)
    private readonly sellerRepo: Repository<Seller>,
    private readonly access: DistAccessService,
  ) {}

  async findAll(storeId: string, user: User): Promise<Seller[]> {
    await this.access.assertAccess(storeId, user);
    return this.sellerRepo.find({
      where: { storeId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number, storeId: string, user: User): Promise<Seller> {
    await this.access.assertAccess(storeId, user);
    const seller = await this.sellerRepo.findOne({ where: { id, storeId } });
    if (!seller) throw new NotFoundException('Vendedor no encontrado');
    return seller;
  }

  async create(
    storeId: string,
    user: User,
    dto: CreateSellerDto,
  ): Promise<Seller> {
    await this.access.assertAccess(storeId, user);
    const seller = this.sellerRepo.create({
      name: dto.name,
      code: dto.code,
      phone: dto.phone,
      email: dto.email,
      active: true,
      storeId,
    });
    return this.sellerRepo.save(seller);
  }

  async update(
    id: number,
    storeId: string,
    user: User,
    dto: UpdateSellerDto,
  ): Promise<Seller> {
    const seller = await this.findOne(id, storeId, user);
    Object.assign(seller, dto);
    return this.sellerRepo.save(seller);
  }

  async remove(id: number, storeId: string, user: User): Promise<void> {
    const seller = await this.findOne(id, storeId, user);
    await this.sellerRepo.remove(seller);
  }
}
