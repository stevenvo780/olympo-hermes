import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { ConfigService } from './config.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Config } from './entities/config.entity';
import { UpdateConfigDto } from './dto/update-config.dto';
import { RequestWithUser } from '../auth/types';

@ApiTags('config')
@Controller('config/:storeId')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('my')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get store configuration' })
  @ApiOkResponse({
    description: 'Configuration retrieved successfully',
    type: Config,
  })
  async getMyConfig(
    @Param('storeId') storeId: string,
    @Request() req: RequestWithUser,
  ): Promise<Config> {
    return this.configService.getConfigByStore(storeId, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener la configuración pública de la tienda' })
  @ApiOkResponse({
    description: 'Configuración recuperada exitosamente',
    type: Config,
  })
  async getPublicConfig(@Param('storeId') storeId: string): Promise<Config> {
    return this.configService.getPublicConfigByStore(storeId);
  }

  @Patch('my')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store configuration' })
  @ApiOkResponse({
    description: 'Configuration updated successfully',
    type: Config,
  })
  async updateMyConfig(
    @Param('storeId') storeId: string,
    @Request() req: RequestWithUser,
    @Body() updateConfigDto: UpdateConfigDto,
  ): Promise<Config> {
    return this.configService.updateConfigByStore(
      storeId,
      req.user,
      updateConfigDto,
    );
  }
}
