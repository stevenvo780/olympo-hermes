import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SellerService } from './seller.service';
import { CreateSellerDto, UpdateSellerDto } from './dto/seller.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequestWithUser } from '../auth/types';
import { UserRole } from '../user/entities/user.entity';

@ApiTags('distribution/sellers')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
@Controller('distribution/sellers')
export class SellerController {
  constructor(private readonly service: SellerService) {}

  @Get()
  @ApiOperation({ summary: 'Listar vendedores' })
  findAll(@Query('storeId') storeId: string, @Request() req: RequestWithUser) {
    return this.service.findAll(storeId, req.user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('storeId') storeId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.service.findOne(+id, storeId, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Crear vendedor' })
  create(
    @Query('storeId') storeId: string,
    @Body() dto: CreateSellerDto,
    @Request() req: RequestWithUser,
  ) {
    return this.service.create(storeId ?? dto.storeId, req.user, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('storeId') storeId: string,
    @Body() dto: UpdateSellerDto,
    @Request() req: RequestWithUser,
  ) {
    return this.service.update(+id, storeId, req.user, dto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Query('storeId') storeId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.service.remove(+id, storeId, req.user);
  }
}
