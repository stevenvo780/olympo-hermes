import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Category } from './entities/category.entity';
import { Store } from '../store/entities/store.entity';
import { User } from '../user/entities/user.entity';
import { Product } from '../product/entities/product.entity';
import { checkStoreAccess } from '../utils/permissions';
import { ImportCategoryExcelDto } from './dto/import-category-excel.dto';
import { SortOrder } from '../user/dto/find-users.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async createCategory(
    data: Partial<Category> & { parentId?: number },
    storeId: string,
    user: User,
  ): Promise<Category> {
    try {
      const store = await checkStoreAccess(this.storeRepository, storeId, user);

      if (data.position === undefined) {
        const queryBuilder =
          this.categoryRepository.createQueryBuilder('category');

        queryBuilder.where('category.store = :storeId', { storeId: store.id });

        if (data.parentId) {
          queryBuilder.andWhere('category.parent = :parentId', {
            parentId: data.parentId,
          });
        } else {
          queryBuilder.andWhere('category.parent IS NULL');
        }

        const result = await queryBuilder
          .select('MAX(category.position)', 'maxPosition')
          .getRawOne();

        data.position = (result.maxPosition || 0) + 1;
      }

      if (data.parentId) {
        const parent = await this.categoryRepository.findOne({
          where: { id: data.parentId, store: { id: storeId } },
        });
        if (!parent) {
          throw new NotFoundException(
            'Parent category not found or does not belong to store',
          );
        }
        data.parent = parent;
      }
      const category = this.categoryRepository.create({ ...data, store });
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(
          `Ya existe una categoría con el nombre "${data.name}"`,
        );
      }
      throw error;
    }
  }

  async findByStoreHierarchical(storeId: string): Promise<Category[]> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    const rawCategories = await this.categoryRepository.find({
      where: { store: { id: storeId } },
      relations: ['parent'],
      order: { position: SortOrder.ASC },
    });

    const map = new Map<number, Category>();
    rawCategories.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] });
    });
    const visited = new Set<number>();
    for (const cat of map.values()) {
      if (cat.parent && map.has(cat.parent.id)) {
        if (!visited.has(cat.id)) {
          map.get(cat.parent.id).children.push(cat);
        }
      }
      visited.add(cat.id);
    }
    return Array.from(map.values())
      .filter((c) => !c.parent)
      .sort((a, b) => a.position - b.position);
  }

  async findByStore(storeId: string): Promise<Category[]> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return this.categoryRepository.find({
      where: { store: { id: storeId } },
      relations: ['parent', 'children'],
      order: { position: SortOrder.ASC },
    });
  }

  async getCategoryById(id: number, storeId: string): Promise<Category> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['owner'],
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['store'],
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (category.store.id !== store.id) {
      throw new ForbiddenException(
        'Category does not belong to the specified store',
      );
    }
    return category;
  }

  async updateCategory(
    id: number,
    data: Partial<Category> & { parentId?: number | null },
    storeId: string,
    user: User,
  ): Promise<Category> {
    try {
      const store = await checkStoreAccess(this.storeRepository, storeId, user);

      const category = await this.categoryRepository.findOne({
        where: { id },
        relations: ['store', 'parent'],
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
      if (category.store.id !== store.id) {
        throw new ForbiddenException(
          'Category does not belong to the specified store',
        );
      }

      const { parentId, ...rest } = data;
      Object.assign(category, rest);

      if (typeof parentId !== 'undefined') {
        if (parentId === null) {
          category.parent = null;
        } else {
          const parent = await this.categoryRepository.findOne({
            where: { id: parentId, store: { id: storeId } },
          });
          if (!parent) {
            throw new NotFoundException(
              'Parent category not found or does not belong to store',
            );
          }
          category.parent = parent;
        }
      }

      return await this.categoryRepository.save(category);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(
          `Ya existe una categoría con el nombre "${data.name}"`,
        );
      }
      throw error;
    }
  }

  async deleteCategory(id: number, storeId: string, user: User): Promise<void> {
    const store = await checkStoreAccess(this.storeRepository, storeId, user);

    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['store'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.store.id !== store.id) {
      throw new ForbiddenException(
        'Category does not belong to the specified store',
      );
    }

    await this.categoryRepository.delete(id);
  }

  async getCategoryHierarchy(id: number, storeId: string): Promise<Category[]> {
    let category = await this.getCategoryById(id, storeId);
    const hierarchy: Category[] = [];
    while (category) {
      hierarchy.unshift(category);
      if (category.parent) {
        category = await this.categoryRepository.findOne({
          where: { id: category.parent.id },
          relations: ['parent', 'store'],
        });
      } else {
        break;
      }
    }
    return hierarchy;
  }

  async findRootCategories(storeId: string): Promise<Category[]> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const categories = await this.categoryRepository.find({
      where: { store: { id: storeId } },
      relations: ['parent'],
      order: { position: SortOrder.ASC },
    });

    const childrenMap = new Map<number | null, Category[]>();
    categories.forEach((cat) => {
      const pid = cat.parent ? cat.parent.id : null;
      if (!childrenMap.has(pid)) {
        childrenMap.set(pid, []);
      }
      childrenMap.get(pid).push(cat);
    });

    const buildChildren = (cat: Category) => {
      const subcats = childrenMap.get(cat.id) || [];
      cat.children = subcats;
      subcats.forEach((child) => buildChildren(child));
    };

    const roots = childrenMap.get(null) || [];
    roots.forEach((root) => buildChildren(root));
    return roots.sort((a, b) => a.position - b.position);
  }

  async importExcel(
    dto: ImportCategoryExcelDto,
    storeId: string,
    user: User,
  ): Promise<{
    created: number;
    updated: number;
    deleted: number;
    skipped: number;
    failed: number;
    results: {
      categoryName: string;
      status: string;
      message: string;
      categoryId?: number;
    }[];
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await checkStoreAccess(this.storeRepository, storeId, user);

      const summary = {
        created: 0,
        updated: 0,
        deleted: 0,
        skipped: 0,
        failed: 0,
      };
      const results = [];

      const categoryNames = new Map<string, number>();
      dto.rows.forEach((row, _index) => {
        const normalizedName = row.name?.toString().trim().toLowerCase();
        if (normalizedName) {
          categoryNames.set(
            normalizedName,
            (categoryNames.get(normalizedName) || 0) + 1,
          );
        }
      });

      const duplicatedNames = Array.from(categoryNames.entries())
        .filter(([, count]) => count > 1)
        .map(([name]) => name);

      if (duplicatedNames.length > 0) {
        await queryRunner.rollbackTransaction();
        throw new ConflictException(
          `Nombres de categorías duplicados en Excel: ${duplicatedNames.join(
            ', ',
          )}`,
        );
      }

      console.log(
        `[CategoryService] Procesando ${dto.rows.length} categorías...`,
      );
      let processedCount = 0;

      for (const row of dto.rows) {
        processedCount++;
        if (processedCount % 50 === 0) {
          console.log(
            `[CategoryService] Procesadas ${processedCount}/${dto.rows.length} filas.`,
          );
        }
        try {
          const categoryName = row.name?.toString().trim();
          if (!categoryName) {
            results.push({
              categoryName: 'N/A',
              status: 'error',
              message: 'Nombre de categoría vacío o inválido',
            });
            summary.failed++;
            continue;
          }

          // Sanitizar campos numéricos: strings vacíos → null/0
          const toNumOrNull = (v: unknown): number | null => {
            if (v === null || v === undefined || v === '') return null;
            const n = Number(v);
            return Number.isNaN(n) ? null : n;
          };
          const sanitizedParentId = toNumOrNull(row.parentId);
          const sanitizedPosition = toNumOrNull(row.position) ?? 0;
          const sanitizedId = toNumOrNull(row.id);

          // SAVEPOINT para que un error individual no aborte toda la transacción
          await queryRunner.query(`SAVEPOINT sp_cat_${processedCount}`);

          let existingCategory = null;
          if (sanitizedId) {
            existingCategory = await queryRunner.manager.findOne(Category, {
              where: { id: sanitizedId, store: { id: storeId } },
              relations: ['parent'],
            });
          }

          if (!existingCategory) {
            existingCategory = await queryRunner.manager.findOne(Category, {
              where: { name: categoryName, store: { id: storeId } },
              relations: ['parent'],
            });
          }

          if (existingCategory) {
            let hasChanges = false;

            if (row.name !== undefined && existingCategory.name !== row.name) {
              existingCategory.name = row.name;
              hasChanges = true;
            }

            if (
              row.description !== undefined &&
              existingCategory.description !== row.description
            ) {
              existingCategory.description = row.description || '';
              hasChanges = true;
            }

            if (
              row.imageUrl !== undefined &&
              existingCategory.imageUrl !== row.imageUrl
            ) {
              existingCategory.imageUrl = row.imageUrl || '';
              hasChanges = true;
            }

            if (
              row.position !== undefined &&
              existingCategory.position !== sanitizedPosition
            ) {
              existingCategory.position = sanitizedPosition;
              hasChanges = true;
            }

            if (Object.prototype.hasOwnProperty.call(row, 'parentId')) {
              if (sanitizedParentId !== null) {
                if (sanitizedParentId !== existingCategory.parent?.id) {
                  const parentCategory = await queryRunner.manager.findOne(
                    Category,
                    {
                      where: { id: sanitizedParentId, store: { id: storeId } },
                    },
                  );
                  if (parentCategory) {
                    existingCategory.parent = parentCategory;
                    hasChanges = true;
                  }
                }
              } else {
                if (existingCategory.parent) {
                  existingCategory.parent = null;
                  hasChanges = true;
                }
              }
            }

            if (hasChanges) {
              await queryRunner.manager.save(Category, existingCategory);
              summary.updated++;
              results.push({
                categoryName,
                categoryId: existingCategory.id,
                status: 'updated',
                message: 'Categoría actualizada correctamente',
              });
            } else {
              summary.skipped++;
              results.push({
                categoryName,
                categoryId: existingCategory.id,
                status: 'skipped',
                message: 'Categoría sin cambios',
              });
            }
          } else {
            const newCategory = new Category();
            newCategory.name = categoryName;
            newCategory.description = row.description || '';
            newCategory.imageUrl = row.imageUrl || '';
            newCategory.position = sanitizedPosition;

            const store = await queryRunner.manager.findOne(Store, {
              where: { id: storeId },
            });
            if (!store) {
              throw new Error(`Store con ID ${storeId} no encontrado`);
            }
            newCategory.store = store;

            if (sanitizedParentId !== null) {
              const parentCategory = await queryRunner.manager.findOne(
                Category,
                {
                  where: { id: sanitizedParentId, store: { id: storeId } },
                },
              );
              if (parentCategory) {
                newCategory.parent = parentCategory;
              }
            }

            await queryRunner.manager.save(Category, newCategory);

            results.push({
              categoryName,
              categoryId: newCategory.id,
              status: 'created',
              message: 'Categoría creada correctamente',
            });
            summary.created++;
          }
        } catch (error) {
          // Rollback al savepoint para desbloquear la transacción
          try {
            await queryRunner.query(
              `ROLLBACK TO SAVEPOINT sp_cat_${processedCount}`,
            );
          } catch {
            // Si falla el rollback al savepoint, la transacción completa fallará después
          }
          results.push({
            categoryName: row.name?.toString() || 'N/A',
            status: 'error',
            message: `Error procesando categoría: ${
              error instanceof Error ? error.message : 'Error desconocido'
            }`,
          });
          summary.failed++;
        }
      }

      if (dto.deleteCategoriesNotInExcel) {
        try {
          const toNum = (v: unknown): number | null => {
            if (v === null || v === undefined || v === '') return null;
            const n = Number(v);
            return Number.isNaN(n) ? null : n;
          };
          const excelIds = dto.rows
            .map((row) => toNum(row.id))
            .filter((id): id is number => id !== null);

          // Solo eliminar si el Excel contiene IDs (re-importación, no primera carga)
          if (excelIds.length === 0) {
            console.log(
              '[CategoryService] Excel sin IDs, omitiendo eliminación de categorías.',
            );
          } else {
            const allCategories = await queryRunner.manager.find(Category, {
              where: { store: { id: storeId } },
            });

            const categoriesToDelete = allCategories.filter(
              (cat) => !excelIds.includes(cat.id),
            );

            for (const category of categoriesToDelete) {
              try {
                const productsCount = await queryRunner.manager
                  .createQueryBuilder(Product, 'product')
                  .innerJoin('product.categories', 'category')
                  .innerJoin('product.store', 'store')
                  .where('category.id = :categoryId', {
                    categoryId: category.id,
                  })
                  .andWhere('store.id = :storeId', { storeId })
                  .getCount();

                if (productsCount > 0) {
                  results.push({
                    categoryName: category.name,
                    categoryId: category.id,
                    status: 'error',
                    message: `No se puede eliminar: tiene ${productsCount} producto(s) asociado(s)`,
                  });
                  summary.failed++;
                  continue;
                }

                const childrenCount = await queryRunner.manager.count(
                  Category,
                  {
                    where: { parent: { id: category.id } },
                  },
                );

                if (childrenCount > 0) {
                  results.push({
                    categoryName: category.name,
                    categoryId: category.id,
                    status: 'error',
                    message: `No se puede eliminar: tiene ${childrenCount} subcategoría(s)`,
                  });
                  summary.failed++;
                  continue;
                }

                await queryRunner.manager.remove(Category, category);
                results.push({
                  categoryName: category.name,
                  categoryId: category.id,
                  status: 'deleted',
                  message: 'Categoría eliminada (no incluida en Excel)',
                });
                summary.deleted++;
              } catch (error) {
                results.push({
                  categoryName: category.name,
                  categoryId: category.id,
                  status: 'error',
                  message: `Error al eliminar: ${
                    error instanceof Error ? error.message : 'Error desconocido'
                  }`,
                });
                summary.failed++;
              }
            }
          }
        } catch (error) {
          console.error('Error eliminando categorías no incluidas:', error);
        }
      }

      await queryRunner.commitTransaction();
      return { ...summary, results };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `Error importing categories: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
