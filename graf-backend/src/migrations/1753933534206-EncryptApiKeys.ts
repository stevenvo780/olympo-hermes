import { MigrationInterface, QueryRunner } from 'typeorm';
import { EncryptionService } from '../utils/encryption.service';

export class EncryptApiKeys1753933534206 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      const encryptionService = new EncryptionService();

      const users = await queryRunner.query(`
                SELECT id, "apiKey" 
                FROM "user" 
                WHERE "apiKey" IS NOT NULL 
                AND "apiKey" != ''
                AND "apiKey" NOT LIKE '%:%'
            `);

      for (const user of users) {
        const encryptedApiKey = encryptionService.encrypt(user.apiKey);

        await queryRunner.query(
          `
                    UPDATE "user" 
                    SET "apiKey" = $1 
                    WHERE id = $2
                `,
          [encryptedApiKey, user.id],
        );
      }
    } catch (error) {
      console.error('❌ Error durante la encriptación de API keys:', error);
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      const encryptionService = new EncryptionService();

      const users = await queryRunner.query(`
                SELECT id, "apiKey" 
                FROM "user" 
                WHERE "apiKey" IS NOT NULL 
                AND "apiKey" != ''
                AND "apiKey" LIKE '%:%'
            `);

      console.log(
        `📊 Encontrados ${users.length} usuarios con API keys encriptadas`,
      );

      for (const user of users) {
        const decryptedApiKey = encryptionService.decrypt(user.apiKey);

        await queryRunner.query(
          `
                    UPDATE "user" 
                    SET "apiKey" = $1 
                    WHERE id = $2
                `,
          [decryptedApiKey, user.id],
        );
      }
    } catch (error) {
      console.error('❌ Error durante la reversión:', error);
      throw error;
    }
  }
}
