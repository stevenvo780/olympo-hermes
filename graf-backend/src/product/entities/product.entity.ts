import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SharedProp } from '@/common/entities/sharedProp.helper';
import { Discount } from '@/discount/entities/discount.entity';
import { Category } from '@/category/entities/category.entity';
import { Tax } from '@/tax/entities/tax.entity';

import { Store } from '../../store/entities/store.entity';

@Entity()
export class Product extends SharedProp {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    description: 'Identificador único del producto',
    example: 1,
  })
  id: number;

  @Column()
  @ApiProperty({
    description: 'Título del producto',
    example: 'Pack de Emojis Anime',
  })
  title: string;

  @Column('text', { nullable: true })
  @ApiProperty({
    description: 'Descripción del producto (opcional)',
    example: 'Colección de emojis anime para tu servidor',
    required: false,
  })
  description?: string;

  @Column('text', { nullable: true })
  @ApiProperty({
    description:
      'Descripción larga del producto (opcional, puede ser HTML o texto plano)',
    example: '<p>Descripción detallada con formato HTML</p>',
    required: false,
  })
  longDescription?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty({
    description: 'Precio base del producto',
    example: 20.0,
  })
  basePrice: number;

  @Column('int', { nullable: true })
  @ApiProperty({
    description: 'Stock disponible (null significa infinito)',
    example: 150,
  })
  stock: number | null;

  @Column('json', { nullable: true })
  @ApiProperty({
    description: 'Galería de imágenes (URLs como array JSON)',
    example: '["https://example.com/img1.jpg", "https://example.com/img2.jpg"]',
  })
  images?: string[];

  @ManyToMany(() => Tax, { nullable: true })
  @JoinTable()
  taxes?: Tax[];

  @ManyToMany(() => Discount, { nullable: true })
  @JoinTable()
  discounts?: Discount[];

  @ManyToMany(() => Category, (category) => category.products, {
    nullable: true,
  })
  @JoinTable()
  categories?: Category[];

  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn()
  @Index()
  store: Store;

  @ManyToOne(() => Product, (product) => product.children, { nullable: true })
  parent?: Product;

  @OneToMany(() => Product, (product) => product.parent)
  children?: Product[];

  @Column()
  @ApiProperty({
    description: 'SKU del producto - Identificador único entre sistemas',
    example: 'SKU-123456',
  })
  sku: string;

  @Column({ default: true })
  @ApiProperty({
    description: 'Indica si el producto está habilitado',
    example: true,
  })
  enabled: boolean;
}
