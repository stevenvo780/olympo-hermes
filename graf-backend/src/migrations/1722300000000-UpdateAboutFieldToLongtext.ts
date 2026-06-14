import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAboutFieldToText1722300000000 implements MigrationInterface {
  name = 'UpdateAboutFieldToText1722300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "config" ALTER COLUMN "about" TYPE text`,
    );
    await queryRunner.query(
      `ALTER TABLE "config" ALTER COLUMN "about" SET DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "config" ALTER COLUMN "about" TYPE text`,
    );
    await queryRunner.query(
      `ALTER TABLE "config" ALTER COLUMN "about" SET DEFAULT ''`,
    );
  }
}
