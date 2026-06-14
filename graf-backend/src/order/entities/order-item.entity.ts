import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from './order.entity';
import { numericTransformer } from '@/common/transformers/numeric.transformer';

export interface ProductSnapshot {
  id: number;
  title: string;
  description?: string;
  basePrice: number;
  sku: string;
  images?: string[];
  stock?: number | null;
  enabled?: boolean;
  taxes?: Array<{
    id: number;
    name: string;
    percentage: number;
  }>;
  discounts?: Array<{
    id: number;
    name: string;
    type: string;
    value: number;
  }>;
  categories?: Array<{
    id: number;
    name: string;
  }>;
}

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @Column('json')
  @ApiProperty({
    description: 'Instantánea del producto al momento de la compra',
    type: 'object',
  })
  product: ProductSnapshot;

  @Column('int')
  @ApiProperty({ description: 'Cantidad de productos pedidos' })
  quantity: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  @ApiProperty({ description: 'Precio unitario del producto' })
  unitPrice: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  @ApiProperty({ description: 'Precio final incluyendo variaciones' })
  finalPrice: number;
}
