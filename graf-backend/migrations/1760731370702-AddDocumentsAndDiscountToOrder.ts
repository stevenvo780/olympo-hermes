import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentsAndDiscountToOrder1760731370702
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "order" 
            ADD COLUMN IF NOT EXISTS "documents" json DEFAULT '[]'
        `);

    await queryRunner.query(`
            DO $$
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_discounttype_enum') THEN
                CREATE TYPE "order_discounttype_enum" AS ENUM('percentage', 'fixed');
              END IF;
            END$$;
        `);
    await queryRunner.query(`
            ALTER TABLE "order" 
            ADD COLUMN IF NOT EXISTS "discountType" "order_discounttype_enum"
        `);

    await queryRunner.query(`
            ALTER TABLE "order" 
            ADD COLUMN IF NOT EXISTS "discountValue" numeric(10,2)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "order" DROP COLUMN "discountValue"
        `);

    await queryRunner.query(`
            ALTER TABLE "order" DROP COLUMN "discountType"
        `);

    await queryRunner.query(`
            DROP TYPE "order_discounttype_enum"
        `);

    await queryRunner.query(`
            ALTER TABLE "order" DROP COLUMN "documents"
        `);
  }
}
