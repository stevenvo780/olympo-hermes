import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @ValidateIf((o) => o.stock !== undefined)
  @IsNumber()
  @ApiPropertyOptional({
    description: 'Stock disponible (null para infinito)',
    nullable: true,
  })
  stock?: number | null;

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({
    type: [Number],
    description: 'IDs de impuestos ([] para limpiar)',
  })
  taxIds?: number[];

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({
    type: [Number],
    description: 'IDs de descuentos ([] para limpiar)',
  })
  discountIds?: number[];

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({
    type: [Number],
    description: 'IDs de categorías ([] para limpiar)',
  })
  categoryIds?: number[];

  @IsOptional()
  @ApiPropertyOptional({
    description: 'ID del padre (0 o null para limpiar)',
    nullable: true,
  })
  parentId?: number | null;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'SKU (único por tienda)' })
  sku?: string;
}
