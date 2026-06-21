import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { SharedProp } from 'src/common/entities/sharedProp.helper';
import { PlanType } from '../../user/entities/subscription.entity';

/**
 * Histórico de fuentes de pago de suscripción SaaS.
 *
 * Antes ligado a Wompi (tokenización de tarjeta). Con Mercado Pago la
 * recurrencia es nativa (PreApproval: MP recobra solo), por lo que esta entidad
 * deja de crear cobros; se CONSERVA tal cual (mismo nombre de tabla
 * `payment_source`) como registro histórico y para `subscription.lastPaymentSource`.
 */
export enum PaymentFrequency {
  MONTHLY = 'MONTHLY',
  ANNUALLY = 'ANNUALLY',
}

@Entity()
export class PaymentSource extends SharedProp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sourceId: string;

  @Column({ default: true })
  active: boolean;

  @Column({
    type: 'enum',
    enum: PaymentFrequency,
    default: PaymentFrequency.MONTHLY,
  })
  frequency: PaymentFrequency;

  @Column({ type: 'timestamp', nullable: true })
  nextCharge: Date;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  planType: PlanType;

  @ManyToOne(() => User, (user) => user.paymentSources)
  user: User;
}
