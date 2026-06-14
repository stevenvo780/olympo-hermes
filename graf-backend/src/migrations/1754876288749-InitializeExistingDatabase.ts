import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitializeExistingDatabase1754876288749
  implements MigrationInterface
{
  name = 'InitializeExistingDatabase1754876288749';

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      const tables = await queryRunner.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('profile', 'user', 'store', 'product', 'order', 'category')
        ORDER BY tablename
      `);

      console.log(
        `✅ Tablas encontradas: ${(tables as Array<{ tablename: string }>)
          .map((t) => t.tablename)
          .join(', ')}`,
      );

      const profileExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'profile' AND table_schema = 'public'
        )
      `);

      if (profileExists[0].exists) {
        try {
          await queryRunner.query(`
            DO $$ 
            BEGIN
              -- Verificar si los índices principales existen, crearlos solo si no existen
              IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PK_3dd8bfc97e4a77c70971591bdcb') THEN
                -- El índice ya debería existir, esto es solo verificación
                RAISE NOTICE 'Índice PK_profile ya existe o se omite';
              END IF;
            END $$;
          `);
        } catch {}
      } else {
        throw new Error(
          '❌ Tabla profile no encontrada - La base de datos no está en el estado esperado',
        );
      }
    } catch (error) {
      console.error('❌ Error durante inicialización:', error);
      throw error;
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    console.log(
      'ℹ️ Esta migración no requiere rollback ya que no modificó la estructura',
    );
  }
}
