import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplifyCustomerForColombia1743500000001
  implements MigrationInterface
{
  name = 'SimplifyCustomerForColombia1743500000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customer" 
      DROP COLUMN IF EXISTS "postalCode",
      DROP COLUMN IF EXISTS "birthDate",
      DROP COLUMN IF EXISTS "loyaltyPoints",
      DROP COLUMN IF EXISTS "isActive",
      DROP COLUMN IF EXISTS "notes",
      DROP COLUMN IF EXISTS "totalSpent",
      DROP COLUMN IF EXISTS "totalOrders",
      DROP COLUMN IF EXISTS "userId"
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_active"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customer" 
      ADD COLUMN "postalCode" character varying,
      ADD COLUMN "birthDate" TIMESTAMP,
      ADD COLUMN "loyaltyPoints" integer NOT NULL DEFAULT '0',
      ADD COLUMN "isActive" boolean NOT NULL DEFAULT true,
      ADD COLUMN "notes" character varying,
      ADD COLUMN "totalSpent" integer NOT NULL DEFAULT '0',
      ADD COLUMN "totalOrders" integer NOT NULL DEFAULT '0',
      ADD COLUMN "userId" character varying
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_customer_active" ON "customer" ("isActive")
    `);
  }
}
