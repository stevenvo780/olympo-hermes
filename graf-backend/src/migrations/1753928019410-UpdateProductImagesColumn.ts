import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateProductImagesColumn1753928019410
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" ADD "images_temp" json`);

    await queryRunner.query(`
            UPDATE "product" 
            SET "images_temp" = CASE 
                WHEN "images" IS NOT NULL AND "images" != '' THEN 
                    ('["' || REPLACE("images", ',', '","') || '"]')::json
                ELSE NULL 
            END
        `);

    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "images"`);

    await queryRunner.query(
      `ALTER TABLE "product" RENAME COLUMN "images_temp" TO "images"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" ADD "images_temp" text`);

    await queryRunner.query(`
            UPDATE "product" 
            SET "images_temp" = CASE 
                WHEN "images" IS NOT NULL THEN 
                    TRIM(BOTH '"' FROM REPLACE(REPLACE("images"::text, '["', ''), '"]', ''))
                ELSE NULL 
            END
        `);

    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "images"`);

    await queryRunner.query(
      `ALTER TABLE "product" RENAME COLUMN "images_temp" TO "images"`,
    );
  }
}
