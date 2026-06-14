import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerToOrder1743500100000 implements MigrationInterface {
  name = 'AddCustomerToOrder1743500100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order" 
      ADD "customerId" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "order" 
      ADD CONSTRAINT "FK_order_customer" 
      FOREIGN KEY ("customerId") 
      REFERENCES "customer"("id") 
      ON DELETE SET NULL 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_customer" ON "order" ("customerId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_order_customer"`);
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "FK_order_customer"`,
    );
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "customerId"`);
  }
}
