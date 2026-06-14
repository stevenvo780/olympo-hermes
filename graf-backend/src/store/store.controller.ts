import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  Post,
} from '@nestjs/common';
import { RequestWithUser } from '../auth/types';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { StoreService } from './store.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { ConfigService } from '../config/config.service';
import { User } from '../user/entities/user.entity';

@ApiTags('stores')
@Controller('store')
export class StoreController {
  constructor(
    private readonly storeService: StoreService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all stores' })
  @ApiOkResponse({ description: 'List of stores' })
  findAll() {
    return this.storeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a store by id' })
  @ApiOkResponse({ description: 'Store details' })
  findOne(@Param('id') id: string) {
    return this.storeService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Update a store by id' })
  @ApiOkResponse({ description: 'Store updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
    @Request() req: RequestWithUser,
  ) {
    return this.storeService.update(id, updateStoreDto, req.user);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Delete a store by id' })
  @ApiOkResponse({ description: 'Store deleted successfully' })
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.storeService.remove(id, req.user);
  }

  @Get('get/my')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({
    summary: 'Consulta las tiendas asociadas al usuario logueado',
  })
  @ApiOkResponse({ description: 'Lista de tiendas del usuario' })
  getMyStores(@Request() req: RequestWithUser) {
    const userId = req.user.id;
    return this.storeService.findStoresForUser(userId);
  }

  @Get('domain/:domain')
  @ApiOperation({ summary: 'Obtener tienda por dominio' })
  @ApiOkResponse({
    description: 'Tienda encontrada exitosamente',
    type: Object,
  })
  async getStoreByDomain(@Param('domain') domain: string) {
    return this.configService.getStoreByDomain(domain);
  }

  @Post(':id/team/add')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Add a team member to a store' })
  @ApiCreatedResponse({ description: 'Team member added successfully' })
  addTeamMember(
    @Param('id') storeId: string,
    @Request() req: RequestWithUser,
    @Body()
    data: Partial<{
      email: string;
    }>,
  ) {
    return this.storeService.addTeamMember(storeId, data.email, req.user);
  }

  @Delete(':id/team/remove/:userId')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Remove a team member from a store' })
  @ApiOkResponse({ description: 'Team member removed successfully' })
  removeTeamMember(
    @Param('id') storeId: string,
    @Param('userId') teamMemberId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.storeService.removeTeamMember(storeId, teamMemberId, req.user);
  }

  @Get(':id/team')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get team members for a store' })
  @ApiOkResponse({
    description: 'Team members retrieved successfully',
    type: [User],
  })
  getTeamMembers(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.storeService.getTeamMembers(id, req.user);
  }
}
