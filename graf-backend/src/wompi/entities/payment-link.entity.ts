import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class PaymentLinkMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  paymentLinkId: string;

  @ManyToOne(() => User, (user) => user.paymentLinkMappings, {
    eager: true,
    nullable: true,
  })
  user: User | null;

  @Column()
  sku: string;

  @Column({ default: 'store' })
  storeId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
