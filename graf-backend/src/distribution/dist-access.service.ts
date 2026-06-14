import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../store/entities/store.entity';
import { User } from '../user/entities/user.entity';
import { canAccessStore } from '../utils/permissions';

/**
 * Central guard for the distribution feature. Every distribution service call
 * resolves its tenant through here:
 *   1. storeId must be provided (no hardcoded default in request paths).
 *   2. the authenticated user must own / belong to that store.
 *   3. the store must have the distribution feature ENABLED
 *      (Config.activations.distributionEnabled === true).
 *
 * This keeps the feature multi-tenant and OFF-by-default: a regular marketplace
 * tenant without the flag is rejected at the backend even if endpoints are hit
 * directly, so its behaviour stays identical to before.
 */
@Injectable()
export class DistAccessService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
  ) {}

  async assertAccess(storeId: string | undefined, user: User): Promise<Store> {
    if (!storeId) {
      throw new BadRequestException('storeId es requerido');
    }
    const store = await this.storeRepo.findOne({
      where: { id: storeId },
      relations: ['owner', 'employees', 'configuration'],
    });
    if (!store) {
      throw new NotFoundException('Tienda no encontrada');
    }
    if (!canAccessStore(store, user)) {
      throw new ForbiddenException('No tiene permisos sobre esta tienda');
    }
    if (store.configuration?.activations?.distributionEnabled !== true) {
      throw new ForbiddenException(
        'La distribución no está activada para esta tienda',
      );
    }
    return store;
  }
}
