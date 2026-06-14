import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Store } from '../../store/entities/store.entity';

@Entity()
export class Tax {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @Column()
  @Index()
  @ApiProperty({ description: 'Tax name' })
  name: string;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  @ApiProperty({ description: 'Tax rate (percentage)' })
  rate: number;

  @ManyToOne(() => Store, { nullable: false })
  @JoinColumn()
  store: Store;
}
