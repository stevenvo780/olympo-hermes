import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SharedProp } from '../../common/entities/sharedProp.helper';
import { Store } from '../../store/entities/store.entity';

/**
 * Seller (vendedor). Every distribution order is attributed to the seller that
 * created it, so the office can tell whose order each one is.
 */
@Entity()
@Index(['code', 'storeId'])
export class Seller extends SharedProp {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Nombre del vendedor', example: 'Carlos Ruiz' })
  name: string;

  @Column({ type: 'varchar' })
  @ApiProperty({ description: 'Código interno del vendedor', example: 'V01' })
  code: string;

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({ required: false, example: '+57 300 111 2233' })
  phone?: string;

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({ required: false, example: 'carlos@distribuidora.com' })
  email?: string;

  @Column({ default: true })
  @ApiProperty({ default: true })
  active: boolean;

  @Column({ name: 'storeid' })
  @ApiProperty({ description: 'Tienda a la que pertenece el vendedor' })
  storeId: string;

  @ManyToOne(() => Store, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeid' })
  store: Store;
}
