import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveProductOrderColumn1766244100332
  implements MigrationInterface
{
  name = 'RemoveProductOrderColumn1766244100332';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the index on order column first if exists
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_product_order";
    `);

    // Remove the order column from product table
    await queryRunner.query(`
      ALTER TABLE "product" DROP COLUMN IF EXISTS "order";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add the order column
    await queryRunner.query(`
      ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "order" integer NOT NULL DEFAULT 0;
    `);

    // Recreate index
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_order" ON "product" ("order");
    `);
  }
}
