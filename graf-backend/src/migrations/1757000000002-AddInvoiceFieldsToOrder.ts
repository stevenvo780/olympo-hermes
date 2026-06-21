import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvoiceFieldsToOrder1757000000002
  implements MigrationInterface
{
  name = 'AddInvoiceFieldsToOrder1757000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order"
      ADD COLUMN "invoiceId" varchar NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "order"
      ADD COLUMN "invoicePdfUrl" varchar NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order"
      DROP COLUMN "invoiceId"
    `);
    await queryRunner.query(`
      ALTER TABLE "order"
      DROP COLUMN "invoicePdfUrl"
    `);
  }
}
