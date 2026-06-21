import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatePendingWompiSubscriptionTable1757000000004
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pending_wompi_subscription',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'transactionId',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'subscriptionData',
            type: 'jsonb',
            isNullable: true,
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
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_pending_wompi_subscription_user',
            columnNames: ['userId'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    // Indexes for fast lookups
    await queryRunner.createIndex(
      'pending_wompi_subscription',
      new TableIndex({
        name: 'IDX_pending_wompi_subscription_transactionId',
        columnNames: ['transactionId'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'pending_wompi_subscription',
      new TableIndex({
        name: 'IDX_pending_wompi_subscription_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'pending_wompi_subscription',
      new TableIndex({
        name: 'IDX_pending_wompi_subscription_expiresAt',
        columnNames: ['expiresAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('pending_wompi_subscription');
  }
}
