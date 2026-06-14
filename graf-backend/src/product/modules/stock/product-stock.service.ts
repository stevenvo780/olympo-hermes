import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { Store } from '@/store/entities/store.entity';
import { User } from '@/user/entities/user.entity';
import { checkStoreAccess } from '@/utils/permissions';

@Injectable()
export class ProductStockService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async updateStock(
    productId: number,
    storeId: string,
    newStock: number,
    source: string,
    metadata?: Record<string, unknown>,
  ): Promise<{
    productId: number;
    productName: string;
    previousStock: number | null;
    newStock: number | null;
    source: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }> {
    const product = await this.productRepository.findOne({
      where: { id: productId, store: { id: storeId } },
      relations: ['store'],
    });

    if (!product) {
      throw new NotFoundException(
        `Producto ${productId} no encontrado en tienda ${storeId}`,
      );
    }

    const previousStock = product.stock;
    product.stock = newStock;

    const updatedProduct = await this.productRepository.save(product);

    return {
      productId,
      productName: product.title,
      previousStock,
      newStock: updatedProduct.stock,
      source,
      timestamp: new Date().toISOString(),
      metadata,
    };
  }

  async getStock(productId: number, storeId: string): Promise<number> {
    const product = await this.productRepository.findOne({
      where: { id: productId, enabled: true, store: { id: storeId } },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product.stock || 0;
  }

  async getLowStockProducts(
    storeId: string,
    threshold: number = 10,
  ): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.store', 'store')
      .leftJoinAndSelect('product.categories', 'category')
      .where('product.storeId = :storeId', { storeId })
      .andWhere('product.enabled = true')
      .andWhere('product.stock IS NOT NULL')
      .andWhere('product.stock <= :threshold', { threshold })
      .orderBy('product.stock', 'ASC')
      .getMany();
  }

  async decrementStock(
    productId: number,
    storeId: string,
    decrementBy: number,
    source: string,
    metadata?: Record<string, unknown>,
  ): Promise<{
    productId: number;
    productName: string;
    previousStock: number | null;
    newStock: number | null;
    decrementedBy: number;
    source: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }> {
    const product = await this.productRepository.findOne({
      where: { id: productId, store: { id: storeId } },
      relations: ['store'],
    });

    if (!product) {
      throw new NotFoundException(
        `Producto ${productId} no encontrado en tienda ${storeId}`,
      );
    }

    if (product.stock !== null && product.stock < decrementBy) {
      throw new ConflictException(
        `Stock insuficiente. Stock actual: ${product.stock}, intentando decrementar: ${decrementBy}`,
      );
    }

    const previousStock = product.stock;

    if (product.stock !== null) {
      product.stock = Math.max(0, product.stock - decrementBy);
    }

    const updatedProduct = await this.productRepository.save(product);

    return {
      productId,
      productName: product.title,
      previousStock,
      newStock: updatedProduct.stock,
      decrementedBy: decrementBy,
      source,
      timestamp: new Date().toISOString(),
      metadata,
    };
  }

  async incrementStock(
    productId: number,
    storeId: string,
    incrementBy: number,
    source: string,
    metadata?: Record<string, unknown>,
  ): Promise<{
    productId: number;
    productName: string;
    previousStock: number | null;
    newStock: number | null;
    incrementedBy: number;
    source: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }> {
    const product = await this.productRepository.findOne({
      where: { id: productId, store: { id: storeId } },
      relations: ['store'],
    });

    if (!product) {
      throw new NotFoundException(
        `Producto ${productId} no encontrado en tienda ${storeId}`,
      );
    }

    const previousStock = product.stock;

    if (product.stock !== null) {
      product.stock = product.stock + incrementBy;
    } else {
      product.stock = incrementBy;
    }

    const updatedProduct = await this.productRepository.save(product);

    return {
      productId,
      productName: product.title,
      previousStock,
      newStock: updatedProduct.stock,
      incrementedBy: incrementBy,
      source,
      timestamp: new Date().toISOString(),
      metadata,
    };
  }

  async generateStockReport(
    storeId: string,
    user: User,
  ): Promise<{
    totalProducts: number;
    totalStock: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    topProducts: Array<{
      id: number;
      title: string;
      sku: string;
      stock: number;
      value: number;
    }>;
  }> {
    await checkStoreAccess(this.storeRepository, storeId, user);

    const products = await this.productRepository.find({
      where: {
        store: { id: storeId },
        enabled: true,
      },
    });

    const totalProducts = products.length;
    const totalStock = products.reduce(
      (sum, product) => sum + (product.stock || 0),
      0,
    );
    const lowStockProducts = products.filter(
      (product) => (product.stock || 0) <= 10,
    ).length;
    const outOfStockProducts = products.filter(
      (product) => (product.stock || 0) === 0,
    ).length;

    const topProducts = products
      .map((product) => ({
        id: product.id,
        title: product.title,
        sku: product.sku,
        stock: product.stock || 0,
        value: (product.stock || 0) * product.basePrice,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      totalProducts,
      totalStock,
      lowStockProducts,
      outOfStockProducts,
      topProducts,
    };
  }
}
