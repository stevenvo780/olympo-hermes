import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

/**
 * Mapeo histórico de `payment_link_id` (Wompi) → usuario/tienda/sku.
 *
 * Con Mercado Pago Checkout Pro la conciliación se hace por `externalReference`
 * (`hermes:order:<id>`) en el webhook único del Hub, por lo que ya no se crean
 * filas nuevas en el flujo de pedidos. Se CONSERVA (mismo nombre de tabla
 * `payment_link_mapping`) para no perder el histórico de conciliación.
 */
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
