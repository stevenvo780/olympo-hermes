import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddApiKeyHashColumn1757000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add apiKeyHash column with unique index for O(1) lookups
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'apikeyhash',
        type: 'varchar',
        length: '64',
        isNullable: true,
        isUnique: true,
      }),
    );

    // Create index for fast lookups
    await queryRunner.createIndex(
      'user',
      new TableIndex({
        name: 'IDX_user_apikeyhash',
        columnNames: ['apikeyhash'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('user', 'IDX_user_apikeyhash');
    await queryRunner.dropColumn('user', 'apikeyhash');
  }
}
