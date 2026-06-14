import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeProductDescriptionOptional1738800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "description" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "product" SET "description" = '' WHERE "description" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "description" SET NOT NULL`,
    );
  }
}
