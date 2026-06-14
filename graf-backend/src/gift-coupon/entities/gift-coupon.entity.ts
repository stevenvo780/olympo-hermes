import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class GiftCoupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column({ default: false })
  used: boolean;
}
