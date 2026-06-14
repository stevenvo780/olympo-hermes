import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductViewConfigColumn1738102000000
  implements MigrationInterface
{
  name = 'AddProductViewConfigColumn1738102000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE config 
      ADD COLUMN "productViewConfig" json DEFAULT '{}'::json
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE config 
      DROP COLUMN "productViewConfig"
    `);
  }
}
