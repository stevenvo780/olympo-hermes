import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  Column,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';
import { Store } from '../../store/entities/store.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { OrderItem } from './order-item.entity';
import { SharedProp } from '../../common/entities/sharedProp.helper';
import { DeliveryZone } from '../../delivery-zone/entities/delivery-zone.entity';
import { Tax } from '../../tax/entities/tax.entity';
import { ShippingAddress } from 'src/profile/entities/profile.entity';
import { Seller } from '../../distribution/entities/seller.entity';
import { CustomerAddress } from '../../distribution/entities/customer-address.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELED = 'canceled',
}

/**
 * Distribution order state machine:
 * en cola -> aceptado -> enrutado -> despachado, plus cancel (anular).
 */
export enum DistOrderStatus {
  QUEUED = 'queued',
  ACCEPTED = 'accepted',
  ROUTED = 'routed',
  DISPATCHED = 'dispatched',
  CANCELED = 'canceled',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  WOMPI = 'wompi',
  BOLD = 'bold',
  CREDIT = 'credit',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export interface AmountOrder {
  discountTotal: number;
  taxTotal: number;
  delivery: number;
  total: number;
}

@Entity()
export class Order extends SharedProp {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Customer, (customer) => customer.orders, { nullable: true })
  @JoinColumn({ name: 'customerid' })
  customer: Customer;

  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @ApiProperty({ enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.CASH })
  paymentMethod: PaymentMethod;

  @Column({ type: 'int', nullable: true })
  @ApiProperty({ required: false, description: 'Días de crédito si aplica' })
  creditDays?: number | null;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ required: false, description: 'Notas del pedido' })
  notes?: string | null;

  @Column({
    type: 'json',
    default: {
      discountTotal: 0,
      taxTotal: 0,
      delivery: 0,
      total: 0,
    },
  })
  @ApiProperty({ description: 'Monto total de la orden' })
  amount: AmountOrder;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: 'Dirección de envío opcional' })
  shippingAddress?: ShippingAddress;

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({
    description: 'Nombre del comprador',
    example: 'Juan Pérez',
    required: false,
  })
  buyerName?: string;

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({
    description: 'Teléfono del comprador',
    example: '+57 300 123 4567',
    required: false,
  })
  buyerPhone?: string;

  @Column('json', { default: [] })
  @ApiProperty({
    description:
      'Respuestas a las preguntas personalizadas de la configuración de la tienda',
    example: [
      {
        question: '¿Cuál es su requerimiento?',
        answer: 'Necesito envío urgente',
      },
    ],
  })
  customAnswers: { question: string; answer: string }[];

  @ManyToOne(() => DeliveryZone, { nullable: true })
  @JoinColumn({ name: 'deliveryZoneId' })
  deliveryZone?: DeliveryZone;

  // --- Distribution fields ---

  @Column({ type: 'int', nullable: true, name: 'sellerId' })
  @ApiProperty({ required: false, description: 'Vendedor que montó el pedido' })
  sellerId?: number;

  @ManyToOne(() => Seller, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sellerId' })
  @ApiProperty({ type: () => Seller, required: false })
  seller?: Seller;

  @Column({ type: 'int', nullable: true, name: 'customerAddressId' })
  @ApiProperty({ required: false, description: 'Sede de entrega elegida' })
  customerAddressId?: number;

  @ManyToOne(() => CustomerAddress, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerAddressId' })
  @ApiProperty({ type: () => CustomerAddress, required: false })
  customerAddress?: CustomerAddress;

  @Column({
    type: 'enum',
    enum: DistOrderStatus,
    nullable: true,
    name: 'distStatus',
  })
  @ApiProperty({ enum: DistOrderStatus, required: false })
  distStatus?: DistOrderStatus;

  @Column({ type: 'date', nullable: true, name: 'routeDate' })
  @ApiProperty({
    required: false,
    description: 'Día asignado para la ruta/despacho',
  })
  routeDate?: string | null;

  @ManyToMany(() => Tax, { nullable: true })
  @JoinTable({
    name: 'order_taxes',
    joinColumn: { name: 'order_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tax_id', referencedColumnName: 'id' },
  })
  @ApiProperty({
    description: 'Impuestos aplicados a la orden',
    type: () => [Tax],
    required: false,
  })
  taxes?: Tax[];

  @Column('json', { nullable: true, default: [] })
  @ApiProperty({
    description: 'URLs de documentos adjuntos a la orden',
    example: ['https://storage.firebase.com/order-doc-1.pdf'],
    required: false,
  })
  documents?: string[];

  @Column({
    type: 'enum',
    enum: DiscountType,
    nullable: true,
  })
  @ApiProperty({
    enum: DiscountType,
    required: false,
    description: 'Tipo de descuento aplicado',
  })
  discountType?: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @ApiProperty({
    required: false,
    description: 'Valor del descuento (porcentaje o cantidad fija)',
  })
  discountValue?: number;
}
