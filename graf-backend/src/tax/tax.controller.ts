import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TaxService } from './tax.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { Tax } from './entities/tax.entity';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { RequestWithUser } from '../auth/types';

@ApiTags('taxes')
@Controller('taxes/:storeId')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @ApiOperation({ summary: 'List taxes for the store' })
  @ApiOkResponse({ type: [Tax] })
  @Get()
  findMyTaxes(
    @Request() req: RequestWithUser,
    @Param('storeId') storeId: string,
  ): Promise<Tax[]> {
    return this.taxService.findByStore(storeId);
  }

  @ApiOperation({ summary: 'Get a tax by ID' })
  @ApiOkResponse({ type: Tax })
  @Get(':id')
  findOne(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('storeId') storeId: string,
  ): Promise<Tax> {
    return this.taxService.getTaxById(+id, storeId);
  }

  @ApiOperation({ summary: 'Create a tax' })
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiCreatedResponse({ type: Tax })
  @Post()
  create(
    @Request() req: RequestWithUser,
    @Param('storeId') storeId: string,
    @Body() dto: CreateTaxDto,
  ): Promise<Tax> {
    return this.taxService.create(dto, storeId, req.user);
  }

  @ApiOperation({ summary: 'Update a tax' })
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOkResponse({ type: Tax })
  @Patch(':id')
  update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Body() dto: UpdateTaxDto,
  ): Promise<Tax> {
    return this.taxService.update(+id, dto, storeId, req.user);
  }

  @ApiOperation({ summary: 'Delete a tax' })
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOkResponse()
  @Delete(':id')
  remove(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('storeId') storeId: string,
  ): Promise<void> {
    return this.taxService.remove(+id, storeId, req.user);
  }
}
