import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaxesToOrders1740187200000 implements MigrationInterface {
  name = 'AddTaxesToOrders1740187200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla de unión para la relación ManyToMany entre Order y Tax
    await queryRunner.query(`
      CREATE TABLE "order_taxes" (
        "order_id" integer NOT NULL,
        "tax_id" integer NOT NULL,
        CONSTRAINT "PK_order_taxes" PRIMARY KEY ("order_id", "tax_id")
      )
    `);

    // Crear índices para mejorar el rendimiento
    await queryRunner.query(`
      CREATE INDEX "IDX_order_taxes_order_id" ON "order_taxes" ("order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_order_taxes_tax_id" ON "order_taxes" ("tax_id")
    `);

    // Añadir foreign keys
    await queryRunner.query(`
      ALTER TABLE "order_taxes"
      ADD CONSTRAINT "FK_order_taxes_order"
      FOREIGN KEY ("order_id") REFERENCES "order" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "order_taxes"
      ADD CONSTRAINT "FK_order_taxes_tax"
      FOREIGN KEY ("tax_id") REFERENCES "tax" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    await queryRunner.query(
      `ALTER TABLE "order_taxes" DROP CONSTRAINT "FK_order_taxes_tax"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_taxes" DROP CONSTRAINT "FK_order_taxes_order"`,
    );

    // Eliminar índices
    await queryRunner.query(`DROP INDEX "IDX_order_taxes_tax_id"`);
    await queryRunner.query(`DROP INDEX "IDX_order_taxes_order_id"`);

    // Eliminar tabla
    await queryRunner.query(`DROP TABLE "order_taxes"`);
  }
}
