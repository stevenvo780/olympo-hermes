import { AppProvider } from './app.provider';
import { INestApplication } from '@nestjs/common';

describe('AppProvider', () => {
  it('stores and returns the app instance', () => {
    const provider = new AppProvider();
    const app = {
      getHttpServer: jest.fn(),
    } as unknown as INestApplication;

    provider.setApp(app);

    expect(provider.getApp()).toBe(app);
  });

  it('closeConnection is a safe no-op', async () => {
    await expect(AppProvider.closeConnection()).resolves.toBeUndefined();
  });
});
