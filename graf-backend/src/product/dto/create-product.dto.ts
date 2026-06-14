import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @IsString()
  @ApiProperty({
    description: 'Título del producto',
    example: 'Pack de Emojis Anime',
  })
  title: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Descripción del producto (opcional)',
    required: false,
  })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Descripción larga del producto (opcional, puede ser HTML o texto plano)',
    required: false,
  })
  longDescription?: string;

  @IsNumber()
  @ApiProperty({ description: 'Precio base del producto', example: 20.0 })
  basePrice: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'Multiplicador de precio por escasez (opcional)',
    example: 1.5,
  })
  scarcityMultiplier?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'Stock disponible (null significa infinito)',
    example: 150,
  })
  stock?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'Capacidad total de slots (opcional)',
    example: 150,
  })
  totalSlots?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ description: 'Galería de imágenes (URLs)', type: [String] })
  images?: string[];

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: 'Impuesto aplicado al producto (porcentaje)',
    example: 10.0,
  })
  tax?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: 'Cargos adicionales aplicados al producto',
    example: 2.5,
  })
  extraFees?: number;

  @IsOptional()
  @IsArray()
  @ApiProperty({
    description: 'Array de IDs de descuentos aplicados al producto',
    type: [Number],
  })
  discountIds?: number[];

  @IsOptional()
  @IsNumber()
  parentId?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ApiProperty({
    description: 'IDs de impuestos aplicados al producto',
    type: [Number],
  })
  taxIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ApiProperty({
    description: 'IDs de categorías del producto',
    type: [Number],
  })
  categoryIds?: number[];

  @IsString()
  @ApiProperty({
    description: 'SKU del producto - Identificador único entre sistemas',
    example: 'SKU-123456',
  })
  sku: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
