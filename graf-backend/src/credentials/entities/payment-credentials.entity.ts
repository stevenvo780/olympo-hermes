import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { SharedProp } from '../../common/entities/sharedProp.helper';
import { Store } from '../../store/entities/store.entity';

@Entity()
export class PaymentCredentials extends SharedProp {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Store, (store) => store.paymentCredentials, {
    nullable: false,
  })
  @JoinColumn()
  store: Store;

  @Column({ type: 'varchar' })
  publicKey: string;

  @Column({ type: 'text' })
  privateKeyEncrypted: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
