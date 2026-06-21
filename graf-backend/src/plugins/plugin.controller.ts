import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConfigService } from '../config/config.service';
import { UpdateConfigDto } from '../config/dto/update-config.dto';
import { User, UserRole } from '../user/entities/user.entity';
import { PluginService } from './plugin.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('integrations')
@Controller('integrations')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class PluginController {
  constructor(
    private readonly configService: ConfigService,
    private readonly pluginService: PluginService,
  ) {}

  @Get('stores/:storeId/plugins')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar plugins configurados para una tienda (tenant)',
    description:
      'Obtiene configuración local de plugins. Para estado actualizado desde Hub Central, usa /nous/plugins',
  })
  async list(
    @Param('storeId') storeId: string,
  ): Promise<Record<string, unknown>> {
    const cfg = await this.configService.getPublicConfigByStore(storeId);
    return cfg.plugins || {};
  }

  @Put('stores/:storeId/plugins')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar plugins para una tienda (enabled, apiKey, config)',
    description:
      'Actualiza configuración local de plugins. La configuración principal está en Hub Central',
  })
  async update(
    @Param('storeId') storeId: string,
    @Body() body: { plugins: Record<string, unknown> },
  ): Promise<Record<string, unknown>> {
    const user = { id: 'system' } as unknown as User;
    const dto = { plugins: body.plugins } as unknown as UpdateConfigDto;
    const cfg = await this.configService.updateConfigByStore(
      storeId,
      user,
      dto,
    );
    return cfg.plugins || {};
  }

  @Get('stores/:storeId/nous/plugins')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener configuración de plugins desde Hub Central',
    description:
      'Obtiene configuración actual de plugins directamente desde Hub Central',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración de plugins desde Hub Central',
  })
  async getNousPlugins(
    @Param('storeId') storeId: string,
  ): Promise<Record<string, unknown>> {
    return this.pluginService.getStorePluginConfig(parseInt(storeId, 10));
  }

  @Get('nous/plugins/available')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar todos los plugins disponibles en Hub Central',
    description:
      'Obtiene lista completa de plugins disponibles para instalación',
  })
  @ApiResponse({ status: 200, description: 'Lista de plugins disponibles' })
  async getAvailablePlugins(): Promise<Record<string, unknown>> {
    return this.pluginService.getAvailablePlugins();
  }

  @Get('nous/connection')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verificar conectividad con Hub Central',
    description: 'Health check para verificar la conexión con Hub Central',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de conexión con Hub Central',
    schema: {
      type: 'object',
      properties: {
        connected: { type: 'boolean' },
        url: { type: 'string' },
        error: { type: 'string' },
      },
    },
  })
  async checkNousConnection(): Promise<Record<string, unknown>> {
    return this.pluginService.checkNousConnection();
  }
}
