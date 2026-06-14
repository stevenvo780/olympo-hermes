import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Product } from '../../product/entities/product.entity';
import { Tax } from '../../tax/entities/tax.entity';
import { Order } from '../../order/entities/order.entity';
import { Discount } from '../../discount/entities/discount.entity';
import { Category } from '../../category/entities/category.entity';
import { Config } from '../../config/entities/config.entity';
import { DeliveryZone } from '../../delivery-zone/entities/delivery-zone.entity';
import { PaymentCredentials } from '../../credentials/entities/payment-credentials.entity';
import { Customer } from '../../customer/entities/customer.entity';

@Entity()
export class Store {
  @PrimaryColumn({ unique: true })
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => User, (user) => user.stores)
  owner: User;

  @OneToMany(() => Product, (product) => product.store, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  products: Product[];

  @OneToMany(() => Tax, (tax) => tax.store, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  taxes: Tax[];

  @OneToMany(() => Order, (order) => order.store, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  orders: Order[];

  @OneToMany(() => Discount, (discount) => discount.store, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  discounts: Discount[];

  @OneToMany(() => Category, (category) => category.store, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  categories: Category[];

  @OneToMany(() => DeliveryZone, (deliveryZone) => deliveryZone.store, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  deliveryZones: DeliveryZone[];

  @OneToMany(() => Customer, (customer) => customer.store, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  customers: Customer[];

  @ManyToMany(() => User, {
    cascade: true,
  })
  @JoinTable({
    name: 'store_employees',
    joinColumn: { name: 'store_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  employees: User[];

  @OneToOne(() => Config, (config) => config.store, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  configuration: Config;

  @Column({ nullable: true })
  phonePrefix: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @OneToOne(() => PaymentCredentials, (cred) => cred.store, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  paymentCredentials: PaymentCredentials;
}
