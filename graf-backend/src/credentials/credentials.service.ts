import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentCredentials } from './entities/payment-credentials.entity';
import { User } from '../user/entities/user.entity';
import { CreateCredentialsDto } from './dto/create-credentials.dto';
import { UpdateCredentialsDto } from './dto/update-credentials.dto';
import { encrypt, decrypt } from '../utils/encrypt';
import { Store } from 'src/store/entities/store.entity';
import { checkStoreAccess } from 'src/utils/permissions';

@Injectable()
export class CredentialsService {
  constructor(
    @InjectRepository(PaymentCredentials)
    private readonly repo: Repository<PaymentCredentials>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async setCredentials(
    storeId: string,
    user: User,
    dto: CreateCredentialsDto,
  ): Promise<PaymentCredentials> {
    const store = await checkStoreAccess(this.storeRepository, storeId, user);
    const secret = process.env.CREDENTIALS_SECRET;
    const encrypted = encrypt(dto.privateKey, secret);
    let creds = await this.repo.findOne({ where: { store: { id: storeId } } });
    if (!creds) creds = this.repo.create({ store });
    creds.publicKey = dto.publicKey;
    creds.privateKeyEncrypted = encrypted;
    return this.repo.save(creds);
  }

  async getCredentials(
    storeId: string,
    user: User,
  ): Promise<{ publicKey: string; privateKey: string }> {
    await checkStoreAccess(this.storeRepository, storeId, user);
    const creds = await this.repo.findOne({
      where: { store: { id: storeId } },
    });
    if (!creds) {
      throw new NotFoundException('Credentials not found');
    }
    const secret = process.env.CREDENTIALS_SECRET;
    return {
      publicKey: creds.publicKey,
      privateKey: decrypt(creds.privateKeyEncrypted, secret),
    };
  }

  async updateCredentials(
    storeId: string,
    user: User,
    dto: UpdateCredentialsDto,
  ): Promise<PaymentCredentials> {
    await checkStoreAccess(this.storeRepository, storeId, user);
    const creds = await this.repo.findOne({
      where: { store: { id: storeId } },
    });
    if (!creds) throw new NotFoundException('Credentials not found');
    if (dto.publicKey) creds.publicKey = dto.publicKey;
    if (dto.privateKey) {
      const secret = process.env.CREDENTIALS_SECRET;
      creds.privateKeyEncrypted = encrypt(dto.privateKey, secret);
    }
    return this.repo.save(creds);
  }
}
