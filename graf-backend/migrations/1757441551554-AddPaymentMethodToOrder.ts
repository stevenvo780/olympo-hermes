import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentMethodToOrder1757441551554
  implements MigrationInterface
{
  name = 'AddPaymentMethodToOrder1757441551554';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."order_paymentmethod_enum" AS ENUM('cash', 'bank_transfer', 'wompi', 'credit')`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD "paymentMethod" "public"."order_paymentmethod_enum" NOT NULL DEFAULT 'cash'`,
    );
    await queryRunner.query(`ALTER TABLE "order" ADD "creditDays" integer`);
    await queryRunner.query(`ALTER TABLE "order" ADD "notes" text`);
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_enum" RENAME TO "user_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_enum" AS ENUM('super_admin', 'business_owner', 'customer')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "role" TYPE "public"."user_role_enum" USING "role"::"text"::"public"."user_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'customer'`,
    );
    await queryRunner.query(`DROP TYPE "public"."user_role_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_enum_old" AS ENUM('super_admin', 'business_owner', 'customer')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "role" TYPE "public"."user_role_enum_old" USING "role"::"text"::"public"."user_role_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'customer'`,
    );
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_enum_old" RENAME TO "user_role_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "notes"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "creditDays"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "paymentMethod"`);
    await queryRunner.query(`DROP TYPE "public"."order_paymentmethod_enum"`);
  }
}
