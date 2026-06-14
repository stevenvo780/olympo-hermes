import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { OptionalFirebaseAuthGuard } from '../auth/optional-firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { RequestWithUser } from '../auth/types';
import { UpdateResult } from 'typeorm';
import { FindUsersDto } from './dto/find-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdateIntegrationsDto } from './dto/update-integrations.dto';

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({
    summary: 'Get users with optional filters and pagination',
  })
  @ApiOkResponse({
    description: 'List of users',
    schema: {
      properties: {
        users: {
          type: 'array',
          items: { $ref: '#/components/schemas/User' },
        },
        total: {
          type: 'number',
          description: 'Total number of users matching the filters',
        },
      },
    },
  })
  @Get()
  findAll(@Query() findUsersDto: FindUsersDto) {
    return this.userService.findAll(findUsersDto);
  }

  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a user by ID (Only Super Admin)' })
  @ApiOkResponse({ description: 'User found', type: User })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @UseGuards(OptionalFirebaseAuthGuard)
  @ApiOperation({
    summary: 'Get the authenticated user with profile and subscription',
  })
  @ApiOkResponse({
    description: 'Authenticated user successfully retrieved.',
    type: User,
  })
  @Get('me/data')
  async getMe(
    @Request() req: RequestWithUser,
  ): Promise<Partial<User> | object> {
    if (req.user) {
      return await this.userService.getUserSafeData(req.user.id);
    }
    return {};
  }

  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Actualizar datos del usuario autenticado' })
  @ApiOkResponse({
    description: 'Usuario actualizado correctamente',
    type: User,
  })
  @Patch('me')
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(req.user.id, updateUserDto);
  }

  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({
    summary: 'Actualizar email del usuario autenticado',
    description:
      'Actualiza el email tanto en Firebase Auth como en la base de datos de forma transaccional',
  })
  @ApiOkResponse({
    description: 'Email actualizado correctamente en Firebase y base de datos',
    type: User,
  })
  @Patch('me/email')
  async updateEmail(
    @Request() req: RequestWithUser,
    @Body() updateEmailDto: UpdateEmailDto,
  ): Promise<User> {
    return this.userService.updateEmail(req.user.id, updateEmailDto.email);
  }

  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: "Update a user's role by ID (Only Super Admin)",
  })
  @ApiOkResponse({
    description: 'User role updated successfully.',
  })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @Patch(':id')
  updateRole(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<Pick<User, 'role'>>,
  ): Promise<UpdateResult> {
    return this.userService.updateRole(id, updateUserDto.role);
  }

  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({
    summary: 'Generar nueva API key para el usuario autenticado',
    description:
      'Genera una nueva API key encriptada para el usuario. Si ya existe una, la reemplaza.',
  })
  @ApiOkResponse({
    description: 'API key generada correctamente',
    schema: {
      properties: {
        apiKey: {
          type: 'string',
          description: 'Nueva API key en texto plano (solo se muestra una vez)',
        },
      },
    },
  })
  @Post('me/generate-api-key')
  async generateApiKey(
    @Request() req: RequestWithUser,
  ): Promise<{ apiKey: string }> {
    return this.userService.generateApiKey(req.user.id);
  }

  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({
    summary: 'Regenerar API key para el usuario autenticado',
    description:
      'Genera una nueva API key reemplazando la anterior. La API key anterior quedará inválida.',
  })
  @ApiOkResponse({
    description: 'API key regenerada correctamente',
    schema: {
      properties: {
        apiKey: {
          type: 'string',
          description: 'Nueva API key en texto plano (solo se muestra una vez)',
        },
      },
    },
  })
  @Post('me/regenerate-api-key')
  async regenerateApiKey(
    @Request() req: RequestWithUser,
  ): Promise<{ apiKey: string }> {
    return this.userService.regenerateApiKey(req.user.id);
  }

  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({
    summary: 'Configurar credenciales de integraciones (SIGO)',
    description:
      'Actualiza las credenciales de SIGO para el usuario autenticado. Las credenciales se encriptan automáticamente.',
  })
  @ApiOkResponse({
    description: 'Credenciales de integraciones actualizadas correctamente',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Integraciones actualizadas exitosamente',
        },
        hasSigoCredentials: { type: 'boolean', example: true },
      },
    },
  })
  @Patch('me/integrations')
  async updateIntegrations(
    @Request() req: RequestWithUser,
    @Body() updateIntegrationsDto: UpdateIntegrationsDto,
  ): Promise<{
    success: boolean;
    message: string;
    hasSigoCredentials: boolean;
  }> {
    const updatedUser = await this.userService.updateIntegrations(
      req.user.id,
      updateIntegrationsDto,
    );

    return {
      success: true,
      message: 'Integraciones actualizadas exitosamente',
      hasSigoCredentials: updatedUser.hasSigoCredentials(),
    };
  }

  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({
    summary: 'Obtener estado de integraciones',
    description:
      'Obtiene el estado actual de las integraciones configuradas (sin mostrar credenciales sensibles).',
  })
  @ApiOkResponse({
    description: 'Estado de integraciones obtenido correctamente',
    schema: {
      properties: {
        hasSigoCredentials: { type: 'boolean', example: true },
        sigoApiUrl: { type: 'string', example: 'https://api.siigo.com' },
      },
    },
  })
  @Get('me/integrations/status')
  async getIntegrationStatus(@Request() req: RequestWithUser): Promise<{
    hasSigoCredentials: boolean;
    sigoApiUrl?: string;
  }> {
    return this.userService.getIntegrationStatus(req.user.id);
  }

  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({
    summary: 'Obtener credenciales para sincronización (solo interno)',
    description:
      'Endpoint interno para que HubCentral obtenga las credenciales del usuario.',
  })
  @Get('credentials/sync/:email')
  async getCredentialsForSync(@Param('email') email: string): Promise<{
    grafUserId?: string;
    sigo?: {
      apiKey?: string;
      username?: string;
      password?: string;
      apiUrl?: string;
    };
  }> {
    const credentials = await this.userService.findUserForCredentialsSync(
      email,
    );
    return credentials || {};
  }
}
