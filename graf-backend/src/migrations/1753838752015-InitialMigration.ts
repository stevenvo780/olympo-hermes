import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1753838752015 implements MigrationInterface {
  name = 'InitialMigration1753838752015';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    console.log(
      'Base de datos ya está en el estado correcto - migración inicial documentada',
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
