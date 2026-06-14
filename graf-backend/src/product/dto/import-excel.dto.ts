import { IsArray, IsString, IsOptional, IsBoolean } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

export class ImportExcelRowDto extends CreateProductDto {
  @IsString()
  action: 'create' | 'update' | 'delete';

  @IsOptional()
  @IsString()
  parentSku?: string;
}

export class ImportExcelDto {
  @IsArray()
  rows: ImportExcelRowDto[];

  @IsOptional()
  @IsBoolean()
  deleteProductsNotInExcel?: boolean;
}
