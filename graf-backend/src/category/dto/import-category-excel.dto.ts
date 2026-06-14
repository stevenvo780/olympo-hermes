import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CategoryExcelRowDto {
  @IsOptional()
  @IsNumber()
  @Transform(
    ({ value }) => {
      if (value === '' || value === undefined || value === null)
        return undefined;
      const n = Number(value);
      return Number.isNaN(n) ? undefined : n;
    },
    { toClassOnly: true },
  )
  @ApiProperty({
    description: 'ID de la categoría (opcional para creación)',
    example: 1,
    required: false,
  })
  id?: number;

  @IsString()
  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Electrónicos',
  })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Descripción de la categoría',
    example: 'Categoría para productos electrónicos',
    required: false,
  })
  description?: string;

  @IsOptional()
  @IsNumber()
  @Transform(
    ({ value }) => {
      const isNullish = value === '' || value === undefined || value === null;
      const isNullString =
        typeof value === 'string' && value.trim().toLowerCase() === 'null';
      if (isNullish || isNullString) return null;
      const n = Number(value);
      return Number.isNaN(n) ? null : n;
    },
    { toClassOnly: true },
  )
  @ApiProperty({
    description: 'ID de la categoría padre',
    example: 1,
    required: false,
  })
  parentId?: number | null;

  @IsOptional()
  @IsNumber()
  @Transform(
    ({ value }) => {
      if (value === '' || value === undefined || value === null)
        return undefined;
      const n = Number(value);
      return Number.isNaN(n) ? undefined : n;
    },
    { toClassOnly: true },
  )
  @ApiProperty({
    description: 'Posición de ordenamiento',
    example: 1,
    required: false,
  })
  position?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'URL de imagen de la categoría',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  imageUrl?: string;
}

export class ImportCategoryExcelDto {
  @IsArray()
  @ApiProperty({
    description: 'Array de categorías a importar',
    type: [CategoryExcelRowDto],
  })
  rows: CategoryExcelRowDto[];

  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }) => {
      if (value === undefined || value === null || value === '')
        return undefined;
      if (typeof value === 'boolean') return value;
      const s = String(value).trim().toLowerCase();
      if (s === 'true' || s === '1') return true;
      if (s === 'false' || s === '0') return false;
      return undefined;
    },
    { toClassOnly: true },
  )
  @ApiProperty({
    description: 'Si se deben eliminar las categorías no incluidas en el Excel',
    example: false,
    required: false,
  })
  deleteCategoriesNotInExcel?: boolean;
}
