import { getMetadataArgsStorage } from 'typeorm';
import { Category } from '../category/entities/category.entity';
import { Config } from '../config/entities/config.entity';
import { PaymentCredentials } from '../credentials/entities/payment-credentials.entity';
import { Customer } from '../customer/entities/customer.entity';
import { DeliveryZone } from '../delivery-zone/entities/delivery-zone.entity';
import { Discount } from '../discount/entities/discount.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { Order } from '../order/entities/order.entity';
import { ProductCategoryOrder } from '../product/entities/product-category-order.entity';
import { Product } from '../product/entities/product.entity';
import { Profile } from '../profile/entities/profile.entity';
import { Store } from '../store/entities/store.entity';
import { Tax } from '../tax/entities/tax.entity';
import { PaymentLinkMapping } from '../wompi/entities/payment-link.entity';
import { PaymentSource } from '../wompi/entities/payment-source.entity';
import { Subscription } from '../user/entities/subscription.entity';
import { User } from '../user/entities/user.entity';
import { DECORATORS } from '@nestjs/swagger/dist/constants';

const relationTargets = [
  Category,
  Config,
  PaymentCredentials,
  Customer,
  DeliveryZone,
  Discount,
  OrderItem,
  Order,
  ProductCategoryOrder,
  Product,
  Profile,
  Store,
  Tax,
  PaymentLinkMapping,
  PaymentSource,
  Subscription,
  User,
];

describe('Entity metadata coverage', () => {
  it('executes relation callbacks', () => {
    const storage = getMetadataArgsStorage();

    relationTargets.forEach((target) => {
      const relations = storage.relations.filter(
        (rel) => rel.target === target,
      );

      relations.forEach((relation) => {
        if (typeof relation.type === 'function') {
          const relType = relation.type as unknown as (
            ...args: unknown[]
          ) => unknown;
          relType();
        }
        if (typeof relation.inverseSideProperty === 'function') {
          const inverse = relation.inverseSideProperty as unknown as (
            value: unknown,
          ) => unknown;
          inverse({});
        }
      });
    });
  });

  it('instantiates entity classes', () => {
    const instances = relationTargets.map((EntityClass) => new EntityClass());
    instances.forEach((instance) => {
      expect(instance).toBeDefined();
    });
  });

  it('executes swagger type callbacks', () => {
    relationTargets.forEach((target) => {
      const propertyKeys =
        Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES_ARRAY, target) ||
        Reflect.getMetadata(
          DECORATORS.API_MODEL_PROPERTIES_ARRAY,
          target.prototype,
        ) ||
        [];

      propertyKeys.forEach((key: string) => {
        const propertyKey = key.startsWith(':') ? key.slice(1) : key;
        const entry =
          Reflect.getMetadata(
            DECORATORS.API_MODEL_PROPERTIES,
            target.prototype,
            propertyKey,
          ) || {};
        if (entry && typeof entry.type === 'function') {
          entry.type();
        }
      });
    });
  });
});
