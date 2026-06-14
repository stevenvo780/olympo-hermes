import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomerEntity1753990164079 implements MigrationInterface {
  name = 'CreateCustomerEntity1753990164079';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "customer" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "email" character varying NOT NULL,
                "phone" character varying,
                "userId" character varying,
                "storeId" character varying NOT NULL,
                "totalOrders" integer NOT NULL DEFAULT '0',
                "totalSpent" numeric(10,2) NOT NULL DEFAULT '0',
                "loyaltyPoints" integer NOT NULL DEFAULT '0',
                "lastOrderDate" TIMESTAMP,
                "averageOrderValue" numeric(10,2) NOT NULL DEFAULT '0',
                "isActive" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_customer_email_store" ON "customer" ("email", "storeId")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_customer_store" ON "customer" ("storeId")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_customer_user" ON "customer" ("userId")
        `);

    await queryRunner.query(`
            ALTER TABLE "customer" ADD CONSTRAINT "FK_customer_user" 
            FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "customer" ADD CONSTRAINT "FK_customer_store" 
            FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "order" ADD COLUMN "customerId" integer
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_order_customer" ON "order" ("customerId")
        `);

    await queryRunner.query(`
            ALTER TABLE "order" ADD CONSTRAINT "FK_order_customer" 
            FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "FK_order_customer"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_order_customer"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "customerId"`);
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "FK_customer_store"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "FK_customer_user"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_customer_user"`);
    await queryRunner.query(`DROP INDEX "IDX_customer_store"`);
    await queryRunner.query(`DROP INDEX "IDX_customer_email_store"`);
    await queryRunner.query(`DROP TABLE "customer"`);
  }
}
