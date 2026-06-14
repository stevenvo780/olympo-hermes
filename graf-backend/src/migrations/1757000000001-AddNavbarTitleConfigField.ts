import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNavbarTitleConfigField1757000000001
  implements MigrationInterface
{
  name = 'AddNavbarTitleConfigField1757000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE config
      ADD COLUMN "showNavbarTitle" boolean DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE config
      DROP COLUMN "showNavbarTitle"
    `);
  }
}
