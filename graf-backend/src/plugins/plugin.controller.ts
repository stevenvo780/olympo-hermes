import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '../config/config.service';
import { UpdateConfigDto } from '../config/dto/update-config.dto';
import { User } from '../user/entities/user.entity';
import { PluginService } from './plugin.service';

@ApiTags('integrations')
@Controller('integrations')
export class PluginController {
  constructor(
    private readonly configService: ConfigService,
    private readonly pluginService: PluginService,
  ) {}

  @Get('stores/:storeId/plugins')
  @ApiOperation({
    summary: 'Listar plugins configurados para una tienda (tenant)',
    description:
      'Obtiene configuración local de plugins. Para estado actualizado desde Hub Central, usa /hub-central/plugins',
  })
  async list(
    @Param('storeId') storeId: string,
  ): Promise<Record<string, unknown>> {
    const cfg = await this.configService.getPublicConfigByStore(storeId);
    return cfg.plugins || {};
  }

  @Put('stores/:storeId/plugins')
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

  @Get('stores/:storeId/hub-central/plugins')
  @ApiOperation({
    summary: 'Obtener configuración de plugins desde Hub Central',
    description:
      'Obtiene configuración actual de plugins directamente desde Hub Central',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración de plugins desde Hub Central',
  })
  async getHubCentralPlugins(
    @Param('storeId') storeId: string,
  ): Promise<Record<string, unknown>> {
    return this.pluginService.getStorePluginConfig(parseInt(storeId, 10));
  }

  @Get('hub-central/plugins/available')
  @ApiOperation({
    summary: 'Listar todos los plugins disponibles en Hub Central',
    description:
      'Obtiene lista completa de plugins disponibles para instalación',
  })
  @ApiResponse({ status: 200, description: 'Lista de plugins disponibles' })
  async getAvailablePlugins(): Promise<Record<string, unknown>> {
    return this.pluginService.getAvailablePlugins();
  }

  @Get('hub-central/connection')
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
  async checkHubCentralConnection(): Promise<Record<string, unknown>> {
    return this.pluginService.checkHubCentralConnection();
  }
}
