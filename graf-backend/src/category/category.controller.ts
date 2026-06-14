import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { RequestWithUser } from '../auth/types';
import { ImportCategoryExcelDto } from './dto/import-category-excel.dto';

@ApiTags('categories')
@Controller('categories/:storeId')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Create new category' })
  @ApiCreatedResponse({ type: Category })
  create(
    @Request() req: RequestWithUser,
    @Param('storeId') storeId: string,
    @Body() data: Partial<Category>,
  ): Promise<Category> {
    return this.categoryService.createCategory(data, storeId, req.user);
  }

  @ApiOperation({ summary: 'List categories for the store' })
  @ApiOkResponse({ type: [Category] })
  @Get()
  findAll(
    @Request() req: RequestWithUser,
    @Param('storeId') storeId: string,
  ): Promise<Category[]> {
    return this.categoryService.findByStore(storeId);
  }

  @ApiOperation({ summary: 'List categories in hierarchical structure' })
  @ApiOkResponse({ type: [Category] })
  @Get('hierarchical')
  findHierarchical(
    @Request() req: RequestWithUser,
    @Param('storeId') storeId: string,
  ): Promise<Category[]> {
    return this.categoryService.findByStoreHierarchical(storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiOkResponse({ type: Category })
  findOne(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
  ): Promise<Category> {
    return this.categoryService.getCategoryById(+id, storeId);
  }

  @Get(':id/hierarchy')
  @ApiOperation({ summary: 'Get hierarchy for a specific category' })
  @ApiOkResponse({ type: [Category] })
  getHierarchy(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
  ): Promise<Category[]> {
    return this.categoryService.getCategoryHierarchy(+id, storeId);
  }

  @Get('get/roots')
  @ApiOperation({
    summary: 'List root categories (without parent) for the store',
  })
  @ApiOkResponse({ type: [Category] })
  findRootCategories(@Param('storeId') storeId: string): Promise<Category[]> {
    return this.categoryService.findRootCategories(storeId);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Update a category including position' })
  @ApiOkResponse({ type: Category })
  update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Body() data: Partial<Category>,
  ): Promise<Category> {
    return this.categoryService.updateCategory(+id, data, storeId, req.user);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiOkResponse({ description: 'Category deleted' })
  remove(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('storeId') storeId: string,
  ): Promise<void> {
    return this.categoryService.deleteCategory(+id, storeId, req.user);
  }

  @Post('import-excel')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Import categories from Excel data' })
  @ApiCreatedResponse({
    description: 'Categories import results',
    schema: {
      type: 'object',
      properties: {
        created: { type: 'number' },
        updated: { type: 'number' },
        deleted: { type: 'number' },
        skipped: { type: 'number' },
        failed: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryName: { type: 'string' },
              status: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  })
  importExcel(
    @Request() req: RequestWithUser,
    @Param('storeId') storeId: string,
    @Body() dto: ImportCategoryExcelDto,
  ) {
    console.log(
      `[CategoryController] Iniciando importación Excel para store ${storeId}. Filas: ${dto.rows?.length}`,
    );
    return this.categoryService.importExcel(dto, storeId, req.user);
  }
}
