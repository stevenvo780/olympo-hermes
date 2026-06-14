import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Store } from '../store/entities/store.entity';
import { User, UserRole } from '../user/entities/user.entity';

export function isStoreOwner(store: Store, user: User): boolean {
  if (user.role === UserRole.SUPER_ADMIN) {
    return true;
  }
  return store.owner?.id === user.id;
}

export function canAccessStore(store: Store, user: User): boolean {
  if (user.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  if (store.owner?.id === user.id) {
    return true;
  }

  if (store.employees) {
    return store.employees.some((employee) => employee.id === user.id);
  }

  return false;
}

/**
 * Helper function to check store access with automatic store lookup
 * This replaces the common pattern of store lookup + access check that appears in many services
 * NOTE: Ideally, this kind of access control logic should be in controllers or guards
 * rather than services, but this function helps with the current implementation
 *
 * @param storeRepository Repository to use for looking up the store
 * @param storeId ID of the store to check access for
 * @param user User attempting to access the store
 * @param accessType Type of access to check: 'read' allows all store users, 'write' requires owner for some operations
 * @returns The store object if access is granted
 * @throws NotFoundException if store not found, ForbiddenException if access denied
 */
export enum StoreAccessType {
  OWNER = 'owner',
  TEAM = 'team',
}

export async function checkStoreAccess(
  storeRepository: Repository<Store>,
  storeId: string,
  user: User,
  accessType: StoreAccessType = StoreAccessType.TEAM,
): Promise<Store> {
  const store = await storeRepository.findOne({
    where: { id: storeId },
    relations: ['owner', 'employees'],
  });

  if (!store) {
    throw new NotFoundException('Store not found');
  }

  if (accessType === StoreAccessType.OWNER && !isStoreOwner(store, user)) {
    throw new ForbiddenException(
      'No permission to perform this operation for this store',
    );
  } else if (!canAccessStore(store, user)) {
    throw new ForbiddenException('No permission to access this store');
  }

  return store;
}
