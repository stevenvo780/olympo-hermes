import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryZone } from '../delivery-zone/entities/delivery-zone.entity';
import { CreateZoneDto, UpdateZoneDto } from './dto/zone.dto';
import { DistAccessService } from './dist-access.service';
import { User } from '../user/entities/user.entity';

/**
 * Zones (rutas) are configurable/extensible: the office can add new ones
 * (e.g. Cali norte/sur) without code changes. Each zone belongs to a store.
 */
@Injectable()
export class ZoneService {
  constructor(
    @InjectRepository(DeliveryZone)
    private readonly zoneRepo: Repository<DeliveryZone>,
    private readonly access: DistAccessService,
  ) {}

  async findAll(storeId: string, user: User): Promise<DeliveryZone[]> {
    await this.access.assertAccess(storeId, user);
    return this.zoneRepo.find({
      where: { store: { id: storeId } },
      order: { sortOrder: 'ASC', zone: 'ASC' },
    });
  }

  async findOne(
    id: number,
    storeId: string,
    user: User,
  ): Promise<DeliveryZone> {
    await this.access.assertAccess(storeId, user);
    const zone = await this.zoneRepo.findOne({
      where: { id, store: { id: storeId } },
    });
    if (!zone) throw new NotFoundException('Zona no encontrada');
    return zone;
  }

  async create(
    storeId: string,
    user: User,
    dto: CreateZoneDto,
  ): Promise<DeliveryZone> {
    const store = await this.access.assertAccess(storeId, user);
    const zone = this.zoneRepo.create({
      zone: dto.zone,
      code: dto.code,
      routeGroup: dto.routeGroup,
      isCarrier: dto.isCarrier ?? false,
      price: dto.price ?? 0,
      estimatedTime: dto.estimatedTime,
      sortOrder: dto.sortOrder ?? 0,
      active: true,
      store,
    });
    return this.zoneRepo.save(zone);
  }

  async update(
    id: number,
    storeId: string,
    user: User,
    dto: UpdateZoneDto,
  ): Promise<DeliveryZone> {
    const zone = await this.findOne(id, storeId, user);
    Object.assign(zone, dto);
    return this.zoneRepo.save(zone);
  }

  async remove(id: number, storeId: string, user: User): Promise<void> {
    const zone = await this.findOne(id, storeId, user);
    await this.zoneRepo.remove(zone);
  }
}
