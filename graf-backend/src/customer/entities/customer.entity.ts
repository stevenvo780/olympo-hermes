import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Store } from '../../store/entities/store.entity';
import { User } from '../../user/entities/user.entity';
import { Order } from '../../order/entities/order.entity';
import { CustomerAddress } from '../../distribution/entities/customer-address.entity';
import { DeliveryZone } from '../../delivery-zone/entities/delivery-zone.entity';

@Entity()
@Index(['email', 'storeId'])
export class Customer {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    description: 'ID único del cliente',
    example: 1,
  })
  id: number;

  @Column()
  @ApiProperty({
    description: 'Nombre del cliente',
    example: 'Juan Pérez',
  })
  name: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Email del cliente',
    example: 'juan@example.com',
    required: false,
  })
  email?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Teléfono del cliente',
    example: '+57 300 123 4567',
    required: false,
  })
  phone?: string;

  @Column({ nullable: true, name: 'documentnumber' })
  @ApiProperty({
    description: 'Número de documento del cliente',
    example: '1234567890',
    required: false,
  })
  documentNumber?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Dirección del cliente',
    example: 'Calle 123 #45-67',
    required: false,
  })
  address?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Ciudad del cliente',
    example: 'Bogotá',
    required: false,
  })
  city?: string;

  @Column({ nullable: true, name: 'postalcode' })
  @ApiProperty({
    description: 'Código postal del cliente',
    example: '110111',
    required: false,
  })
  postalCode?: string;

  @Column({ nullable: true, name: 'birthdate', type: 'date' })
  @ApiProperty({
    description: 'Fecha de nacimiento del cliente',
    example: '1990-01-01',
    required: false,
  })
  birthDate?: Date;

  @Column({ name: 'loyaltypoints', default: 0 })
  @ApiProperty({
    description: 'Puntos de lealtad del cliente',
    example: 100,
    default: 0,
  })
  loyaltyPoints: number;

  @Column({ name: 'isactive', default: true })
  @ApiProperty({
    description: 'Estado activo del cliente',
    example: true,
    default: true,
  })
  isActive: boolean;

  @Column({ nullable: true, type: 'text' })
  @ApiProperty({
    description: 'Notas adicionales sobre el cliente',
    example: 'Cliente preferencial',
    required: false,
  })
  notes?: string;

  @Column({
    name: 'totalspent',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  @ApiProperty({
    description: 'Total gastado por el cliente',
    example: 150000.5,
    default: 0,
  })
  totalSpent: number;

  @Column({ name: 'totalorders', default: 0 })
  @ApiProperty({
    description: 'Total de órdenes realizadas por el cliente',
    example: 5,
    default: 0,
  })
  totalOrders: number;

  @Column({ nullable: true, name: 'userid' })
  @ApiProperty({
    description: 'ID del usuario asociado (si existe)',
    example: 'user-123',
    required: false,
  })
  userId?: string;

  @Column({ name: 'storeid' })
  @ApiProperty({
    description: 'ID de la tienda a la que pertenece el cliente',
    example: 'store-123',
  })
  storeId: string;

  @ManyToOne(() => Store, (store) => store.customers, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'storeid' })
  @ApiProperty({
    description: 'Tienda a la que pertenece el cliente',
    type: () => Store,
  })
  store: Store;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userid' })
  @ApiProperty({
    description: 'Usuario asociado al cliente (si existe)',
    type: () => User,
    required: false,
  })
  user?: User;

  @OneToMany(() => Order, (order) => order.customer)
  @ApiProperty({
    description: 'Órdenes realizadas por el cliente',
    type: () => [Order],
  })
  orders: Order[];

  // --- Distribution fields ---

  @OneToMany(() => CustomerAddress, (address) => address.customer, {
    cascade: true,
  })
  @ApiProperty({
    description: 'Direcciones / sedes del cliente',
    type: () => [CustomerAddress],
  })
  addresses: CustomerAddress[];

  @Column({ nullable: true, name: 'deliveryzoneid', type: 'int' })
  @ApiProperty({
    description: 'Zona/ruta asignada al cliente (heredada por el pedido)',
    required: false,
  })
  deliveryZoneId?: number;

  @ManyToOne(() => DeliveryZone, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'deliveryzoneid' })
  @ApiProperty({ type: () => DeliveryZone, required: false })
  zone?: DeliveryZone;

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({
    description: 'Fecha de creación del cliente',
  })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({
    description: 'Fecha de última actualización del cliente',
  })
  updatedAt: Date;
}
