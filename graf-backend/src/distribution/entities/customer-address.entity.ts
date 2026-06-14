import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SharedProp } from '../../common/entities/sharedProp.helper';
import { Customer } from '../../customer/entities/customer.entity';

/**
 * A customer site/branch (sede). A customer can have several addresses; the
 * seller picks one from a dropdown when placing an order to avoid mistyping a
 * destination (a wrong delivery is expensive).
 */
@Entity()
export class CustomerAddress extends SharedProp {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column({ name: 'customerid' })
  @ApiProperty({ description: 'Cliente dueño de la dirección' })
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.addresses, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerid' })
  customer: Customer;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Etiqueta de la sede', example: 'Sede principal' })
  label: string;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Dirección', example: 'Cra 50 # 10-20' })
  address: string;

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({ required: false, example: 'Medellín' })
  city?: string;

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({ required: false, example: '+57 300 123 4567' })
  phone?: string;

  @Column({ type: 'varchar', nullable: true, name: 'contactname' })
  @ApiProperty({ required: false, example: 'Ana Gómez' })
  contactName?: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ required: false })
  notes?: string;

  @Column({ name: 'isdefault', default: false })
  @ApiProperty({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  @ApiProperty({ default: true })
  active: boolean;
}
