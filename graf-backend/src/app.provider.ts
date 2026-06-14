import { Injectable, INestApplication } from '@nestjs/common';

@Injectable()
export class AppProvider {
  static async closeConnection() {
    /**
     * No-op: connections are handled by TypeORM module
     */
  }
  private app: INestApplication;

  setApp(app: INestApplication) {
    this.app = app;
  }

  getApp(): INestApplication {
    return this.app;
  }
}

export default AppProvider;
