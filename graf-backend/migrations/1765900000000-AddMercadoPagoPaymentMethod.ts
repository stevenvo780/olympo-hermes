import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Añade el método de pago `mercadopago` al enum de pedidos (migración Wompi → MP).
 *
 * Conserva los valores históricos (`wompi`, `bold`) como legacy para no romper
 * pedidos antiguos. Solo agrega el nuevo valor de forma idempotente.
 */
export class AddMercadoPagoPaymentMethod1765900000000
  implements MigrationInterface
{
  name = 'AddMercadoPagoPaymentMethod1765900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."order_paymentmethod_enum" ADD VALUE IF NOT EXISTS 'mercadopago'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres no permite quitar un valor de un enum directamente. Se recrea el
    // tipo sin 'mercadopago', mapeando los pedidos que lo usen a 'wompi' (legacy)
    // para no perder la fila. Down es best-effort y solo aplica si el tipo existe.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'order_paymentmethod_enum' AND n.nspname = 'public'
        ) THEN
          UPDATE "order" SET "paymentMethod" = 'wompi'
            WHERE "paymentMethod"::text = 'mercadopago';
          ALTER TYPE "public"."order_paymentmethod_enum" RENAME TO "order_paymentmethod_enum_old";
          CREATE TYPE "public"."order_paymentmethod_enum" AS ENUM ('cash', 'bank_transfer', 'wompi', 'bold', 'credit');
          ALTER TABLE "order" ALTER COLUMN "paymentMethod" DROP DEFAULT;
          ALTER TABLE "order" ALTER COLUMN "paymentMethod" TYPE "public"."order_paymentmethod_enum" USING "paymentMethod"::text::"public"."order_paymentmethod_enum";
          ALTER TABLE "order" ALTER COLUMN "paymentMethod" SET DEFAULT 'cash';
          DROP TYPE "public"."order_paymentmethod_enum_old";
        END IF;
      END$$;
    `);
  }
}
