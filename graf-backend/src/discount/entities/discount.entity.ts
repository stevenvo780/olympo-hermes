import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../product/entities/product.entity';
import { Store } from '../../store/entities/store.entity';

export enum DiscountType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

@Entity()
export class Discount {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @Column()
  @Index()
  @ApiProperty({ description: 'Discount name' })
  name: string;

  @Column({
    type: 'enum',
    enum: DiscountType,
    default: DiscountType.PERCENTAGE,
  })
  @ApiProperty({
    description: 'Discount type (fixed or percentage)',
    enum: DiscountType,
  })
  discountType: DiscountType;

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty({ description: 'Discount value' })
  discountValue: number;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn()
  product: Product;

  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn()
  store: Store;
}
