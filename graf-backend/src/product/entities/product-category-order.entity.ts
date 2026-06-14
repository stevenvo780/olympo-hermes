import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';
import { Category } from '@/category/entities/category.entity';

@Entity()
@Unique(['product', 'category'])
@Index(['category', 'orderInCategory'])
export class ProductCategoryOrder {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    description: 'Identificador único del registro',
    example: 1,
  })
  id: number;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn()
  @Index()
  product: Product;

  @ManyToOne(() => Category, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn()
  @Index()
  category: Category;

  @Column({ default: 0 })
  @ApiProperty({
    description: 'Orden del producto dentro de esta categoría específica',
    example: 1,
  })
  orderInCategory: number;
}
