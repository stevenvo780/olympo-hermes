/**
 * Demo seed for the MULTI-TENANT distribution build. Boots the Nest application
 * context and reuses the real (now auth-scoped) services so seeded data goes
 * through the same logic the API uses. Run with: npm run seed:dist
 *
 * It creates:
 *   - a demo BUSINESS_OWNER user with a known API key (used by the demo
 *     frontends via the x-api-key auth path — no Firebase creds needed),
 *   - store "graf-dist"   -> distribution feature ON  (sellers/zones/orders),
 *   - store "graf-market" -> normal marketplace, feature OFF (regression).
 *
 * Safe for the LOCAL disposable DB only. NEVER point at production.
 */
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { Store } from '../store/entities/store.entity';
import { Product } from '../product/entities/product.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Category } from '../category/entities/category.entity';
import { Config } from '../config/entities/config.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { ConfigService } from '../config/config.service';
import { SellerService } from './seller.service';
import { ZoneService } from './zone.service';
import { DistCustomerService } from './dist-customer.service';
import { DistOrderService } from './dist-order.service';
import { DistOrderStatus } from '../order/entities/order.entity';

const DIST_STORE = process.env.DIST_STORE_ID || 'graf-dist';
const MARKET_STORE = process.env.MARKET_STORE_ID || 'graf-market';
const DEMO_OWNER_ID = 'demo-owner-uid';
const DEMO_OWNER_EMAIL = 'demo@graf.local';
const DEMO_API_KEY = process.env.DEMO_API_KEY || 'graf-dist-demo-key-2026';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const dataSource = app.get(DataSource);
  const storeRepo = app.get<Repository<Store>>(getRepositoryToken(Store));
  const productRepo = app.get<Repository<Product>>(getRepositoryToken(Product));
  const customerRepo = app.get<Repository<Customer>>(
    getRepositoryToken(Customer),
  );
  const categoryRepo = app.get<Repository<Category>>(
    getRepositoryToken(Category),
  );
  const configRepo = app.get<Repository<Config>>(getRepositoryToken(Config));
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const configService = app.get(ConfigService);
  const sellers = app.get(SellerService);
  const zones = app.get(ZoneService);
  const customers = app.get(DistCustomerService);
  const orders = app.get(DistOrderService);

  console.log('Cleaning previous demo data (disposable DB)...');
  await dataSource.query(
    'TRUNCATE TABLE "order_item","order","customer_address","customer","seller","delivery_zone","product","category","config","store","user" RESTART IDENTITY CASCADE',
  );

  console.log('Creating demo owner user (x-api-key auth)...');
  const owner = await userRepo.save(
    userRepo.create({
      id: DEMO_OWNER_ID,
      email: DEMO_OWNER_EMAIL,
      name: 'Demo Owner',
      role: UserRole.BUSINESS_OWNER,
      apiKey: DEMO_API_KEY, // encrypted on insert; guard matches the plaintext
    }),
  );

  // ---------------------------------------------------------------------------
  // Store graf-dist: distribution feature ON
  // ---------------------------------------------------------------------------
  console.log(`Creating store ${DIST_STORE} (distribution ON)...`);
  const distStore = await storeRepo.save(
    storeRepo.create({
      id: DIST_STORE,
      name: 'Distribuidora Palomino (demo)',
      description: 'Tienda demo para distribución multivendedor',
      owner,
    }),
  );
  const distConfig = await configService.createDefaultConfig(distStore);
  distConfig.activations = {
    ...distConfig.activations,
    distributionEnabled: true,
  };
  await configRepo.save(distConfig);

  console.log('Creating products...');
  const productDefs = [
    { title: 'Arroz x 500g', sku: 'ARR-500', basePrice: 2500, stock: 1000 },
    { title: 'Aceite x 1L', sku: 'ACE-1L', basePrice: 9800, stock: 1000 },
    { title: 'Azúcar x 1kg', sku: 'AZU-1K', basePrice: 4200, stock: 1000 },
    { title: 'Café x 500g', sku: 'CAF-500', basePrice: 15600, stock: 1000 },
    { title: 'Atún lata x 170g', sku: 'ATU-170', basePrice: 6300, stock: 1000 },
    { title: 'Pasta x 250g', sku: 'PAS-250', basePrice: 1900, stock: 1000 },
    { title: 'Jabón barra x 300g', sku: 'JAB-300', basePrice: 3500, stock: 1000 },
    { title: 'Detergente x 1kg', sku: 'DET-1K', basePrice: 11200, stock: 1000 },
    // Low stock product to demo the "accept = there is inventory" hook (D3).
    { title: 'Edición limitada x 1u', sku: 'LIM-1U', basePrice: 28000, stock: 5 },
  ];
  const products = await productRepo.save(
    productDefs.map((p) =>
      productRepo.create({
        ...p,
        enabled: true,
        store: { id: DIST_STORE } as Store,
      }),
    ),
  );
  const pid = (sku: string) => products.find((p) => p.sku === sku)!.id;

  console.log('Creating zones (rutas)...');
  const zoneDefs = [
    { zone: 'Medellín Centro', code: 'med-centro', routeGroup: 'Medellín', sortOrder: 1 },
    { zone: 'Medellín Norte', code: 'med-norte', routeGroup: 'Medellín', sortOrder: 2 },
    { zone: 'Medellín Sur', code: 'med-sur', routeGroup: 'Medellín', sortOrder: 3 },
    { zone: 'Oriente', code: 'oriente', routeGroup: 'Oriente', sortOrder: 4 },
    {
      zone: 'Transportadora',
      code: 'transportadora',
      routeGroup: 'Transportadora',
      isCarrier: true,
      sortOrder: 5,
    },
    { zone: 'Bogotá / Fuera', code: 'bogota', routeGroup: 'Fuera de Antioquia', sortOrder: 6 },
  ];
  const createdZones = [];
  for (const z of zoneDefs)
    createdZones.push(await zones.create(DIST_STORE, owner, z));
  const zoneByCode = (code: string) =>
    createdZones.find((z) => z.code === code)!.id;

  console.log('Creating sellers (vendedores)...');
  const sellerDefs = [
    { name: 'Carlos Ruiz', code: 'V01', phone: '+57 300 111 2233' },
    { name: 'Diana Pérez', code: 'V02', phone: '+57 301 222 3344' },
    { name: 'Andrés Gómez', code: 'V03', phone: '+57 302 333 4455' },
  ];
  const createdSellers = [];
  for (const s of sellerDefs)
    createdSellers.push(await sellers.create(DIST_STORE, owner, s));

  console.log('Creating customers + addresses...');
  const customerDefs = [
    { name: 'Tienda La 80', doc: '900111001', zone: 'med-centro', phone: '+57 604 100 1001',
      addresses: [{ label: 'Local principal', address: 'Cra 80 # 30-15', city: 'Medellín', phone: '+57 604 100 1001' }] },
    { name: 'Supermercado El Ahorro', doc: '900111002', zone: 'med-norte', phone: '+57 604 100 1002',
      addresses: [
        { label: 'Sede Bello', address: 'Cl 50 # 52-20', city: 'Bello', phone: '+57 604 100 1002' },
        { label: 'Sede Niquía', address: 'Cra 45 # 70-10', city: 'Bello', phone: '+57 604 100 1099' },
      ] },
    { name: 'Minimercado San José', doc: '900111003', zone: 'med-sur', phone: '+57 604 100 1003',
      addresses: [{ label: 'Local', address: 'Cl 48 Sur # 40-12', city: 'Envigado' }] },
    { name: 'Distribuidora El Trébol', doc: '900111004', zone: 'oriente', phone: '+57 604 100 1004',
      addresses: [
        { label: 'Bodega Rionegro', address: 'Km 2 vía Llanogrande', city: 'Rionegro', phone: '+57 604 100 1004' },
        { label: 'Punto Marinilla', address: 'Cl 30 # 30-30', city: 'Marinilla' },
      ] },
    { name: 'Granero La Esquina', doc: '900111005', zone: 'transportadora', phone: '+57 310 555 6677',
      addresses: [{ label: 'Bodega', address: 'Cra 10 # 5-40', city: 'Manizales', phone: '+57 310 555 6677' }] },
    { name: 'Comercial Andina', doc: '900111006', zone: 'bogota', phone: '+57 601 700 8800',
      addresses: [{ label: 'CD Bogotá', address: 'Cl 13 # 68-30', city: 'Bogotá', phone: '+57 601 700 8800' }] },
    { name: 'Tienda Doña Marta', doc: '900111007', zone: 'med-centro',
      addresses: [{ label: 'Local', address: 'Cra 52 # 44-10', city: 'Medellín' }] },
    { name: 'Autoservicio La Floresta', doc: '900111008', zone: 'med-norte',
      addresses: [{ label: 'Local', address: 'Cl 90 # 65-22', city: 'Medellín' }] },
    { name: 'Surtitodo Itagüí', doc: '900111009', zone: 'med-sur', phone: '+57 604 100 1009',
      addresses: [{ label: 'Local', address: 'Cra 50 # 48-30', city: 'Itagüí', phone: '+57 604 100 1009' }] },
    { name: 'Mayorista del Oriente', doc: '900111010', zone: 'oriente',
      addresses: [{ label: 'Bodega', address: 'Cl 20 # 20-20', city: 'La Ceja' }] },
    { name: 'Provee Express', doc: '900111011', zone: 'transportadora', phone: '+57 311 444 5566',
      addresses: [{ label: 'Recibe transportadora', address: 'Terminal de carga, bodega 12', city: 'Pereira', phone: '+57 311 444 5566' }] },
    { name: 'Almacenes Norte', doc: '900111012', zone: 'bogota', phone: '+57 601 222 1100',
      addresses: [{ label: 'Sede principal', address: 'Av 68 # 40-15', city: 'Bogotá', phone: '+57 601 222 1100' }] },
    { name: 'Tienda El Vecino', doc: '900111013', zone: 'med-centro',
      addresses: [{ label: 'Local', address: 'Cra 43 # 53-12', city: 'Medellín' }] },
    { name: 'Megatienda Sur', doc: '900111014', zone: 'med-sur', phone: '+57 604 100 1014',
      addresses: [
        { label: 'Local Sabaneta', address: 'Cl 70 Sur # 45-10', city: 'Sabaneta', phone: '+57 604 100 1014' },
        { label: 'Local La Estrella', address: 'Cra 60 # 80-05', city: 'La Estrella' },
      ] },
    { name: 'Cliente sin dirección (legado)', doc: '900111015', zone: 'med-centro' },
  ];

  const createdCustomers = [];
  for (const c of customerDefs) {
    if (!c.addresses || c.addresses.length === 0) {
      // Legacy customer loaded WITHOUT addresses (G1): seeded directly,
      // bypassing the G3 "create requires address" rule. Addresses can be
      // added later from the admin/seller.
      createdCustomers.push(
        await customerRepo.save(
          customerRepo.create({
            name: c.name,
            documentNumber: c.doc,
            phone: c.phone,
            deliveryZoneId: zoneByCode(c.zone),
            storeId: DIST_STORE,
            isActive: true,
          }),
        ),
      );
      continue;
    }
    createdCustomers.push(
      await customers.create(DIST_STORE, owner, {
        name: c.name,
        documentNumber: c.doc,
        phone: c.phone,
        deliveryZoneId: zoneByCode(c.zone),
        addresses: c.addresses,
      }),
    );
  }
  const custByDoc = (doc: string) =>
    createdCustomers.find((c) => c.documentNumber === doc)!;

  console.log('Creating orders in different states...');
  const seller = (i: number) => createdSellers[i % createdSellers.length].id;

  const place = async (
    sellerIdx: number,
    doc: string,
    items: { sku: string; quantity: number }[],
    advanceTo?: DistOrderStatus,
    notes?: string,
  ) => {
    const cust = custByDoc(doc);
    const addr = cust.addresses?.[0];
    const order = await orders.create(DIST_STORE, owner, {
      sellerId: seller(sellerIdx),
      customerId: cust.id,
      customerAddressId: addr?.id,
      items: items.map((it) => ({ productId: pid(it.sku), quantity: it.quantity })),
      notes,
    });
    if (advanceTo === DistOrderStatus.ACCEPTED) {
      await orders.transition(order.id, DIST_STORE, owner, {
        to: DistOrderStatus.ACCEPTED,
      });
    } else if (advanceTo === DistOrderStatus.ROUTED) {
      await orders.transition(order.id, DIST_STORE, owner, {
        to: DistOrderStatus.ACCEPTED,
      });
      await orders.transition(order.id, DIST_STORE, owner, {
        to: DistOrderStatus.ROUTED,
        routeDate: '2026-06-15',
      });
    } else if (advanceTo === DistOrderStatus.DISPATCHED) {
      await orders.transition(order.id, DIST_STORE, owner, {
        to: DistOrderStatus.ACCEPTED,
      });
      await orders.transition(order.id, DIST_STORE, owner, {
        to: DistOrderStatus.ROUTED,
        routeDate: '2026-06-13',
      });
      await orders.transition(order.id, DIST_STORE, owner, {
        to: DistOrderStatus.DISPATCHED,
      });
    } else if (advanceTo === DistOrderStatus.CANCELED) {
      await orders.cancel(order.id, DIST_STORE, owner);
    }
    return order;
  };

  await place(0, '900111001', [{ sku: 'ARR-500', quantity: 20 }, { sku: 'ACE-1L', quantity: 6 }]);
  await place(1, '900111002', [{ sku: 'CAF-500', quantity: 10 }], DistOrderStatus.ACCEPTED);
  await place(2, '900111003', [{ sku: 'AZU-1K', quantity: 15 }, { sku: 'PAS-250', quantity: 30 }], DistOrderStatus.ROUTED);
  await place(0, '900111004', [{ sku: 'DET-1K', quantity: 8 }], DistOrderStatus.DISPATCHED);
  await place(1, '900111005', [{ sku: 'ATU-170', quantity: 24 }], DistOrderStatus.ROUTED, 'Pedido por transportadora');
  await place(2, '900111006', [{ sku: 'JAB-300', quantity: 40 }], DistOrderStatus.ACCEPTED);
  await place(0, '900111007', [{ sku: 'ARR-500', quantity: 5 }]);
  await place(1, '900111009', [{ sku: 'ACE-1L', quantity: 12 }, { sku: 'CAF-500', quantity: 4 }], DistOrderStatus.CANCELED);
  await place(2, '900111011', [{ sku: 'PAS-250', quantity: 50 }], DistOrderStatus.ACCEPTED, 'Recoge transportadora');
  await place(0, '900111014', [{ sku: 'AZU-1K', quantity: 10 }, { sku: 'DET-1K', quantity: 3 }]);
  await place(1, '900111012', [{ sku: 'ATU-170', quantity: 18 }], DistOrderStatus.ROUTED);
  // Queued order that needs more than available -> "Aceptar" shows the
  // inventory block (D3). Left in queue on purpose for the demo.
  await place(0, '900111008', [{ sku: 'LIM-1U', quantity: 12 }], undefined, 'Stock insuficiente: demo inventario');

  const distCount = await orders.findAll(DIST_STORE, owner, {});

  // ---------------------------------------------------------------------------
  // Store graf-market: normal marketplace, distribution feature OFF
  // (regression: behaves exactly like any other tenant).
  // ---------------------------------------------------------------------------
  console.log(`Creating store ${MARKET_STORE} (marketplace, feature OFF)...`);
  const marketStore = await storeRepo.save(
    storeRepo.create({
      id: MARKET_STORE,
      name: 'Marketplace Demo',
      description: 'Tienda marketplace normal (feature distribución OFF)',
      owner,
    }),
  );
  await configService.createDefaultConfig(marketStore); // no distributionEnabled

  const marketCategory = await categoryRepo.save(
    categoryRepo.create({
      name: 'Despensa',
      description: 'Productos de despensa',
      position: 0,
      store: { id: MARKET_STORE } as Store,
    }),
  );
  const marketProducts = [
    { title: 'Granola artesanal', sku: 'GRA-1', basePrice: 18900, stock: 50 },
    { title: 'Miel pura x 500g', sku: 'MIE-1', basePrice: 24500, stock: 30 },
    { title: 'Café de origen x 340g', sku: 'COR-1', basePrice: 32000, stock: 40 },
    { title: 'Chocolate 70% x 100g', sku: 'CHO-1', basePrice: 12000, stock: 60 },
  ];
  await productRepo.save(
    marketProducts.map((p) =>
      productRepo.create({
        ...p,
        enabled: true,
        store: { id: MARKET_STORE } as Store,
        categories: [marketCategory],
      }),
    ),
  );

  console.log('\nSeed complete:');
  console.log(`  owner user:   ${DEMO_OWNER_ID} (${DEMO_OWNER_EMAIL})`);
  console.log(`  demo api key: ${DEMO_API_KEY}`);
  console.log(`  ${DIST_STORE}: distribution ON  -> orders: ${distCount.length}`);
  console.log(`    products: ${products.length}, zones: ${createdZones.length}, sellers: ${createdSellers.length}, customers: ${createdCustomers.length}`);
  console.log(`  ${MARKET_STORE}: marketplace OFF -> products: ${marketProducts.length}, category: ${marketCategory.name}`);

  await app.close();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
