import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCategoryOrder1763500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const tableExists = await queryRunner.hasTable('product_category_order');

    if (!tableExists) {
      // Crear la tabla product_category_order
      await queryRunner.query(`
                CREATE TABLE "product_category_order" (
                    "id" SERIAL PRIMARY KEY,
                    "productId" integer NOT NULL,
                    "categoryId" integer NOT NULL,
                    "orderInCategory" integer NOT NULL DEFAULT 0,
                    CONSTRAINT "UQ_product_category_order_product_category" UNIQUE ("productId", "categoryId"),
                    CONSTRAINT "FK_product_category_order_product" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE,
                    CONSTRAINT "FK_product_category_order_category" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE
                )
            `);

      // Crear índices para optimizar consultas
      await queryRunner.query(`
                CREATE INDEX "IDX_product_category_order_product" ON "product_category_order" ("productId")
            `);
      await queryRunner.query(`
                CREATE INDEX "IDX_product_category_order_category" ON "product_category_order" ("categoryId")
            `);
      await queryRunner.query(`
                CREATE INDEX "IDX_product_category_order_category_order" ON "product_category_order" ("categoryId", "orderInCategory")
            `);

      await queryRunner.query(`
                INSERT INTO "product_category_order" ("productId", "categoryId", "orderInCategory")
                SELECT 
                    pc."productId",
                    pc."categoryId",
                    COALESCE(p."order", 0) as "orderInCategory"
                FROM "product_categories_category" pc
                JOIN "product" p ON p."id" = pc."productId"
                WHERE p."enabled" = true
            `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('product_category_order');

    if (tableExists) {
      await queryRunner.query(`DROP TABLE "product_category_order"`);
    }
  }
}
