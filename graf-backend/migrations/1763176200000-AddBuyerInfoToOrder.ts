import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBuyerInfoToOrder1763176200000 implements MigrationInterface {
  name = 'AddBuyerInfoToOrder1763176200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "order" 
            ADD COLUMN IF NOT EXISTS "buyerName" character varying,
            ADD COLUMN IF NOT EXISTS "buyerPhone" character varying
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "order" 
            DROP COLUMN IF EXISTS "buyerName",
            DROP COLUMN IF EXISTS "buyerPhone"
        `);
  }
}
