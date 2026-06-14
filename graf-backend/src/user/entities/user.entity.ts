import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { SharedProp } from '../../common/entities/sharedProp.helper';
import { Profile } from '../../profile/entities/profile.entity';
import { Store } from '../../store/entities/store.entity';
import { Subscription } from './subscription.entity';
import { PaymentLinkMapping } from '../../wompi/entities/payment-link.entity';
import { PaymentSource } from '../../wompi/entities/payment-source.entity';
import { EncryptionService } from '../../utils/encryption.service';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  BUSINESS_OWNER = 'business_owner',
  CUSTOMER = 'customer',
}

@Entity()
export class User extends SharedProp {
  @PrimaryColumn()
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 'abc123',
  })
  id: string;

  @Column({ unique: true })
  @ApiProperty({
    description: 'Unique email address of the user',
    example: 'user@example.com',
  })
  email: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    nullable: true,
  })
  name?: string;

  @Column({ nullable: true, name: 'documentnumber' })
  @ApiProperty({
    description: 'Document number of the user',
    example: '1234567890',
    nullable: true,
  })
  documentNumber?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role_enum',
    default: UserRole.CUSTOMER,
  })
  @ApiProperty({
    description: 'Role of the user in the system',
    enum: UserRole,
    example: UserRole.CUSTOMER,
  })
  role: UserRole;

  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: true,
    nullable: true,
  })
  profile?: Profile;

  @OneToOne(() => Subscription, (subscription) => subscription.user, {
    cascade: true,
    nullable: true,
  })
  subscription?: Subscription;

  @OneToMany(() => Store, (store) => store.owner)
  stores: Store[];

  @OneToMany(
    () => PaymentLinkMapping,
    (paymentLinkMapping) => paymentLinkMapping.user,
  )
  paymentLinkMappings: PaymentLinkMapping[];

  @OneToMany(() => PaymentSource, (paymentSource) => paymentSource.user)
  paymentSources: PaymentSource[];

  @Column({ type: 'text', nullable: true })
  @ApiHideProperty()
  @Exclude()
  apiKey: string;

  @Column({ type: 'text', nullable: true })
  @ApiHideProperty()
  @Exclude()
  sigoApiKey: string;

  @Column({ type: 'text', nullable: true, name: 'sigoUsername' })
  @ApiHideProperty()
  @Exclude()
  sigoEmail: string;

  @Column({ type: 'text', nullable: true })
  @ApiHideProperty()
  @Exclude()
  sigoPassword: string;

  @Column({ type: 'varchar', nullable: true, default: 'https://api.siigo.com' })
  sigoApiUrl: string;

  @Column({ type: 'text', nullable: true })
  @ApiHideProperty()
  @Exclude()
  hubspotAccessToken: string;

  @Column({ type: 'text', nullable: true })
  @ApiHideProperty()
  @Exclude()
  hubspotApiKey: string;

  @Column({
    type: 'varchar',
    nullable: true,
    default: 'https://api.hubapi.com',
  })
  hubspotApiUrl: string;

  @BeforeInsert()
  @BeforeUpdate()
  encryptCredentials() {
    const encryptionService = new EncryptionService();

    if (this.apiKey && !this.apiKey.includes(':')) {
      this.apiKey = encryptionService.encrypt(this.apiKey);
    }

    if (this.sigoApiKey && !this.sigoApiKey.includes(':')) {
      this.sigoApiKey = encryptionService.encrypt(this.sigoApiKey);
    }
    if (this.sigoEmail && !this.sigoEmail.includes(':')) {
      this.sigoEmail = encryptionService.encrypt(this.sigoEmail);
    }
    if (this.sigoPassword && !this.sigoPassword.includes(':')) {
      this.sigoPassword = encryptionService.encrypt(this.sigoPassword);
    }

    if (this.hubspotAccessToken && !this.hubspotAccessToken.includes(':')) {
      this.hubspotAccessToken = encryptionService.encrypt(
        this.hubspotAccessToken,
      );
    }
    if (this.hubspotApiKey && !this.hubspotApiKey.includes(':')) {
      this.hubspotApiKey = encryptionService.encrypt(this.hubspotApiKey);
    }
  }

  encryptApiKey() {
    this.encryptCredentials();
  }

  getDecryptedApiKey(): string {
    if (!this.apiKey) return null;
    try {
      const encryptionService = new EncryptionService();
      return encryptionService.decrypt(this.apiKey);
    } catch (error) {
      console.error('Error decrypting API key:', error);
      return null;
    }
  }

  getSigoCredentials(): {
    apiKey?: string;
    email?: string;
    password?: string;
    apiUrl?: string;
  } {
    try {
      const encryptionService = new EncryptionService();
      return {
        apiKey: this.sigoApiKey
          ? encryptionService.decrypt(this.sigoApiKey)
          : undefined,
        email: this.sigoEmail
          ? encryptionService.decrypt(this.sigoEmail)
          : undefined,
        password: this.sigoPassword
          ? encryptionService.decrypt(this.sigoPassword)
          : undefined,
        apiUrl: this.sigoApiUrl || 'https://api.siigo.com',
      };
    } catch (error) {
      console.error('Error decrypting SIGO credentials:', error);
      return {};
    }
  }

  getHubSpotCredentials(): {
    accessToken?: string;
    apiKey?: string;
    apiUrl?: string;
  } {
    try {
      const encryptionService = new EncryptionService();
      return {
        accessToken: this.hubspotAccessToken
          ? encryptionService.decrypt(this.hubspotAccessToken)
          : undefined,
        apiKey: this.hubspotApiKey
          ? encryptionService.decrypt(this.hubspotApiKey)
          : undefined,
        apiUrl: this.hubspotApiUrl || 'https://api.hubapi.com',
      };
    } catch (error) {
      console.error('Error decrypting HubSpot credentials:', error);
      return {};
    }
  }

  hasSigoCredentials(): boolean {
    return !!(this.sigoApiKey && this.sigoEmail);
  }

  hasHubSpotCredentials(): boolean {
    return !!(this.hubspotAccessToken || this.hubspotApiKey);
  }

  toSafeJSON(): Record<string, unknown> {
    const safeData: Record<string, unknown> = {
      ...(this as unknown as Record<string, unknown>),
    };

    delete safeData.apiKey;
    delete safeData.sigoApiKey;
    delete safeData.sigoEmail;
    delete safeData.sigoPassword;
    delete safeData.hubspotAccessToken;
    delete safeData.hubspotApiKey;

    return {
      ...safeData,
      hasSigoCredentials: this.hasSigoCredentials(),
      hasHubSpotCredentials: this.hasHubSpotCredentials(),
    };
  }
}
