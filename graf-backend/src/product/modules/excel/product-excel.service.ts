import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { Store } from '@/store/entities/store.entity';
import { Tax } from '@/tax/entities/tax.entity';
import { Discount } from '@/discount/entities/discount.entity';
import { Category } from '@/category/entities/category.entity';
import { User } from '@/user/entities/user.entity';
import { ImportExcelDto } from '../../dto/import-excel.dto';
import { checkStoreAccess } from '@/utils/permissions';
import { SortOrder } from '@/user/dto/find-users.dto';

@Injectable()
export class ProductExcelService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(Tax)
    private readonly taxRepository: Repository<Tax>,
    @InjectRepository(Discount)
    private readonly discountRepository: Repository<Discount>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private async releaseStaleLocksForStore(storeId: string): Promise<void> {
    try {
      const staleLocks = await this.dataSource.query(`
        SELECT 
          pid,
          state,
          EXTRACT(EPOCH FROM (now() - query_start)) AS duration_seconds,
          LEFT(query, 200) AS query_preview
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND state IN ('idle in transaction', 'active')
          AND EXTRACT(EPOCH FROM (now() - query_start)) > 300
          AND query ILIKE '%product%'
          AND pid != pg_backend_pid()
        ORDER BY duration_seconds DESC
      `);

      if (staleLocks.length > 0) {
        console.warn(
          `⚠️  [DEADLOCK PREVENTION] Detectadas ${staleLocks.length} transacciones colgadas en tienda ${storeId}:`,
        );

        for (const lock of staleLocks) {
          console.warn(
            `   - PID ${lock.pid}: ${lock.state} por ${Math.round(
              lock.duration_seconds,
            )}s`,
          );
          console.warn(`     Query: ${lock.query_preview}`);

          try {
            await this.dataSource.query(`SELECT pg_terminate_backend($1)`, [
              lock.pid,
            ]);
            console.warn(`   ✅ Lock PID ${lock.pid} terminado`);
          } catch (terminateError) {
            console.error(
              `   ❌ Error terminando PID ${lock.pid}:`,
              terminateError,
            );
          }
        }
      }
    } catch (error) {
      console.error('⚠️  Error detectando locks colgados:', error);
    }
  }

  async getLookupData(storeId: string) {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    const [categories, taxes, discounts] = await Promise.all([
      this.categoryRepository.find({
        where: { store },
        select: ['id', 'name'],
        order: { name: SortOrder.ASC },
      }),
      this.taxRepository.find({
        where: { store },
        select: ['id', 'name'],
        order: { name: SortOrder.ASC },
      }),
      this.discountRepository.find({
        where: { store },
        select: ['id', 'name'],
        order: { name: SortOrder.ASC },
      }),
    ]);
    return { categories, taxes, discounts };
  }

  async getAllProductsForExport(storeId: string): Promise<Product[]> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const allProducts = await this.productRepository.find({
      where: { store: { id: storeId }, enabled: true },
      relations: ['parent', 'taxes', 'discounts', 'categories'],
      order: { id: SortOrder.ASC },
    });

    const productMap = new Map<number, Product>();
    allProducts.forEach((p) => productMap.set(p.id, p));

    const addProductWithChildren = (
      product: Product,
      result: Product[],
      visited: Set<number>,
    ) => {
      if (visited.has(product.id)) return;

      visited.add(product.id);
      result.push(product);

      const children = allProducts.filter(
        (p) => p.parent?.id === product.id && p.id !== product.id,
      );
      children.sort((a, b) => a.id - b.id);

      children.forEach((child) => {
        addProductWithChildren(child, result, visited);
      });
    };

    const orderedProducts: Product[] = [];
    const visited = new Set<number>();

    const rootProducts = allProducts.filter((p) => !p.parent);
    rootProducts.sort((a, b) => a.id - b.id);

    rootProducts.forEach((root) => {
      addProductWithChildren(root, orderedProducts, visited);
    });

    allProducts.forEach((product) => {
      if (!visited.has(product.id)) {
        orderedProducts.push(product);
      }
    });

    return orderedProducts;
  }

  async importExcel(
    dto: ImportExcelDto,
    storeId: string,
    user: User,
  ): Promise<{
    created: number;
    updated: number;
    deleted: number;
    skipped: number;
    failed: number;
    results: { sku: string; status: string; message: string; title?: string }[];
  }> {
    await this.releaseStaleLocksForStore(storeId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.query("SET LOCAL statement_timeout = '120s'");
    await queryRunner.query("SET LOCAL lock_timeout = '30s'");

    await queryRunner.startTransaction();

    try {
      await checkStoreAccess(this.storeRepository, storeId, user);

      const store = await queryRunner.manager.findOne(Store, {
        where: { id: storeId },
      });
      if (!store) throw new NotFoundException('Store not found');

      const summary = {
        created: 0,
        updated: 0,
        deleted: 0,
        skipped: 0,
        failed: 0,
      };
      const results: {
        sku: string;
        status: string;
        message: string;
        title?: string;
      }[] = [];

      const rows = dto.rows || [];
      const incomingSkus = new Set<string>();

      for (const row of rows) {
        const sku = (row.sku || '').toString().trim();
        if (!sku) {
          results.push({
            sku: 'N/A',
            status: 'failed',
            message: 'SKU vacío o inválido',
          });
          summary.failed++;
          continue;
        }
        incomingSkus.add(sku.toLowerCase());

        try {
          const existing = await queryRunner.manager.findOne(Product, {
            where: { sku, store: { id: storeId } },
            relations: ['categories', 'taxes', 'discounts', 'parent'],
          });

          const action = (row.action as string) || 'update';
          if (action === 'delete') {
            if (existing) {
              existing.enabled = false;
              await queryRunner.manager.save(Product, existing);
              results.push({
                sku,
                title: existing.title,
                status: 'deleted',
                message: 'Producto deshabilitado por acción delete',
              });
              summary.deleted++;
            } else {
              results.push({
                sku,
                status: 'skipped',
                message: 'Producto no existe para eliminar',
              });
              summary.skipped++;
            }
            continue;
          }

          if (existing) {
            if (row.title !== undefined)
              existing.title = String(row.title ?? '').trim() || existing.title;
            if (row.description !== undefined)
              existing.description = String(row.description ?? '').trim() || '';
            if (row.longDescription !== undefined)
              existing.longDescription =
                String(row.longDescription ?? '').trim() || '';
            if (row.basePrice !== undefined) {
              existing.basePrice = Number(row.basePrice) || 0;
            }
            if (row.stock !== undefined) {
              const rawStock = row.stock;
              const isEmpty =
                rawStock === null ||
                rawStock === undefined ||
                String(rawStock) === '';
              existing.stock = isEmpty ? null : Number(rawStock) || 0;
            }
            if (row.enabled !== undefined)
              existing.enabled = Boolean(row.enabled);
            if (Array.isArray(row.images))
              existing.images = row.images as string[];

            if (row.parentSku) {
              const parentSku = String(row.parentSku).trim();
              if (parentSku && parentSku !== sku) {
                const parent = await queryRunner.manager.findOne(Product, {
                  where: { sku: parentSku, store: { id: storeId } },
                });
                existing.parent = parent || null;
              }
            } else {
              existing.parent = null;
            }

            const rowWithIds = row as typeof row & {
              taxIds?: number[];
              discountIds?: number[];
              categoryIds?: number[];
            };
            if (Array.isArray(rowWithIds.taxIds)) {
              existing.taxes = rowWithIds.taxIds.length
                ? await queryRunner.manager.findBy(Tax, {
                    id: In(rowWithIds.taxIds),
                    store: { id: storeId } as Store,
                  })
                : [];
            }
            if (Array.isArray(rowWithIds.discountIds)) {
              existing.discounts = rowWithIds.discountIds.length
                ? await queryRunner.manager.findBy(Discount, {
                    id: In(rowWithIds.discountIds),
                    store: { id: storeId } as Store,
                  })
                : [];
            }
            if (Array.isArray(rowWithIds.categoryIds)) {
              existing.categories = rowWithIds.categoryIds.length
                ? await queryRunner.manager.findBy(Category, {
                    id: In(rowWithIds.categoryIds),
                    store: { id: storeId } as Store,
                  })
                : [];
            }

            await queryRunner.manager.save(Product, existing);
            results.push({
              sku,
              title: existing.title,
              status: 'updated',
              message: 'Producto actualizado correctamente',
            });
            summary.updated++;
          } else {
            const product = new Product();
            product.sku = sku;
            product.title = String(row.title ?? '').trim() || '';
            product.description = String(row.description ?? '').trim() || '';
            product.longDescription =
              String(row.longDescription ?? '').trim() || '';
            product.basePrice = Number(row.basePrice) || 0;
            {
              const rawStock = row.stock;
              const isEmptyStock =
                rawStock === null ||
                rawStock === undefined ||
                String(rawStock) === '';
              product.stock = isEmptyStock ? null : Number(rawStock) || 0;
            }
            product.enabled =
              row.enabled !== undefined ? Boolean(row.enabled) : true;
            product.images = Array.isArray(row.images)
              ? (row.images as string[])
              : [];
            product.store = store;

            if (row.parentSku) {
              const parentSku = String(row.parentSku).trim();
              if (parentSku && parentSku !== sku) {
                const parent = await queryRunner.manager.findOne(Product, {
                  where: { sku: parentSku, store: { id: storeId } },
                });
                product.parent = parent || null;
              }
            }

            const rowWithIds = row as typeof row & {
              taxIds?: number[];
              discountIds?: number[];
              categoryIds?: number[];
            };
            if (Array.isArray(rowWithIds.taxIds) && rowWithIds.taxIds.length) {
              product.taxes = await queryRunner.manager.findBy(Tax, {
                id: In(rowWithIds.taxIds),
                store: { id: storeId } as Store,
              });
            }
            if (
              Array.isArray(rowWithIds.discountIds) &&
              rowWithIds.discountIds.length
            ) {
              product.discounts = await queryRunner.manager.findBy(Discount, {
                id: In(rowWithIds.discountIds),
                store: { id: storeId } as Store,
              });
            }
            if (
              Array.isArray(rowWithIds.categoryIds) &&
              rowWithIds.categoryIds.length
            ) {
              product.categories = await queryRunner.manager.findBy(Category, {
                id: In(rowWithIds.categoryIds),
                store: { id: storeId } as Store,
              });
            }

            await queryRunner.manager.save(Product, product);
            results.push({
              sku,
              title: product.title,
              status: 'created',
              message: 'Producto creado correctamente',
            });
            summary.created++;
          }
        } catch (rowError) {
          results.push({
            sku,
            status: 'failed',
            message: `Error procesando producto: ${
              rowError instanceof Error ? rowError.message : 'Error desconocido'
            }`,
          });
          summary.failed++;
        }
      }

      if (dto.deleteProductsNotInExcel) {
        try {
          const allInStore = await queryRunner.manager.find(Product, {
            where: { store: { id: storeId }, enabled: true },
            select: ['id', 'sku', 'title', 'enabled'],
          });
          for (const p of allInStore) {
            if (!incomingSkus.has(p.sku.toLowerCase())) {
              p.enabled = false;
              await queryRunner.manager.save(Product, p);
              results.push({
                sku: p.sku,
                title: p.title,
                status: 'deleted',
                message: 'Producto eliminado (no incluido en Excel)',
              });
              summary.deleted++;
            }
          }
        } catch {}
      }

      await queryRunner.commitTransaction();

      return { ...summary, results };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      let errorMessage = 'Error desconocido';
      if (error instanceof Error) {
        if (error.message.includes('statement timeout')) {
          errorMessage =
            'La importación tardó demasiado (timeout). Intenta con menos productos o contacta a soporte.';
        } else if (error.message.includes('lock timeout')) {
          errorMessage =
            'La base de datos está ocupada. Espera unos segundos e intenta nuevamente.';
        } else {
          errorMessage = error.message;
        }
      }

      throw new BadRequestException(
        `Error importando productos: ${errorMessage}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
