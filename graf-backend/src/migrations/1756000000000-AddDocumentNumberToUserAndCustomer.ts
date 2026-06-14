import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentNumberToUserAndCustomer1756000000000
  implements MigrationInterface
{
  name = 'AddDocumentNumberToUserAndCustomer1756000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * Avoid adding duplicated columns when migration runs multiple times.
     */
    const userHasColumn = await queryRunner.hasColumn('user', 'documentnumber');
    const customerHasColumn = await queryRunner.hasColumn(
      'customer',
      'documentnumber',
    );

    if (!userHasColumn) {
      await queryRunner.query(`
        ALTER TABLE "user" ADD COLUMN "documentnumber" character varying
      `);
    }

    if (!customerHasColumn) {
      await queryRunner.query(`
        ALTER TABLE "customer" ADD COLUMN "documentnumber" character varying
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customer" DROP COLUMN "documentnumber"
    `);

    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN "documentnumber"
    `);
  }
}
