import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCustomerTotalSpentAndEnsurePaymentEnums1758600000000
  implements MigrationInterface
{
  name = 'FixCustomerTotalSpentAndEnsurePaymentEnums1758600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customer" 
      ALTER COLUMN "totalspent" TYPE numeric(10,2) USING "totalspent"::numeric(10,2)
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'credit' 
          AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'order_paymentmethod_enum'
          )
        ) THEN
          ALTER TYPE "public"."order_paymentmethod_enum" ADD VALUE 'credit';
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'bold' 
          AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'order_paymentmethod_enum'
          )
        ) THEN
          ALTER TYPE "public"."order_paymentmethod_enum" ADD VALUE 'bold';
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customer" 
      ALTER COLUMN "totalspent" TYPE integer USING "totalspent"::integer
    `);
  }
}
