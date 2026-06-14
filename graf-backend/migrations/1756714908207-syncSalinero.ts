import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncSalinero1756714908207 implements MigrationInterface {
  name = 'SyncSalinero1756714908207';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "fk_customer_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "fk_customer_store"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item" DROP CONSTRAINT "FK_646bf9ece6f45dbe41c203e06e0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "fk_order_customer"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_product_images_gin"`);
    await queryRunner.query(`DROP INDEX "public"."idx_customer_email_store"`);
    await queryRunner.query(`DROP INDEX "public"."idx_order_customer"`);
    await queryRunner.query(
      `ALTER TABLE "product" DROP CONSTRAINT "uk_product_store_sku"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN "images_backup"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN "variationType"`,
    );
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "value"`);
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "documentnumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "documentnumber" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "sigoApiKey" text`);
    await queryRunner.query(`ALTER TABLE "user" ADD "sigoUsername" text`);
    await queryRunner.query(`ALTER TABLE "user" ADD "sigoPassword" text`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "sigoApiUrl" character varying DEFAULT 'https://api.siigo.com'`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "hubspotAccessToken" text`);
    await queryRunner.query(`ALTER TABLE "user" ADD "hubspotApiKey" text`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "hubspotApiUrl" character varying DEFAULT 'https://api.hubapi.com'`,
    );
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "images"`);
    await queryRunner.query(`ALTER TABLE "product" ADD "images" json`);
    await queryRunner.query(
      `ALTER TABLE "config" ALTER COLUMN "productViewConfig" SET NOT NULL`,
    );
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
    await queryRunner.query(
      `CREATE INDEX "IDX_10930e4d33b43e97f9aee871cd" ON "customer" ("email", "storeid") `,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "FK_15cb27cb3a4bde95b8e05ef8f40" FOREIGN KEY ("storeid") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "FK_e53504e819612643b00c5b7ff60" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item" ADD CONSTRAINT "FK_646bf9ece6f45dbe41c203e06e0" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_4379a86bb894fb299c625d00f40" FOREIGN KEY ("customerid") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "FK_4379a86bb894fb299c625d00f40"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item" DROP CONSTRAINT "FK_646bf9ece6f45dbe41c203e06e0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "FK_e53504e819612643b00c5b7ff60"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "FK_15cb27cb3a4bde95b8e05ef8f40"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_10930e4d33b43e97f9aee871cd"`,
    );
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
    await queryRunner.query(
      `ALTER TABLE "config" ALTER COLUMN "productViewConfig" DROP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "images"`);
    await queryRunner.query(`ALTER TABLE "product" ADD "images" jsonb`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "hubspotApiUrl"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "hubspotApiKey"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "hubspotAccessToken"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "sigoApiUrl"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "sigoPassword"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "sigoUsername"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "sigoApiKey"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "documentnumber"`);
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "documentnumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD "value" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ADD "variationType" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "product" ADD "images_backup" text`);
    await queryRunner.query(
      `ALTER TABLE "product" ADD CONSTRAINT "uk_product_store_sku" UNIQUE ("sku", "storeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_order_customer" ON "order" ("customerid") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_customer_email_store" ON "customer" ("email", "storeid") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_images_gin" ON "product" ("images") `,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "fk_order_customer" FOREIGN KEY ("customerid") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item" ADD CONSTRAINT "FK_646bf9ece6f45dbe41c203e06e0" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "fk_customer_store" FOREIGN KEY ("storeid") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "fk_customer_user" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
