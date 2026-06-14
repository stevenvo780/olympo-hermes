import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { UpdateStoreDto } from './dto/update-store.dto';
import { User } from 'src/user/entities/user.entity';
import { Product } from 'src/product/entities/product.entity';
import { Category } from 'src/category/entities/category.entity';
import { Tax } from 'src/tax/entities/tax.entity';
import { Order } from 'src/order/entities/order.entity';
import { Discount } from 'src/discount/entities/discount.entity';
import { Config } from 'src/config/entities/config.entity';
import {
  isStoreOwner,
  checkStoreAccess,
  StoreAccessType,
} from 'src/utils/permissions';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createStoreFromPayment(storeId: string, owner: User): Promise<Store> {
    const newStore = this.storeRepository.create({
      id: storeId,
      name: `${storeId}`,
      description: 'Aqui tu descripcion de la tienda',
      phonePrefix: '+57',
      phoneNumber: '0000000000',
      owner,
    });
    return this.storeRepository.save(newStore);
  }

  findAll(): Promise<Store[]> {
    return this.storeRepository.find({
      relations: ['configuration', 'owner', 'owner.subscription'],
    });
  }

  findOne(id: string): Promise<Store> {
    return this.storeRepository.findOne({
      where: { id },
      relations: [
        'configuration',
        'owner',
        'owner.subscription',
        'deliveryZones',
        'employees',
      ],
    });
  }

  async update(
    id: string,
    updateStoreDto: UpdateStoreDto,
    user: User,
  ): Promise<Store> {
    const store = await checkStoreAccess(
      this.storeRepository,
      id,
      user,
      StoreAccessType.OWNER,
    );

    Object.assign(store, updateStoreDto);
    return this.storeRepository.save(store);
  }

  async remove(id: string, user: User): Promise<void> {
    const store = await this.storeRepository.findOne({
      where: { id },
      relations: [
        'owner',
        'employees',
        'products',
        'taxes',
        'orders',
        'discounts',
        'categories',
        'configuration',
      ],
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    if (!isStoreOwner(store, user)) {
      throw new ForbiddenException('No permission to delete this store');
    }

    await this.storeRepository.manager
      .getRepository(Config)
      .delete({ store: { id: store.id } });

    await this.storeRepository.manager
      .getRepository(Product)
      .delete({ store: { id: store.id } });
    await this.storeRepository.manager
      .getRepository(Category)
      .delete({ store: { id: store.id } });
    await this.storeRepository.manager
      .getRepository(Tax)
      .delete({ store: { id: store.id } });
    await this.storeRepository.manager
      .getRepository(Order)
      .delete({ store: { id: store.id } });
    await this.storeRepository.manager
      .getRepository(Discount)
      .delete({ store: { id: store.id } });

    await this.storeRepository.remove(store);
  }

  async findStoresForUser(userId: string): Promise<Store[]> {
    return this.storeRepository
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.configuration', 'configuration')
      .leftJoinAndSelect('store.owner', 'owner')
      .leftJoinAndSelect('owner.subscription', 'subscription')
      .leftJoinAndSelect('store.employees', 'employee')
      .where('store.ownerId = :userId', { userId })
      .orWhere('employee.id = :userId', { userId })
      .getMany();
  }

  async addTeamMember(
    storeId: string,
    email: string,
    currentUser: User,
  ): Promise<Store> {
    const store = await checkStoreAccess(
      this.storeRepository,
      storeId,
      currentUser,
      StoreAccessType.OWNER,
    );

    const teamMember = await this.userRepository.findOne({
      where: { email: email },
    });
    if (!teamMember) {
      throw new NotFoundException('User not found');
    }
    if (store.employees && store.employees.some((emp) => emp.email === email)) {
      return store;
    }
    if (!store.employees) {
      store.employees = [];
    }
    store.employees.push(teamMember);
    return this.storeRepository.save(store);
  }

  async removeTeamMember(
    storeId: string,
    teamMemberId: string,
    currentUser: User,
  ): Promise<Store> {
    const store = await checkStoreAccess(
      this.storeRepository,
      storeId,
      currentUser,
      StoreAccessType.OWNER,
    );

    if (!store.employees) {
      return store;
    }

    store.employees = store.employees.filter((emp) => emp.id !== teamMemberId);
    return this.storeRepository.save(store);
  }

  async getTeamMembers(storeId: string, currentUser: User): Promise<User[]> {
    const store = await checkStoreAccess(
      this.storeRepository,
      storeId,
      currentUser,
      StoreAccessType.OWNER,
    );

    return store.employees || [];
  }
}
