import { MigrationInterface, QueryRunner } from 'typeorm';

export class IncreaseTotalSpentPrecision1760806839139
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Aumentar la precisión del campo totalspent de DECIMAL(10,2) a DECIMAL(15,2)
    await queryRunner.query(`
            ALTER TABLE "customer" 
            ALTER COLUMN "totalspent" TYPE NUMERIC(15,2)
        `);

    // 2. Recalcular totalOrders y totalSpent para todos los clientes
    await queryRunner.query(`
            WITH customer_stats AS (
                SELECT 
                    c.id,
                    COUNT(o.id) AS total_orders_count,
                    COALESCE(SUM((o.amount->>'total')::decimal), 0) AS total_spent_sum
                FROM 
                    customer c
                    LEFT JOIN "order" o ON o.customerid = c.id
                GROUP BY 
                    c.id
            )
            UPDATE customer
            SET 
                totalorders = customer_stats.total_orders_count,
                totalspent = customer_stats.total_spent_sum
            FROM 
                customer_stats
            WHERE 
                customer.id = customer_stats.id
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir el cambio de precisión (nota: esto podría fallar si hay valores grandes)
    await queryRunner.query(`
            ALTER TABLE "customer" 
            ALTER COLUMN "totalspent" TYPE NUMERIC(10,2)
        `);

    // Resetear las estadísticas a 0
    await queryRunner.query(`
            UPDATE customer 
            SET totalorders = 0, totalspent = 0
        `);
  }
}
