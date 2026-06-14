import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFreeShippingThresholdToDeliveryZone1762835537824
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la columna ya existe antes de agregarla
    const table = await queryRunner.getTable('delivery_zone');
    const columnExists = table?.findColumnByName('freeShippingThreshold');

    if (!columnExists) {
      await queryRunner.query(`
                ALTER TABLE "delivery_zone" 
                ADD COLUMN "freeShippingThreshold" numeric(10,2) DEFAULT NULL
            `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la columna existe antes de eliminarla
    const table = await queryRunner.getTable('delivery_zone');
    const columnExists = table?.findColumnByName('freeShippingThreshold');

    if (columnExists) {
      await queryRunner.query(`
                ALTER TABLE "delivery_zone" 
                DROP COLUMN "freeShippingThreshold"
            `);
    }
  }
}
