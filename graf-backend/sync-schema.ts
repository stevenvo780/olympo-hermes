import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { Profile } from './src/profile/entities/profile.entity';
import { User } from './src/user/entities/user.entity';
import { Store } from './src/store/entities/store.entity';
import { Product } from './src/product/entities/product.entity';
import { Category } from './src/category/entities/category.entity';
import { Order } from './src/order/entities/order.entity';
import { OrderItem } from './src/order/entities/order-item.entity';
import { Config } from './src/config/entities/config.entity';
import { Discount } from './src/discount/entities/discount.entity';
import { Tax } from './src/tax/entities/tax.entity';
import { DeliveryZone } from './src/delivery-zone/entities/delivery-zone.entity';
import { PaymentLinkMapping } from './src/wompi/entities/payment-link.entity';
import { PaymentSource } from './src/wompi/entities/payment-source.entity';
import { PaymentCredentials } from './src/credentials/entities/payment-credentials.entity';
import { Customer } from './src/customer/entities/customer.entity';
import { Subscription } from './src/user/entities/subscription.entity';
import { Seller } from './src/distribution/entities/seller.entity';
import { CustomerAddress } from './src/distribution/entities/customer-address.entity';
import { GiftCoupon } from './src/gift-coupon/entities/gift-coupon.entity';
import { ProductCategoryOrder } from './src/product/entities/product-category-order.entity';

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '5432');
const username = process.env.DB_USERNAME || 'prizma';
const password = process.env.DB_PASSWORD || 'prizma';
const database = process.env.DB_NAME || 'hermes';
const sslEnabled = process.env.DB_SSL !== 'false' && host !== 'localhost' && host !== 'postgres';

console.log(`Connecting to ${host}:${port}/${database} as ${username} (ssl=${sslEnabled})`);

const entities = [
  Profile,
  User,
  Store,
  Product,
  Category,
  Order,
  OrderItem,
  Config,
  Discount,
  Tax,
  DeliveryZone,
  PaymentLinkMapping,
  PaymentSource,
  PaymentCredentials,
  Customer,
  Subscription,
  Seller,
  CustomerAddress,
  GiftCoupon,
  ProductCategoryOrder,
];

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities,
    synchronize: true,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    logging: false,
  });

  console.log('Synchronizing schema...');
  await ds.initialize();
  console.log('Schema synchronized successfully.');
  await ds.destroy();

  // Count tables
  const checkDs = new DataSource({
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities: [],
    synchronize: false,
    migrations: [],
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    logging: false,
  });
  await checkDs.initialize();
  const result = await checkDs.query(
    "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"
  );
  const tableCount = parseInt(result[0].count);
  console.log(`Tables in public schema: ${tableCount}`);
  await checkDs.destroy();
}

main().catch(err => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
