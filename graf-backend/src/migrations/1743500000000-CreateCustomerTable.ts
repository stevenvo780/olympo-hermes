import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomerTable1743500000000 implements MigrationInterface {
  name = 'CreateCustomerTable1743500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "customer" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phone" character varying,
        "address" character varying,
        "city" character varying,
        "postalCode" character varying,
        "birthDate" TIMESTAMP,
        "loyaltyPoints" integer NOT NULL DEFAULT '0',
        "isActive" boolean NOT NULL DEFAULT true,
        "notes" character varying,
        "totalSpent" integer NOT NULL DEFAULT '0',
        "totalOrders" integer NOT NULL DEFAULT '0',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "storeId" character varying,
        CONSTRAINT "UQ_customer_email_store" UNIQUE ("email", "storeId"),
        CONSTRAINT "PK_customer_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "customer" 
      ADD CONSTRAINT "FK_customer_store" 
      FOREIGN KEY ("storeId") 
      REFERENCES "store"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_customer_store" ON "customer" ("storeId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_customer_email" ON "customer" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_customer_active" ON "customer" ("isActive")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_customer_active"`);
    await queryRunner.query(`DROP INDEX "IDX_customer_email"`);
    await queryRunner.query(`DROP INDEX "IDX_customer_store"`);
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "FK_customer_store"`,
    );
    await queryRunner.query(`DROP TABLE "customer"`);
  }
}
