import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { DashboardStatisticsDto } from './dto/dashboard-statistics.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequestWithUser } from '../auth/types';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener estadísticas para el dashboard de ecommerce',
  })
  @ApiOkResponse({ type: DashboardStatisticsDto })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month'], required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({
    name: 'storeId',
    required: false,
    description: 'ID de tienda específica para filtrar estadísticas',
  })
  getDashboardStats(
    @Request() req: RequestWithUser,
    @Query('period') period: 'day' | 'week' | 'month' = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('storeId') storeId?: string,
  ): Promise<DashboardStatisticsDto> {
    return this.statisticsService.getDashboardStatistics(
      req.user.id,
      period,
      startDate,
      endDate,
      storeId,
    );
  }
}
