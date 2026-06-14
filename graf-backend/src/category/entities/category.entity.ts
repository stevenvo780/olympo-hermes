import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from '@/product/entities/product.entity';
import { Store } from '../../store/entities/store.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier of the category' })
  id: number;

  @Column()
  @Index()
  @ApiProperty({ description: 'Category name' })
  name: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Optional description of the category' })
  description?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'URL de la imagen de la categoría',
    required: false,
  })
  imageUrl?: string;

  @Column({ default: 0 })
  @ApiProperty({
    description: 'Posición de la categoría para ordenamiento',
    default: 0,
  })
  position: number;

  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn()
  store: Store;

  @ManyToMany(() => Product, (product) => product.categories, {
    nullable: true,
  })
  products?: Product[];

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent?: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children?: Category[];
}
