import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '../user/entities/user.entity';
import { Store } from '../store/entities/store.entity';
import {
  isStoreOwner,
  canAccessStore,
  checkStoreAccess,
  StoreAccessType,
} from './permissions';

describe('Permissions Utils', () => {
  const adminUser = { id: 'admin', role: UserRole.SUPER_ADMIN } as User;
  const ownerUser = { id: 'owner', role: UserRole.BUSINESS_OWNER } as User;
  const employeeUser = {
    id: 'employee',
    role: UserRole.BUSINESS_OWNER,
  } as User;
  const strangerUser = { id: 'stranger', role: UserRole.CUSTOMER } as User;

  const store = {
    id: 'store-1',
    owner: ownerUser,
    employees: [employeeUser],
  } as Store;

  describe('isStoreOwner', () => {
    it('should return true for super admin', () => {
      expect(isStoreOwner(store, adminUser)).toBe(true);
    });

    it('should return true for owner', () => {
      expect(isStoreOwner(store, ownerUser)).toBe(true);
    });

    it('should return false for employee', () => {
      expect(isStoreOwner(store, employeeUser)).toBe(false);
    });

    it('should return false for stranger', () => {
      expect(isStoreOwner(store, strangerUser)).toBe(false);
    });
  });

  describe('canAccessStore', () => {
    it('should return true for super admin', () => {
      expect(canAccessStore(store, adminUser)).toBe(true);
    });

    it('should return true for owner', () => {
      expect(canAccessStore(store, ownerUser)).toBe(true);
    });

    it('should return true for employee', () => {
      expect(canAccessStore(store, employeeUser)).toBe(true);
    });

    it('should return false for stranger', () => {
      expect(canAccessStore(store, strangerUser)).toBe(false);
    });

    it('should return false if employees is undefined and not owner', () => {
      const storeNoEmp = { ...store, employees: undefined };
      expect(canAccessStore(storeNoEmp, strangerUser)).toBe(false);
    });
  });

  describe('checkStoreAccess', () => {
    const mockRepo = {
      findOne: jest.fn(),
    } as any;

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return store if access granted (team)', async () => {
      mockRepo.findOne.mockResolvedValue(store);
      const result = await checkStoreAccess(mockRepo, 'store-1', employeeUser);
      expect(result).toBe(store);
    });

    it('should return store if access granted (owner)', async () => {
      mockRepo.findOne.mockResolvedValue(store);
      const result = await checkStoreAccess(
        mockRepo,
        'store-1',
        ownerUser,
        StoreAccessType.OWNER,
      );
      expect(result).toBe(store);
    });

    it('should throw NotFoundException if store not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(
        checkStoreAccess(mockRepo, 'store-1', ownerUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if access denied (team)', async () => {
      mockRepo.findOne.mockResolvedValue(store);
      await expect(
        checkStoreAccess(mockRepo, 'store-1', strangerUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if not owner (owner access req)', async () => {
      mockRepo.findOne.mockResolvedValue(store);
      await expect(
        checkStoreAccess(
          mockRepo,
          'store-1',
          employeeUser,
          StoreAccessType.OWNER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
