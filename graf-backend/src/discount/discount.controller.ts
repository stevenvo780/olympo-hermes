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
  ParseIntPipe,
} from '@nestjs/common';
import { DiscountService } from './discount.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { Discount } from './entities/discount.entity';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { RequestWithUser } from '../auth/types';

@ApiTags('discounts')
@Controller('discounts/:storeId')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @ApiOperation({ summary: 'List discounts for the store' })
  @ApiOkResponse({ type: [Discount] })
  @Get()
  findAll(
    @Request() req: RequestWithUser,
    @Param('storeId') storeId: string,
  ): Promise<Discount[]> {
    return this.discountService.findByStore(storeId);
  }

  @ApiOperation({ summary: 'Create discount' })
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiCreatedResponse({ type: Discount })
  @Post()
  create(
    @Request() req: RequestWithUser,
    @Param('storeId') storeId: string,
    @Body() dto: CreateDiscountDto,
  ): Promise<Discount> {
    return this.discountService.create(dto, storeId, req.user);
  }

  @ApiOperation({ summary: 'Get discount by ID' })
  @ApiOkResponse({ type: Discount })
  @Get(':id')
  findOne(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('storeId') storeId: string,
  ): Promise<Discount> {
    return this.discountService.getDiscountById(+id, storeId);
  }

  @ApiOperation({ summary: 'Update discount' })
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOkResponse({ type: Discount })
  @Patch(':id')
  update(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('storeId') storeId: string,
    @Body() dto: UpdateDiscountDto,
  ): Promise<Discount> {
    return this.discountService.update(+id, dto, storeId, req.user);
  }

  @ApiOperation({ summary: 'Delete discount' })
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOkResponse()
  @Delete(':id')
  remove(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('storeId') storeId: string,
  ): Promise<void> {
    return this.discountService.remove(+id, storeId, req.user);
  }
}
