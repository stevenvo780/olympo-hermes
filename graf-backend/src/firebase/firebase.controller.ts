import { Controller, Get } from '@nestjs/common';
import admin from '../utils/firebase-admin.config';

@Controller('firebase')
export class FirebaseController {
  @Get('health')
  async checkFirebaseConfig() {
    try {
      const app = admin.app();
      return {
        status: 'ok',
        projectId: app.options.projectId,
        hasCredential: !!app.options.credential,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
