import { LoggerMiddleware } from './logger.middleware';

describe('LoggerMiddleware', () => {
  it('calls next handler', async () => {
    const middleware = new LoggerMiddleware();
    const next = jest.fn();

    await middleware.use({} as any, {} as any, next);

    expect(next).toHaveBeenCalled();
  });
});
