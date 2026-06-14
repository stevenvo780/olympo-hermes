import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNavbarConfigFields1757000000000 implements MigrationInterface {
  name = 'AddNavbarConfigFields1757000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasShowNavbarLogo = await queryRunner.hasColumn(
      'config',
      'showNavbarLogo',
    );
    const hasNavbarHeight = await queryRunner.hasColumn(
      'config',
      'navbarHeight',
    );

    if (!hasShowNavbarLogo) {
      await queryRunner.query(`
        ALTER TABLE config
        ADD COLUMN "showNavbarLogo" boolean DEFAULT true
      `);
    }

    if (!hasNavbarHeight) {
      await queryRunner.query(`
        ALTER TABLE config
        ADD COLUMN "navbarHeight" integer DEFAULT 60
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE config
      DROP COLUMN "navbarHeight"
    `);

    await queryRunner.query(`
      ALTER TABLE config
      DROP COLUMN "showNavbarLogo"
    `);
  }
}
