import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AppProvider } from './app.provider';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly appProvider: AppProvider,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @ApiOperation({ summary: 'Get a welcome message' })
  @ApiOkResponse({ description: 'Return a welcome message.' })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiOperation({ summary: 'Get application status' })
  @ApiOkResponse({ description: 'Return the status of the application.' })
  @Get('status')
  async getStatus() {
    return this.appService.getStatus();
  }

  @ApiOperation({ summary: 'Get all routes' })
  @ApiOkResponse({ description: 'Return all routes.', type: [String] })
  @Get('routes')
  getRoutes(): string[] {
    const routes = [];
    const server = this.appProvider.getApp().getHttpServer();
    const router = server._events.request._router;

    router.stack.forEach((middleware) => {
      if (middleware.route) {
        routes.push({
          method: Object.keys(middleware.route.methods)[0].toUpperCase(),
          path: middleware.route.path,
        });
      }
    });
    return routes;
  }

  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiOkResponse({ description: 'Application is healthy' })
  @Get('health')
  getHealth() {
    // Cauce service registry expects { status, service } at GET /health.
    return {
      status: 'healthy',
      service: 'graf',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Get order table structure for debugging' })
  @ApiOkResponse({ description: 'Return order table columns' })
  @Get('debug/order-table')
  async getOrderTableStructure() {
    try {
      const result = await this.dataSource.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'order' 
        ORDER BY ordinal_position;
      `);
      return result;
    } catch (error) {
      return { error: error.message };
    }
  }
}
