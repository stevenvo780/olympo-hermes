import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBoldPaymentMethod1758566400000 implements MigrationInterface {
  name = 'AddBoldPaymentMethod1758566400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."order_paymentmethod_enum" ADD VALUE IF NOT EXISTS 'bold'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'order_paymentmethod_enum' AND n.nspname = 'public'
        ) THEN
          -- Rename old type
          ALTER TYPE "public"."order_paymentmethod_enum" RENAME TO "order_paymentmethod_enum_old";
          -- Create new type without 'bold'
          CREATE TYPE "public"."order_paymentmethod_enum" AS ENUM ('cash', 'bank_transfer', 'wompi', 'credit');
          -- Alter column to new type
          ALTER TABLE "order" ALTER COLUMN "paymentMethod" TYPE "public"."order_paymentmethod_enum" USING "paymentMethod"::text::"public"."order_paymentmethod_enum";
          -- Drop old type
          DROP TYPE "public"."order_paymentmethod_enum_old";
        END IF;
      END$$;
    `);
  }
}
