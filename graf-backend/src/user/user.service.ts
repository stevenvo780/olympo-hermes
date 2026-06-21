import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { FindUsersDto } from './dto/find-users.dto';
import { UpdateIntegrationsDto } from './dto/update-integrations.dto';
import { Subscription, PlanType } from './entities/subscription.entity';
import { PaymentSource } from 'src/wompi/entities/payment-source.entity';
import admin from '../utils/firebase-admin.config';
import { EncryptionService } from '../utils/encryption.service';
import axios from 'axios';

@Injectable()
export class UserService {
  private encryptionService = new EncryptionService();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async create(createUserDto: Partial<User>): Promise<User> {
    const user = await this.userRepository.save(createUserDto);
    const subscription = new Subscription();
    subscription.user = user;
    subscription.planType = PlanType.FREE;
    subscription.startDate = new Date();
    user.subscription = subscription;
    await this.userRepository.save(user);
    return user;
  }

  async confirmSubscription(
    planType: PlanType,
    customerId: string,
    paymentSource: PaymentSource,
  ): Promise<Subscription> {
    const user = await this.userRepository.findOne({
      where: { id: customerId },
      relations: ['subscription'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const subscriptionPlanType = planType as PlanType;

    if (user.subscription) {
      user.subscription.planType = subscriptionPlanType;
      user.subscription.startDate = new Date();
      user.subscription.lastPaymentSource = paymentSource;
    } else {
      const subscription = new Subscription();
      subscription.user = user;
      subscription.planType = subscriptionPlanType;
      subscription.startDate = new Date();
      subscription.lastPaymentSource = paymentSource;
      user.subscription = subscription;
    }

    if (user.role === UserRole.CUSTOMER) {
      user.role = UserRole.BUSINESS_OWNER;
    }

    const saveUser = await this.userRepository.save(user);
    return saveUser.subscription;
  }

  async findAll(
    findUsersDto?: FindUsersDto,
  ): Promise<{ users: User[]; total: number }> {
    if (!findUsersDto) {
      const users = await this.userRepository.find();
      return { users, total: users.length };
    }

    const {
      limit = 10,
      offset = 0,
      search,
      minPoints,
      maxPoints,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = findUsersDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (search) {
      queryBuilder.where(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    if (minPoints !== undefined) {
      queryBuilder.andWhere('user.points >= :minPoints', { minPoints });
    }

    if (maxPoints !== undefined) {
      queryBuilder.andWhere('user.points <= :maxPoints', { maxPoints });
    }

    const [users, total] = await queryBuilder
      .orderBy(`user.${sortBy}`, sortOrder as 'ASC' | 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { users, total };
  }

  findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  updateRole(id: string, role: User['role']): Promise<UpdateResult> {
    return this.userRepository.update(id, { role });
  }

  async getUserDetails(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile', 'subscription'],
    });
    if (user && !user.subscription && user.role === UserRole.BUSINESS_OWNER) {
      const subscription = new Subscription();
      subscription.user = user;
      subscription.planType = PlanType.FREE;
      subscription.startDate = new Date();
      user.subscription = subscription;
      await this.userRepository.save(user);
    }
    if (user?.subscription) {
      delete user.subscription.user;
    }
    return user;
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    if (updateData.email) {
      throw new ConflictException(
        'Email updates must use the specific /me/email endpoint',
      );
    }

    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async updateEmail(userId: string, newEmail: string): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: newEmail },
    });
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Email already in use');
    }

    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await admin.auth().updateUser(userId, {
        email: newEmail,
      });

      await queryRunner.manager.update(User, userId, { email: newEmail });

      await queryRunner.commitTransaction();

      return this.findOne(userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.code && error.code.startsWith('auth/')) {
        throw new ConflictException(`Firebase Auth error: ${error.message}`);
      }

      throw new BadRequestException(
        `Failed to update email: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async cancelUserSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { user: { id: userId } },
    });
    if (subscription) {
      subscription.planType = PlanType.FREE;
      subscription.endDate = subscription.endDate || new Date();
      await this.subscriptionRepository.save(subscription);
    }
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['subscription'],
    });
    if (user) {
      return user.subscription;
    }
    throw new NotFoundException('Error al cancelar la suscripción del usuario');
  }

  async generateApiKey(userId: string): Promise<{ apiKey: string }> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newApiKey = this.encryptionService.generateApiKey();
    user.apiKey = newApiKey;
    await this.userRepository.save(user);

    return { apiKey: newApiKey };
  }

  async regenerateApiKey(userId: string): Promise<{ apiKey: string }> {
    return this.generateApiKey(userId);
  }

  async getUserSafeData(userId: string): Promise<Partial<User>> {
    const user = await this.getUserDetails(userId);
    return user ? user.toSafeJSON() : null;
  }

  async updateIntegrations(
    userId: string,
    updateIntegrationsDto: UpdateIntegrationsDto,
  ): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateIntegrationsDto.sigo) {
      if (updateIntegrationsDto.sigo.apiKey) {
        user.sigoApiKey = updateIntegrationsDto.sigo.apiKey;
      }
      if (updateIntegrationsDto.sigo.email) {
        user.sigoEmail = updateIntegrationsDto.sigo.email;
      }
      if (updateIntegrationsDto.sigo.password) {
        user.sigoPassword = updateIntegrationsDto.sigo.password;
      }
      if (updateIntegrationsDto.sigo.apiUrl) {
        user.sigoApiUrl = updateIntegrationsDto.sigo.apiUrl;
      }
    }

    const updatedUser = await this.userRepository.save(user);

    await this.syncCredentialsWithNous(updatedUser);

    return updatedUser;
  }

  async getIntegrationStatus(userId: string): Promise<{
    hasSigoCredentials: boolean;
    sigoApiUrl?: string;
  }> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      hasSigoCredentials: user.hasSigoCredentials(),
      sigoApiUrl: user.sigoApiUrl,
    };
  }

  private async syncCredentialsWithNous(user: User): Promise<void> {
    try {
      const nousUrl =
        process.env.HUB_CENTRAL_URL || 'http://localhost:3002';
      const nousSecret = process.env.HUB_CENTRAL_SECRET;

      if (!nousSecret) {
        console.error(
          `❌ Missing HUB_CENTRAL_SECRET. Cannot sync credentials with Nous.`,
        );
        return;
      }

      if (user.hasSigoCredentials()) {
        const sigoCredentials = user.getSigoCredentials();
        const sigoData = {
          enabled: true,
          config: {
            email: sigoCredentials.email,
            apiKey: sigoCredentials.apiKey,
            apiUrl: sigoCredentials.apiUrl,
          },
        };

        await axios.put(
          `${nousUrl}/api/v1/plugins/plugins/logos/credentials`,
          sigoData,
          {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
              'x-user-email': user.email,
              'x-api-key': nousSecret,
            },
          },
        );
      }
    } catch (error) {
      console.error(
        `❌ Failed to sync credentials with Nous for user ${user.email}:`,
        error.message,
        error.response?.data || '',
      );
    }
  }

  async getIntegrationCredentials(userId: string): Promise<{
    sigo?: {
      apiKey?: string;
      email?: string;
      password?: string;
      apiUrl?: string;
    };
  }> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      sigo: user.hasSigoCredentials() ? user.getSigoCredentials() : undefined,
    };
  }

  async findUserForCredentialsSync(email: string): Promise<{
    hermesUserId: string;
    sigo?: {
      apiKey?: string;
      username?: string;
      password?: string;
      apiUrl?: string;
    };
  } | null> {
    const user = await this.findOneByEmail(email);
    if (!user) {
      return null;
    }

    return {
      hermesUserId: user.id,
      sigo: user.hasSigoCredentials() ? user.getSigoCredentials() : undefined,
    };
  }
}
