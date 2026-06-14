import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  RecommendedCardType,
  RecommendedDisplayMode,
} from '../config/entities/config.entity';

export class SetDefaultProductViewConfig1738103000000
  implements MigrationInterface
{
  name = 'SetDefaultProductViewConfig1738103000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const defaultProductViewConfig = JSON.stringify({
      defaultView: RecommendedCardType.CAROUSEL,
      filteredView: RecommendedDisplayMode.GRID,
      availableViews: [
        RecommendedCardType.CAROUSEL,
        RecommendedCardType.GRID,
        RecommendedCardType.CLOTHING,
        RecommendedCardType.LIST,
        RecommendedCardType.FEATURED,
        RecommendedCardType.CLOTHING_GRID,
        RecommendedCardType.WIDE_CARD,
        RecommendedCardType.COMPACT,
      ],
    });

    await queryRunner.query(
      `
      UPDATE config 
      SET "productViewConfig" = $1::json 
      WHERE "productViewConfig"::text = '{}'
    `,
      [defaultProductViewConfig],
    );

    await queryRunner.query(`
      ALTER TABLE config 
      ALTER COLUMN "productViewConfig" 
      SET DEFAULT '${defaultProductViewConfig}'::json
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE config 
      ALTER COLUMN "productViewConfig" 
      SET DEFAULT '{}'::json
    `);
  }
}
