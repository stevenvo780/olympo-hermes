import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateIdempotencyKeyTable1757000000005
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'idempotency_key',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'idempotencyKey',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'cachedResponse',
            type: 'jsonb',
          },
          {
            name: 'statusCode',
            type: 'int',
            default: 200,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Indexes para búsquedas rápidas
    await queryRunner.createIndex(
      'idempotency_key',
      new TableIndex({
        name: 'IDX_idempotency_key_idempotencyKey',
        columnNames: ['idempotencyKey'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'idempotency_key',
      new TableIndex({
        name: 'IDX_idempotency_key_expiresAt',
        columnNames: ['expiresAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('idempotency_key');
  }
}
