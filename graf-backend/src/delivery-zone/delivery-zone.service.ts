import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryZone } from './entities/delivery-zone.entity';
import { CreateDeliveryZoneDto } from './dto/create-delivery-zone.dto';
import { UpdateDeliveryZoneDto } from './dto/update-delivery-zone.dto';
import { Store } from '../store/entities/store.entity';
import { User } from '../user/entities/user.entity';
import { canAccessStore, checkStoreAccess } from '../utils/permissions';

@Injectable()
export class DeliveryZoneService {
  constructor(
    @InjectRepository(DeliveryZone)
    private deliveryZoneRepository: Repository<DeliveryZone>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async create(
    storeId: string,
    user: User,
    createDeliveryZoneDto: CreateDeliveryZoneDto,
  ): Promise<DeliveryZone> {
    const store = await checkStoreAccess(this.storeRepository, storeId, user);

    const deliveryZone = new DeliveryZone();
    Object.assign(deliveryZone, createDeliveryZoneDto);
    deliveryZone.store = store;

    return this.deliveryZoneRepository.save(deliveryZone);
  }

  async findAllByStore(storeId: string): Promise<DeliveryZone[]> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return this.deliveryZoneRepository.find({
      where: { store: { id: storeId } },
    });
  }

  async findOne(id: number): Promise<DeliveryZone> {
    const deliveryZone = await this.deliveryZoneRepository.findOne({
      where: { id },
      relations: ['store'],
    });

    if (!deliveryZone) {
      throw new NotFoundException('Delivery zone not found');
    }

    return deliveryZone;
  }

  async update(
    id: number,
    user: User,
    updateDeliveryZoneDto: UpdateDeliveryZoneDto,
  ): Promise<DeliveryZone> {
    const deliveryZone = await this.deliveryZoneRepository.findOne({
      where: { id },
      relations: ['store', 'store.owner', 'store.employees'],
    });

    if (!deliveryZone) {
      throw new NotFoundException('Delivery zone not found');
    }

    if (!canAccessStore(deliveryZone.store, user)) {
      throw new ForbiddenException(
        'No permission to update this delivery zone',
      );
    }

    Object.assign(deliveryZone, updateDeliveryZoneDto);
    return this.deliveryZoneRepository.save(deliveryZone);
  }

  async remove(id: number, user: User): Promise<void> {
    const deliveryZone = await this.deliveryZoneRepository.findOne({
      where: { id },
      relations: ['store', 'store.owner', 'store.employees'],
    });

    if (!deliveryZone) {
      throw new NotFoundException('Delivery zone not found');
    }

    if (!canAccessStore(deliveryZone.store, user)) {
      throw new ForbiddenException(
        'No permission to delete this delivery zone',
      );
    }

    await this.deliveryZoneRepository.remove(deliveryZone);
  }
}
